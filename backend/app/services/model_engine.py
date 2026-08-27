from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import accuracy_score, f1_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from app.services.feature_engine import FEATURE_DESCRIPTIONS
from app.models.schemas import ModelPredictionDetail, FeatureImportanceItem

class ModelEngine:
    def __init__(self, fast_mode: bool = True):
        self.fast_mode = fast_mode
        self.models: Dict[str, Any] = {}
        self.best_thresholds: Dict[str, float] = {}
        self.eval_metrics: Dict[str, Dict[str, float]] = {}

    def train_models(self, X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series):
        """
        5대 모델 학습 및 평가
        """
        # 1. Base Classifiers
        neg_count = sum(y_train == 0)
        pos_count = sum(y_train == 1)
        scale_pos = (neg_count / pos_count) if pos_count > 0 else 1.0

        base_xgb = XGBClassifier(random_state=42, scale_pos_weight=scale_pos, eval_metric='logloss')
        base_rf = RandomForestClassifier(random_state=42, class_weight='balanced')
        base_lgbm = LGBMClassifier(random_state=42, verbose=-1, class_weight='balanced')
        base_lr = LogisticRegression(random_state=42, class_weight='balanced', max_iter=1000)

        # Time-decay Sample Weights
        sample_weights = np.linspace(0.1, 1.0, len(y_train))

        if self.fast_mode:
            # 빠른 서빙을 위한 검증된 고정 최적 파라미터
            best_xgb = XGBClassifier(
                n_estimators=100, learning_rate=0.03, max_depth=4,
                subsample=0.8, colsample_bytree=0.8, random_state=42,
                scale_pos_weight=scale_pos, eval_metric='logloss'
            )
            best_rf = RandomForestClassifier(n_estimators=100, max_depth=7, min_samples_split=3, class_weight='balanced', random_state=42)
            best_lgbm = LGBMClassifier(n_estimators=100, learning_rate=0.03, max_depth=4, class_weight='balanced', verbose=-1, random_state=42)
            best_lr = LogisticRegression(C=0.1, class_weight='balanced', max_iter=1000, random_state=42)
        else:
            # TimeSeriesSplit 기반 하이퍼파라미터 최적화
            tscv = TimeSeriesSplit(n_splits=3)
            xgb_params = {'n_estimators': [100, 200], 'learning_rate': [0.01, 0.03, 0.05], 'max_depth': [3, 4, 5]}
            rf_params = {'n_estimators': [100, 200], 'max_depth': [5, 7, 10], 'min_samples_split': [2, 5]}
            lgbm_params = {'n_estimators': [100, 200], 'learning_rate': [0.01, 0.03, 0.05], 'max_depth': [3, 4, 5]}
            lr_params = {'C': [0.01, 0.1, 1, 10]}

            search_xgb = RandomizedSearchCV(base_xgb, xgb_params, n_iter=4, cv=tscv, scoring='f1_macro', n_jobs=-1, random_state=42)
            search_rf = RandomizedSearchCV(base_rf, rf_params, n_iter=4, cv=tscv, scoring='f1_macro', n_jobs=-1, random_state=42)
            search_lgbm = RandomizedSearchCV(base_lgbm, lgbm_params, n_iter=4, cv=tscv, scoring='f1_macro', n_jobs=-1, random_state=42)
            search_lr = RandomizedSearchCV(base_lr, lr_params, n_iter=3, cv=tscv, scoring='f1_macro', n_jobs=-1, random_state=42)

            search_xgb.fit(X_train, y_train)
            search_rf.fit(X_train, y_train)
            search_lgbm.fit(X_train, y_train)
            search_lr.fit(X_train, y_train)

            best_xgb = search_xgb.best_estimator_
            best_rf = search_rf.best_estimator_
            best_lgbm = search_lgbm.best_estimator_
            best_lr = search_lr.best_estimator_

        ensemble = VotingClassifier(
            estimators=[('XGB', best_xgb), ('RF', best_rf), ('LGBM', best_lgbm), ('LR', best_lr)],
            voting='soft'
        )

        self.models = {
            'XGB': best_xgb,
            'RF': best_rf,
            'LGBM': best_lgbm,
            'LR': best_lr,
            'Ensemble': ensemble
        }

        # 개별 모델 학습 및 임계치/지표 산출
        for name, model in self.models.items():
            try:
                model.fit(X_train, y_train, sample_weight=sample_weights)
            except Exception:
                try:
                    model.fit(
                        X_train, y_train,
                        XGB__sample_weight=sample_weights,
                        RF__sample_weight=sample_weights,
                        LGBM__sample_weight=sample_weights,
                        LR__sample_weight=sample_weights
                    )
                except Exception:
                    model.fit(X_train, y_train)

            # Train Set 내부에서 최적 Threshold 탐색 (Data Leakage 차단)
            probs_train = model.predict_proba(X_train)[:, 1]
            best_thresh = 0.5
            best_f1 = 0.0
            for th in np.arange(0.40, 0.60, 0.02):
                preds_th = (probs_train > th).astype(int)
                score = f1_score(y_train, preds_th, average='macro', zero_division=0)
                if score > best_f1:
                    best_f1 = score
                    best_thresh = float(th)

            self.best_thresholds[name] = best_thresh

            # Test Set Out-of-Sample 검증
            probs_test = model.predict_proba(X_test)[:, 1]
            final_preds = (probs_test > best_thresh).astype(int)
            acc = float(accuracy_score(y_test, final_preds))
            f1 = float(f1_score(y_test, final_preds, average='macro', zero_division=0))

            self.eval_metrics[name] = {
                'accuracy': round(acc, 4),
                'f1_score': round(f1, 4),
                'threshold': round(best_thresh, 4)
            }

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

        # 다음 거래일 계산 (주말 건너뛰기)
        target_date_obj = last_date_obj + timedelta(days=1)
        if target_date_obj.weekday() == 5: # 토요일 -> 월요일
            target_date_obj += timedelta(days=2)
        elif target_date_obj.weekday() == 6: # 일요일 -> 월요일
            target_date_obj += timedelta(days=1)

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
            'target_date': target_date_obj.strftime('%Y-%m-%d'),
            'overall_direction': overall_direction,
            'overall_signal': overall_signal,
            'avg_probability': round(avg_prob, 4),
            'confidence_score': confidence_score,
            'ai_opinion': opinion,
            'models': model_details
        }

    def get_feature_importances(self, features: List[str], model_name: str = 'XGB') -> List[FeatureImportanceItem]:
        """
        모델의 피처 중요도 반환
        """
        model = self.models.get(model_name)
        if model is None or not hasattr(model, 'feature_importances_'):
            # 모델이 피처 중요도를 직접 지원하지 않으면 XGBoost로 대체
            model = self.models.get('XGB')

        if model is not None and hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            total = float(np.sum(importances))
            if total > 0:
                normalized = importances / total
            else:
                normalized = importances

            items = []
            for feat, imp in zip(features, normalized):
                desc = FEATURE_DESCRIPTIONS.get(feat, feat)
                items.append(FeatureImportanceItem(
                    feature=feat,
                    importance=round(float(imp), 4),
                    description=desc
                ))

            # 중요도 내림차순 정렬 후 상위 15개
            items = sorted(items, key=lambda x: x.importance, reverse=True)[:15]
            return items
        
        return []
