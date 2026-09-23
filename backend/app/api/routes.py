import threading
import logging
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Stock Prediction"])

# 메모리 파이프라인 캐시 및 활성 파라미터 상태 (스레드 안전)
_pipeline_cache: Dict[str, Dict[str, Any]] = {}
_active_params: Dict[str, Dict[str, Any]] = {}
_cache_lock = threading.Lock()

# 사전 학습 모델의 고정 window_size (변경 불가)
_MODEL_WINDOW_SIZE = 5


def _run_pipeline(
    identifier: str,
    window_size: Optional[int] = None,
    threshold: Optional[float] = None,
    train_split: Optional[float] = None,
    fast_mode: Optional[bool] = None,
    force_download: bool = False
) -> Dict[str, Any]:
    """
    사전 학습된 머신러닝 모델(.pkl)을 기반으로 실시간 주가 데이터 로드, 피처 변환 및 익일 예측 수행
    """
    norm_key = AppConfig.resolve_asset_key(identifier)
    if not norm_key or norm_key not in AppConfig.PRESET_ASSETS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 종목입니다: '{identifier}'. StockAlgo AI는 S&P 500(SnP500) 및 NASDAQ-100(Nasdaq100) 지수 분석 전용입니다."
        )

    # window_size는 사전 학습 모델과 일치해야 하므로 항상 고정
    eff_window = _MODEL_WINDOW_SIZE
    if window_size is not None and window_size != _MODEL_WINDOW_SIZE:
        logger.warning(
            f"window_size={window_size}가 요청되었으나, 사전 학습 모델은 "
            f"window_size={_MODEL_WINDOW_SIZE}로 학습되었으므로 기본값을 사용합니다."
        )

    # 활성 파라미터가 등록되어 있다면 우선 적용
    with _cache_lock:
        curr_active = _active_params.get(norm_key, {})
    eff_thresh = threshold if threshold is not None else curr_active.get('threshold', AppConfig.THRESHOLD)
    eff_split = train_split if train_split is not None else curr_active.get('train_split', AppConfig.TRAIN_SPLIT)
    eff_fast = fast_mode if fast_mode is not None else curr_active.get('fast_mode', True)

    cache_key = f"{norm_key}_{force_download}"

    with _cache_lock:
        if force_download:
            keys_to_clear = [k for k in _pipeline_cache if k.startswith(f"{norm_key}_")]
            for k in keys_to_clear:
                _pipeline_cache.pop(k, None)
        elif cache_key in _pipeline_cache:
            return _pipeline_cache[cache_key]

    # 1. 사전 학습된 모델 엔진 로드 (.pkl 파일 기반)
    try:
        model_engine = ModelEngine.get_pretrained_engine(norm_key, force_reload=force_download)
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=500, detail=str(fnf_err))

    # 2. 최신 주가 데이터 로드
    try:
        raw_df, asset_name, ticker = DataService.get_stock_data(norm_key, force_download=force_download)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    if len(raw_df) < 50:
        raise HTTPException(status_code=400, detail=f"데이터 수가 부족합니다 (현재 {len(raw_df)}개, 최소 50개 필요)")

    # 3. 기술적 지표 생성
    feature_engine = FeatureEngine(window_size=eff_window, threshold=eff_thresh)
    processed_df = feature_engine.compute_technical_indicators(raw_df)

    if len(processed_df) < 20:
        raise HTTPException(status_code=400, detail="보조지표 계산 후 유효 데이터 수가 부족합니다.")

    # 4. 최신 레코드에 대한 피처 추출 및 사전 학습된 스케일러 적용
    feat_cols = model_engine.features if model_engine.features else feature_engine.features
    X_last_raw = processed_df[feat_cols].iloc[[-1]]
    X_last_scaled = model_engine.scale_features(X_last_raw)
    last_row_df = processed_df.iloc[-1]

    # 5. 사전 학습 모델 기반 익일 예측
    pred_res = model_engine.predict_next_day(X_last_scaled, last_row_df)

    # 가격 정보 계산
    latest_close = float(last_row_df['close'])
    prev_close = float(processed_df.iloc[-2]['close']) if len(processed_df) >= 2 else latest_close
    daily_change_pct = round(((latest_close - prev_close) / prev_close) * 100, 2) if prev_close > 0 else 0.0

    prediction_response = PredictionOverviewResponse(
        asset_name=asset_name,
        ticker=ticker,
        base_date=pred_res['base_date'],
        target_date=pred_res['target_date'],
        total_records=len(raw_df),
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
            'window_size': eff_window,
            'threshold': eff_thresh,
            'train_split': eff_split,
            'fast_mode': eff_fast,
            'model_source': 'saved_models/*.pkl'
        }
    )

    result = {
        'asset_name': asset_name,
        'ticker': ticker,
        'norm_key': norm_key,
        'raw_df': raw_df,
        'processed_df': processed_df,
        'feature_engine': feature_engine,
        'model_engine': model_engine,
        'X_train': None,
        'X_test': model_engine.X_test,
        'y_train': None,
        'y_test': model_engine.y_test,
        'df_test': model_engine.df_test,
        'prediction_response': prediction_response
    }

    with _cache_lock:
        _pipeline_cache[cache_key] = result
    return result


