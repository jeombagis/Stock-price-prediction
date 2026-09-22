import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, f1_score

from app.config import AppConfig, SAVED_MODELS_DIR
from app.services.feature_engine import BASE_FEATURE_DESCRIPTIONS
from app.models.schemas import ModelPredictionDetail, FeatureImportanceItem

logger = logging.getLogger(__name__)

_ENGINE_CACHE: Dict[str, "ModelEngine"] = {}

# 미국 증시 주요 공휴일 (매년 고정일 + 근사일)
_US_MARKET_HOLIDAYS_FIXED = {
    (1, 1),   # New Year's Day
    (7, 4),   # Independence Day
    (12, 25), # Christmas Day
}


def _is_us_market_holiday(d: date) -> bool:
    """미국 증시 공휴일 여부를 간이 판정 (주요 고정 공휴일 + 주말)"""
    if d.weekday() >= 5:  # 토/일
        return True
    if (d.month, d.day) in _US_MARKET_HOLIDAYS_FIXED:
        return True
    # Martin Luther King Jr. Day: 1월 셋째 월요일
    if d.month == 1 and d.weekday() == 0 and 15 <= d.day <= 21:
        return True
    # Presidents' Day: 2월 셋째 월요일
    if d.month == 2 and d.weekday() == 0 and 15 <= d.day <= 21:
        return True
    # Memorial Day: 5월 마지막 월요일
    if d.month == 5 and d.weekday() == 0 and d.day >= 25:
        return True
    # Labor Day: 9월 첫째 월요일
    if d.month == 9 and d.weekday() == 0 and d.day <= 7:
        return True
    # Thanksgiving: 11월 넷째 목요일
    if d.month == 11 and d.weekday() == 3 and 22 <= d.day <= 28:
        return True
    return False


def _next_trading_day(from_date: date) -> date:
    """다음 거래일 계산 (주말 + 미국 공휴일 건너뛰기)"""
    candidate = from_date + timedelta(days=1)
    max_attempts = 10
    for _ in range(max_attempts):
        if not _is_us_market_holiday(candidate):
            return candidate
        candidate += timedelta(days=1)
    return candidate


