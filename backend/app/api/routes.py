from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
import pandas as pd

from app.config import AppConfig
from app.models.schemas import (
    AssetsResponse, AssetInfo, PredictionOverviewResponse,
    FeatureImportanceResponse, BacktestSummaryResponse,
    ChartResponse, ChartPoint, RetrainRequest, RetrainResponse
)
from app.services.data_service import DataService
from app.services.feature_engine import FeatureEngine
from app.services.model_engine import ModelEngine
from app.services.backtest_service import BacktestService

router = APIRouter(prefix="/api", tags=["Stock Prediction"])

# 메모리 파이프라인 캐시
_pipeline_cache: Dict[str, Dict[str, Any]] = {}

def _run_pipeline(
    identifier: str,
    window_size: int = AppConfig.WINDOW_SIZE,
    threshold: float = AppConfig.THRESHOLD,
    train_split: float = AppConfig.TRAIN_SPLIT,
    fast_mode: bool = True,
    force_download: bool = False
) -> Dict[str, Any]:
    """
    데이터 로드, 피처 엔지니어링, 모델 학습 파이프라인 일괄 실행 및 캐싱
    """
    cache_key = f"{identifier}_{window_size}_{threshold}_{train_split}_{fast_mode}"
    if not force_download and cache_key in _pipeline_cache:
        return _pipeline_cache[cache_key]

    try:
        raw_df, asset_name, ticker = DataService.get_stock_data(identifier, force_download=force_download)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    if len(raw_df) < 100:
        raise HTTPException(status_code=400, detail=f"학습에 필요한 데이터 수가 부족합니다 (현재 {len(raw_df)}개, 최소 100개 필요)")

    feature_engine = FeatureEngine(window_size=window_size, threshold=threshold)
    processed_df = feature_engine.compute_technical_indicators(raw_df)

    if len(processed_df) < 50:
        raise HTTPException(status_code=400, detail="보조지표 계산 후 유효 데이터 수가 부족합니다.")

    X_train, X_test, y_train, y_test, df_test = feature_engine.split_and_scale(processed_df, train_split=train_split)

    model_engine = ModelEngine(fast_mode=fast_mode)
    model_engine.train_models(X_train, y_train, X_test, y_test)

    # 최신 데이터로 익일 예측
    X_last = X_test.iloc[[-1]]
    last_row_df = df_test.iloc[-1]
    pred_res = model_engine.predict_next_day(X_last, last_row_df)

    # 가격 정보 계산
    latest_close = float(last_row_df['close'])
    prev_close = float(df_test.iloc[-2]['close']) if len(df_test) >= 2 else latest_close
    daily_change_pct = round(((latest_close - prev_close) / prev_close) * 100, 2) if prev_close > 0 else 0.0

    prediction_response = PredictionOverviewResponse(
        asset_name=asset_name,
        ticker=ticker,
        base_date=pred_res['base_date'],
        target_date=pred_res['target_date'],
        latest_close=round(latest_close, 2),
        prev_close=round(prev_close, 2),
        daily_change_pct=daily_change_pct,
        overall_direction=pred_res['overall_direction'],
        overall_signal=pred_res['overall_signal'],
        avg_probability=pred_res['avg_probability'],
        confidence_score=pred_res['confidence_score'],
        ai_opinion=pred_res['ai_opinion'],
        models=pred_res['models'],
        parameters={
            'window_size': window_size,
            'threshold': threshold,
            'train_split': train_split,
            'fast_mode': fast_mode
        }
    )

    result = {
        'asset_name': asset_name,
        'ticker': ticker,
        'raw_df': raw_df,
        'processed_df': processed_df,
        'feature_engine': feature_engine,
        'model_engine': model_engine,
        'X_train': X_train,
        'X_test': X_test,
        'y_train': y_train,
        'y_test': y_test,
        'df_test': df_test,
        'prediction_response': prediction_response
    }

    _pipeline_cache[cache_key] = result
    return result

@router.get("/assets", response_model=AssetsResponse)
def get_assets():
    """
    지원하는 프리셋 자산 및 추천 티커 목록 조회
    """
    presets = [
        AssetInfo(
            id=key,
            name=val["name"],
            ticker=val["ticker"],
            description=val["description"],
            is_preset=True,
            category="Preset"
        )
        for key, val in AppConfig.PRESET_ASSETS.items()
    ]

    popular = [
        AssetInfo(
            id=item["ticker"],
            name=item["name"],
            ticker=item["ticker"],
            description="",
            is_preset=False,
            category=item["category"]
        )
        for item in AppConfig.POPULAR_TICKERS
    ]

    return AssetsResponse(presets=presets, popular=popular)

