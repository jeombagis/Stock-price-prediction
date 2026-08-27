from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
from app.models.schemas import BacktestRecord, BacktestSummaryResponse
from app.services.model_engine import ModelEngine

class BacktestService:
    @staticmethod
    def generate_backtest_summary(
        asset_name: str,
        model_engine: ModelEngine,
        df_test: pd.DataFrame,
        X_test: pd.DataFrame,
        lookback_days: int = 20
    ) -> BacktestSummaryResponse:
        """
        최근 lookback_days 거래일 동안의 일별 AI 예측과 실제 주가 등락 결과를 비교하고 적중률을 계산합니다.
        """
        actual_lookback = min(lookback_days, len(df_test))
        recent_df = df_test.tail(actual_lookback).reset_index(drop=True)
        recent_X = X_test.tail(actual_lookback).reset_index(drop=True)

        records: List[BacktestRecord] = []
        hit_count = 0

        for i in range(len(recent_df)):
            row = recent_df.iloc[i]
            feat = recent_X.iloc[[i]]

            # 날짜 포맷
            raw_date = str(row['date']).replace('-', '')
            try:
                base_dt = datetime.strptime(raw_date, '%Y%m%d')
            except Exception:
                base_dt = datetime.now()
            
            target_dt = base_dt + timedelta(days=1)
            if target_dt.weekday() == 5:
                target_dt += timedelta(days=2)
            elif target_dt.weekday() == 6:
                target_dt += timedelta(days=1)

            # 모델별 예측 확률
            xgb_prob = float(model_engine.models['XGB'].predict_proba(feat)[0][1]) if 'XGB' in model_engine.models else 0.5
            rf_prob = float(model_engine.models['RF'].predict_proba(feat)[0][1]) if 'RF' in model_engine.models else 0.5
            lgbm_prob = float(model_engine.models['LGBM'].predict_proba(feat)[0][1]) if 'LGBM' in model_engine.models else None
            ensemble_prob = float(model_engine.models['Ensemble'].predict_proba(feat)[0][1]) if 'Ensemble' in model_engine.models else xgb_prob

            xgb_thresh = model_engine.best_thresholds.get('XGB', 0.5)
            rf_thresh = model_engine.best_thresholds.get('RF', 0.5)
            ens_thresh = model_engine.best_thresholds.get('Ensemble', 0.5)

            xgb_label = "상승" if xgb_prob >= xgb_thresh else "하락"
            rf_label = "상승" if rf_prob >= rf_thresh else "하락"
            lgbm_label = ("상승" if lgbm_prob >= 0.5 else "하락") if lgbm_prob is not None else None
            ensemble_label = "상승" if ensemble_prob >= ens_thresh else "하락"

            # 실제 등락 결과
            actual_ret = float(row.get('Next_Return', 0.0))
            actual_dir = "상승" if actual_ret > 0 else "하락/보합"

            # 앙상블 기준 적중 여부 (또는 실제 수익률 방향과 일치 여부)
            pred_is_up = (ensemble_prob >= ens_thresh)
            actual_is_up = (actual_ret > 0)
            is_hit = (pred_is_up == actual_is_up)
            if is_hit:
                hit_count += 1

            records.append(BacktestRecord(
                base_date=base_dt.strftime('%Y-%m-%d'),
                target_date=target_dt.strftime('%Y-%m-%d'),
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

        return BacktestSummaryResponse(
            asset_name=asset_name,
            total_days=actual_lookback,
            hit_count=hit_count,
            hit_ratio_pct=hit_ratio,
            out_of_sample_acc=acc,
            out_of_sample_f1=f1,
            history=records_reversed
        )
