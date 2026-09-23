import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
from app.models.schemas import BacktestRecord, BacktestSummaryResponse
from app.services.model_engine import ModelEngine, _next_trading_day

logger = logging.getLogger(__name__)


class BacktestService:
    @staticmethod
    def generate_backtest_summary(
        asset_name: str,
        model_engine: ModelEngine,
        df_test: Optional[pd.DataFrame] = None,
        X_test: Optional[pd.DataFrame] = None,
        lookback_days: int = 20,
        processed_df: Optional[pd.DataFrame] = None
    ) -> BacktestSummaryResponse:
        """
        최근 lookback_days 거래일 동안의 일별 AI 예측과 실제 주가 등락 결과를 비교하고 적중률을 계산합니다.
        processed_df가 주어지면 가장 최신의 완료된 실제 거래일 데이터를 동적으로 슬라이싱하여 백테스팅을 산출합니다.
        """
        # 1. 평가 대상 데이터셋 및 피처 준비
        if processed_df is not None and not processed_df.empty:
            # 마지막 행은 당일/가장 최근 거래일로 아직 익일 종가(수익률)가 미확정 상태이므로 제외
            # 익일 결과가 확정된 완료 거래일(iloc[:-1]) 중 최근 lookback_days 거래일 추출
            completed_df = processed_df.iloc[:-1] if len(processed_df) > 1 else processed_df
            actual_lookback = min(lookback_days, len(completed_df))
            recent_df = completed_df.tail(actual_lookback).copy().reset_index(drop=True)
            feat_cols = model_engine.features if model_engine.features else [c for c in recent_df.columns if c in model_engine.models]
            recent_X = model_engine.scale_features(recent_df[feat_cols]).reset_index(drop=True)
        elif df_test is not None and not df_test.empty and X_test is not None and not X_test.empty:
            actual_lookback = min(lookback_days, len(df_test))
            recent_df = df_test.tail(actual_lookback).copy().reset_index(drop=True)
            recent_X = X_test.tail(actual_lookback).copy().reset_index(drop=True)
        else:
            return BacktestSummaryResponse(
                asset_name=asset_name,
                total_days=0,
                hit_count=0,
                hit_ratio_pct=0.0,
                out_of_sample_acc=0.0,
                out_of_sample_f1=0.0,
                history=[]
            )

        if actual_lookback == 0:
            return BacktestSummaryResponse(
                asset_name=asset_name,
                total_days=0,
                hit_count=0,
                hit_ratio_pct=0.0,
                out_of_sample_acc=0.0,
                out_of_sample_f1=0.0,
                history=[]
            )

        # 2. 모델별 배치 예측 수행 (루프 오버헤드 최소화)
        xgb_model = model_engine.models.get('XGB')
        rf_model = model_engine.models.get('RF')
        lgbm_model = model_engine.models.get('LGBM')
        ensemble_model = model_engine.models.get('Ensemble')

        xgb_probs = xgb_model.predict_proba(recent_X)[:, 1] if xgb_model is not None else [0.5] * actual_lookback
        rf_probs = rf_model.predict_proba(recent_X)[:, 1] if rf_model is not None else [0.5] * actual_lookback
        lgbm_probs = lgbm_model.predict_proba(recent_X)[:, 1] if lgbm_model is not None else [None] * actual_lookback
        ens_probs = ensemble_model.predict_proba(recent_X)[:, 1] if ensemble_model is not None else xgb_probs

        xgb_thresh = model_engine.best_thresholds.get('XGB', 0.5)
        rf_thresh = model_engine.best_thresholds.get('RF', 0.5)
        lgbm_thresh = model_engine.best_thresholds.get('LGBM', 0.5)
        ens_thresh = model_engine.best_thresholds.get('Ensemble', 0.5)

        records: List[BacktestRecord] = []
        hit_count = 0

        for i in range(actual_lookback):
            row = recent_df.iloc[i]
            xgb_prob = float(xgb_probs[i])
            rf_prob = float(rf_probs[i])
            lgbm_prob = float(lgbm_probs[i]) if lgbm_probs[i] is not None else None
            ensemble_prob = float(ens_probs[i])

            xgb_label = "상승" if xgb_prob >= xgb_thresh else "하락"
            rf_label = "상승" if rf_prob >= rf_thresh else "하락"
            lgbm_label = ("상승" if lgbm_prob >= lgbm_thresh else "하락") if lgbm_prob is not None else None
            ensemble_label = "상승" if ensemble_prob >= ens_thresh else "하락"

            # 날짜 포맷
            raw_date = str(row['date']).replace('-', '')
            try:
                base_dt = datetime.strptime(raw_date, '%Y%m%d')
            except Exception:
                base_dt = datetime.now()

            # target_date 결정: 데이터셋에 target_date 컬럼이 있으면 우선 적용
            target_date_str = None
            if 'target_date' in row and pd.notnull(row['target_date']):
                raw_target = str(row['target_date']).replace('-', '').split('.')[0]
                if len(raw_target) == 8:
                    target_date_str = f"{raw_target[:4]}-{raw_target[4:6]}-{raw_target[6:]}"

            if not target_date_str:
                target_dt = _next_trading_day(base_dt.date())
                target_date_str = datetime.combine(target_dt, datetime.min.time()).strftime('%Y-%m-%d')

            # 실제 등락 결과
            actual_ret = float(row.get('Next_Return', 0.0))
            actual_dir = "상승" if actual_ret > 0 else "하락/보합"

            # 앙상블 기준 적중 여부 (실제 수익률 방향과 일치 여부)
            pred_is_up = (ensemble_prob >= ens_thresh)
            actual_is_up = (actual_ret > 0)
            is_hit = (pred_is_up == actual_is_up)
            if is_hit:
                hit_count += 1

            records.append(BacktestRecord(
                base_date=base_dt.strftime('%Y-%m-%d'),
                target_date=target_date_str,
                xgb_label=xgb_label,
                xgb_prob=round(xgb_prob, 4),
                rf_label=rf_label,
                rf_prob=round(rf_prob, 4),
                lgbm_label=lgbm_label,
                lgbm_prob=round(lgbm_prob, 4) if lgbm_prob is not None else None,
                ensemble_label=ensemble_label,
                ensemble_prob=round(ensemble_prob, 4),
                actual_return_pct=round(actual_ret * 100, 2),
                actual_direction=actual_dir,
                is_hit=is_hit
            ))

        hit_ratio = round((hit_count / actual_lookback) * 100, 1) if actual_lookback > 0 else 0.0

        ensemble_metrics = model_engine.eval_metrics.get('Ensemble', {})
        acc = ensemble_metrics.get('accuracy', 0.0)
        f1 = ensemble_metrics.get('f1_score', 0.0)

        # 최신 거래일이 맨 위로 오도록 역순 정렬
        records_reversed = list(reversed(records))

        thresholds_dict = {k: round(float(v), 4) for k, v in model_engine.best_thresholds.items()} if hasattr(model_engine, 'best_thresholds') else {}

        return BacktestSummaryResponse(
            asset_name=asset_name,
            total_days=actual_lookback,
            hit_count=hit_count,
            hit_ratio_pct=hit_ratio,
            out_of_sample_acc=acc,
            out_of_sample_f1=f1,
            thresholds=thresholds_dict,
            history=records_reversed
        )