@router.get("/predict", response_model=PredictionOverviewResponse)
def get_prediction(
    asset: str = Query("SnP500", description="자산 키 또는 티커 (예: SnP500, Nasdaq100, AAPL, NVDA, ^KS11)"),
    force_sync: bool = Query(False, description="실시간 최신 데이터 강제 다운로드 여부")
):
    """
    지정된 자산의 AI 익일 주가 예측 브리핑 조회
    """
    pipeline = _run_pipeline(asset, force_download=force_sync)
    return pipeline['prediction_response']

@router.get("/models/feature-importance", response_model=FeatureImportanceResponse)
def get_feature_importance(
    asset: str = Query("SnP500", description="자산 키 또는 티커"),
    model: str = Query("XGB", description="모델 이름 (XGB, RF, LGBM 등)")
):
    """
    모델의 기술적 지표 기여도(Feature Importance) 상위 15개 조회
    """
    pipeline = _run_pipeline(asset)
    features = pipeline['feature_engine'].features
    model_engine: ModelEngine = pipeline['model_engine']
    items = model_engine.get_feature_importances(features, model_name=model)
    
    return FeatureImportanceResponse(
        asset_name=pipeline['asset_name'],
        model_name=model,
        features=items
    )

@router.get("/backtest", response_model=BacktestSummaryResponse)
def get_backtest(
    asset: str = Query("SnP500", description="자산 키 또는 티커"),
    days: int = Query(20, ge=5, le=100, description="백테스팅 기간 (거래일 수)")
):
    """
    최근 N거래일 동안의 AI 예측 vs 실제 시장 결과 비교 및 적중률 조회
    """
    pipeline = _run_pipeline(asset)
    summary = BacktestService.generate_backtest_summary(
        asset_name=pipeline['asset_name'],
        model_engine=pipeline['model_engine'],
        df_test=pipeline['df_test'],
        X_test=pipeline['X_test'],
        lookback_days=days
    )
    return summary

@router.get("/chart", response_model=ChartResponse)
def get_chart_data(
    asset: str = Query("SnP500", description="자산 키 또는 티커"),
    points: int = Query(120, ge=30, le=500, description="반환할 최근 데이터 포인트 개수")
):
    """
    인터랙티브 차트용 주가(OHLCV) 및 보조지표(MA20, RSI, MACD, BB) 시계열 데이터 조회
    """
    pipeline = _run_pipeline(asset)
    proc_df: pd.DataFrame = pipeline['processed_df']
    recent_df = proc_df.tail(points).copy().reset_index(drop=True)

    chart_points = []
    for _, row in recent_df.iterrows():
        # 날짜 포맷 (YYYY-MM-DD)
        d_str = str(row['date']).replace('-', '')
        if len(d_str) == 8:
            formatted_date = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
        else:
            formatted_date = str(row['date'])

        chart_points.append(ChartPoint(
            date=formatted_date,
            open=round(float(row['open']), 2),
            high=round(float(row['high']), 2),
            low=round(float(row['low']), 2),
            close=round(float(row['close']), 2),
            volume=float(row['volume']),
            ma20=round(float(row['MA20']), 2) if pd.notnull(row.get('MA20')) else None,
            ema5=round(float(row['raw_EMA_5']), 2) if pd.notnull(row.get('raw_EMA_5')) else None,
            ema20=round(float(row['raw_EMA_20']), 2) if pd.notnull(row.get('raw_EMA_20')) else None,
            rsi=round(float(row['RSI']), 2) if pd.notnull(row.get('RSI')) else None,
            macd=round(float(row['MACD']), 4) if pd.notnull(row.get('MACD')) else None,
            macd_signal=round(float(row['MACD_Signal']), 4) if pd.notnull(row.get('MACD_Signal')) else None,
            macd_hist=round(float(row['MACD_Hist']), 4) if pd.notnull(row.get('MACD_Hist')) else None,
            bb_upper=round(float(row['BB_Upper']), 2) if pd.notnull(row.get('BB_Upper')) else None,
            bb_lower=round(float(row['BB_Lower']), 2) if pd.notnull(row.get('BB_Lower')) else None
        ))

    return ChartResponse(
        asset_name=pipeline['asset_name'],
        ticker=pipeline['ticker'],
        points=chart_points
    )

@router.post("/retrain", response_model=RetrainResponse)
def retrain_model(req: RetrainRequest):
    """
    사용자 정의 파라미터(Window Size, Threshold, Train Split)를 적용하여 실시간 재학습
    """
    pipeline = _run_pipeline(
        identifier=req.asset_key_or_ticker,
        window_size=req.window_size,
        threshold=req.threshold,
        train_split=req.train_split,
        fast_mode=req.fast_mode,
        force_download=False
    )

    return RetrainResponse(
        success=True,
        message=f"'{pipeline['asset_name']}' 모델 재학습이 성공적으로 완료되었습니다.",
        prediction=pipeline['prediction_response']
    )