class ModelEngine:
    def __init__(self, fast_mode: bool = True):
        self.fast_mode = fast_mode
        self.asset_key: Optional[str] = None
        self.models: Dict[str, Any] = {}
        self.best_thresholds: Dict[str, float] = {}
        self.eval_metrics: Dict[str, Dict[str, float]] = {}
        self.features: List[str] = []
        self.scaler: Any = None
        self.train_date: str = ""
        self.total_records: int = 0
        self.X_test: Optional[pd.DataFrame] = None
        self.y_test: Optional[pd.Series] = None
        self.df_test: Optional[pd.DataFrame] = None

    @classmethod
    def get_pretrained_engine(cls, asset_key: str, force_reload: bool = False) -> "ModelEngine":
        """
        saved_models/ 폴더에서 사전 학습된 모델 번들과 스케일러를 로드하여 싱글톤 캐싱
        """
        norm_key = AppConfig.resolve_asset_key(asset_key) or "SnP500"

        if not force_reload and norm_key in _ENGINE_CACHE:
            return _ENGINE_CACHE[norm_key]

        bundle_path = SAVED_MODELS_DIR / f"models_{norm_key}.pkl"
        scaler_path = SAVED_MODELS_DIR / f"scaler_{norm_key}.pkl"

        if not bundle_path.exists() or not scaler_path.exists():
            raise FileNotFoundError(
                f"'{norm_key}'의 사전 학습 모델 파일(.pkl)을 찾을 수 없습니다. "
                f"model/train_models.py를 실행하여 모델을 생성해 주세요."
            )

        logger.info(f"[{norm_key}] 사전 학습 모델 로딩: {bundle_path}")
        bundle = joblib.load(bundle_path)
        scaler = joblib.load(scaler_path)

        engine = cls(fast_mode=False)
        engine.asset_key = norm_key
        engine.models = bundle.get("models", {})
        engine.best_thresholds = bundle.get("best_thresholds", {})
        engine.eval_metrics = bundle.get("eval_metrics", {})
        engine.features = bundle.get("features", [])
        engine.train_date = bundle.get("train_date", "")
        engine.total_records = bundle.get("total_records", 0)
        engine.X_test = bundle.get("X_test", None)
        engine.y_test = bundle.get("y_test", None)
        engine.df_test = bundle.get("df_test", None)
        engine.scaler = scaler

        _ENGINE_CACHE[norm_key] = engine
        logger.info(f"[{norm_key}] 모델 로딩 완료 (피처 {len(engine.features)}개, 모델 {len(engine.models)}개)")
        return engine

    def scale_features(self, X_raw: pd.DataFrame) -> pd.DataFrame:
        """
        사전 학습된 스케일러를 사용하여 입력 피처를 스케일링
        """
        if self.scaler is None:
            raise ValueError("스케일러가 초기화되지 않았습니다.")

        cols = self.features if self.features else X_raw.columns.tolist()
        scaled = self.scaler.transform(X_raw[cols])
        return pd.DataFrame(scaled, columns=cols, index=X_raw.index)

    def predict_next_day(self, X_last: pd.DataFrame, last_row_df: pd.Series) -> Dict[str, Any]:
        """
        가장 최신 데이터를 바탕으로 익일 주가 예측 수행
        """
        # 날짜 계산
        last_date_str = str(last_row_df['date'])
        try:
            last_date_obj = datetime.strptime(last_date_str.replace('-', ''), '%Y%m%d')
        except Exception:
            last_date_obj = datetime.now()

        # 다음 거래일 계산 (주말 + 미국 공휴일 건너뛰기)
        target_date_obj = _next_trading_day(last_date_obj.date())

        model_details: Dict[str, ModelPredictionDetail] = {}
        probabilities = []

        for name, model in self.models.items():
            prob = float(model.predict_proba(X_last)[0][1])
            thresh = self.best_thresholds.get(name, 0.5)
            signal = 1 if prob >= thresh else 0
            direction = "상승" if signal == 1 else "하락/보합"

            metrics = self.eval_metrics.get(name, {})
            model_details[name] = ModelPredictionDetail(
                model_name=name,
                signal=signal,
                direction=direction,
                probability=round(prob, 4),
                f1_score=metrics.get('f1_score'),
                accuracy=metrics.get('accuracy')
            )
            probabilities.append(prob)

        avg_prob = float(np.mean(probabilities))
        overall_signal = 1 if avg_prob >= 0.5 else 0
        overall_direction = "상승 우세 ↑" if avg_prob >= 0.52 else ("하락/보합 우세 ↓" if avg_prob <= 0.48 else "중립 / 관망 ↔")

        # 신뢰도 스코어 (0.5에서 멀어질수록 높은 신뢰도)
        confidence_score = round(abs(avg_prob - 0.5) * 200, 1)

        # AI 종합 의견 생성
        if avg_prob >= 0.60:
            opinion = "여러 AI 모델의 합의 결과 강한 상승 모멘텀이 포착되었습니다. 긍정적인 비중 확대를 고려할 수 있습니다."
        elif avg_prob >= 0.52:
            opinion = "단기 완만한 상승 가능성이 높으나, 보조지표 및 시장 변동성을 고려하여 분할 접근을 권장합니다."
        elif avg_prob >= 0.47:
            opinion = "방향성이 모호한 중립/혼조세 구간입니다. 명확한 추세 전환 신호가 나타날 때까지 관망을 추천합니다."
        elif avg_prob >= 0.40:
            opinion = "단기 조정 또는 하락 가능성이 높습니다. 신규 진입을 자제하고 리스크 관리가 필요한 시점입니다."
        else:
            opinion = "강한 하락 압력이 예상됩니다. 손절선 설정 및 방어적 포지션 유지가 권고됩니다."

        return {
            'base_date': last_date_obj.strftime('%Y-%m-%d'),
            'target_date': datetime.combine(target_date_obj, datetime.min.time()).strftime('%Y-%m-%d'),
            'overall_direction': overall_direction,
            'overall_signal': overall_signal,
            'avg_probability': round(avg_prob, 4),
            'confidence_score': confidence_score,
            'ai_opinion': opinion,
            'models': model_details
        }

    def get_feature_importances(self, features: List[str], model_name: str = 'XGB') -> List[FeatureImportanceItem]:
        """
        모델의 피처 중요도 반환. 피처 중요도를 지원하지 않는 모델은 XGBoost로 대체하여 반환합니다.
        """
        actual_model_name = model_name
        model = self.models.get(model_name)

        if model is None or not hasattr(model, 'feature_importances_'):
            # 모델이 피처 중요도를 직접 지원하지 않으면 XGBoost로 대체
            fallback = self.models.get('XGB')
            if fallback is not None and hasattr(fallback, 'feature_importances_'):
                model = fallback
                actual_model_name = 'XGB'
                logger.info(f"'{model_name}' 모델은 피처 중요도를 지원하지 않아 XGBoost 중요도를 반환합니다.")
            else:
                logger.warning(f"피처 중요도를 제공할 수 있는 모델이 없습니다.")
                return []

        if model is not None and hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            total = float(np.sum(importances))
            if total > 0:
                normalized = importances / total
            else:
                normalized = importances

            items = []
            for feat, imp in zip(features, normalized):
                desc = BASE_FEATURE_DESCRIPTIONS.get(feat, feat)
                items.append(FeatureImportanceItem(
                    feature=feat,
                    importance=round(float(imp), 4),
                    description=desc
                ))

            # 중요도 내림차순 정렬 후 상위 15개
            items = sorted(items, key=lambda x: x.importance, reverse=True)[:15]
            return items

        return []