@router.get("/assets", response_model=AssetsResponse)
def get_assets():
    """
    지원하는 프리셋 자산 목록 조회 (S&P 500, NASDAQ-100)
    """
    presets = [
        AssetInfo(
            id=key,
            name=val["name"],
            ticker=val["ticker"],
            description=val["description"],
            is_preset=True,
            category="Index"
        )
        for key, val in AppConfig.PRESET_ASSETS.items()
    ]
    return AssetsResponse(presets=presets, popular=[])


@router.get("/predict", response_model=PredictionOverviewResponse)
def get_prediction(
    asset: str = Query("SnP500", description="자산 키 또는 티커 (SnP500, Nasdaq100)"),
    force_sync: bool = Query(False, description="실시간 최신 데이터 강제 다운로드 여부")
):
    """
    지정된 자산의 사전 학습 모델 기반 AI 익일 주가 예측 브리핑 조회
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
        lookback_days=days,
        processed_df=pipeline.get('processed_df')
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
    최신 데이터 갱신 및 사전 학습 모델 기반 재예측.
    주의: window_size는 사전 학습 모델과 일치해야 하므로 항상 5로 고정됩니다.
    """
    norm_key = AppConfig.resolve_asset_key(req.asset_key_or_ticker)
    if not norm_key or norm_key not in AppConfig.PRESET_ASSETS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 종목입니다: '{req.asset_key_or_ticker}'. S&P 500(SnP500) 및 NASDAQ-100(Nasdaq100) 지수만 지원합니다."
        )

    # window_size가 모델 학습 시 값과 다르면 경고 후 기본값 사용
    effective_window = _MODEL_WINDOW_SIZE
    if req.window_size != _MODEL_WINDOW_SIZE:
        logger.warning(
            f"사용자 요청 window_size={req.window_size}는 사전 학습 모델과 불일치합니다. "
            f"window_size={_MODEL_WINDOW_SIZE}로 고정합니다."
        )

    # 활성 파라미터 상태 저장 및 새 파라미터 적용을 위해 기존 캐시 무효화
    with _cache_lock:
        _active_params[norm_key] = {
            'window_size': effective_window,
            'threshold': req.threshold,
            'train_split': req.train_split,
            'fast_mode': req.fast_mode
        }
        keys_to_clear = [k for k in _pipeline_cache if k.startswith(f"{norm_key}_")]
        for k in keys_to_clear:
            _pipeline_cache.pop(k, None)

    pipeline = _run_pipeline(
        identifier=norm_key,
        window_size=effective_window,
        threshold=req.threshold,
        train_split=req.train_split,
        fast_mode=req.fast_mode,
        force_download=req.force_sync
    )

    msg = f"'{pipeline['asset_name']}' 모델 예측이 성공적으로 갱신되었습니다."
    if req.force_sync:
        msg = f"'{pipeline['asset_name']}' 최신 데이터 갱신 및 예측이 완료되었습니다. (총 {len(pipeline['raw_df']):,}건)"

    return RetrainResponse(
        success=True,
        message=msg,
        prediction=pipeline['prediction_response']
    )
