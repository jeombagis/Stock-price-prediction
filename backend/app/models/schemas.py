from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class AssetInfo(BaseModel):
    id: str
    name: str
    ticker: str
    description: Optional[str] = ""
    is_preset: bool = False
    category: Optional[str] = "General"


class AssetsResponse(BaseModel):
    presets: List[AssetInfo]
    popular: List[AssetInfo]


class ModelPredictionDetail(BaseModel):
    model_name: str
    signal: int = Field(..., description="1: 상승, 0: 하락/보합")
    direction: str = Field(..., description="'상승' 또는 '하락/보합'")
    probability: float = Field(..., description="상승 확률 (0.0 ~ 1.0)")
    threshold: Optional[float] = Field(None, description="모델별 최적 결정 임계값")
    f1_score: Optional[float] = None
    accuracy: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "model_name": "XGB",
                "signal": 1,
                "direction": "상승",
                "probability": 0.5832,
                "f1_score": 0.5421,
                "accuracy": 0.5567,
            }
        }
    )


class PredictionOverviewResponse(BaseModel):
    asset_name: str
    ticker: str
    base_date: str
    target_date: str
    total_records: Optional[int] = Field(None, description="분석에 사용된 총 일별 시계열 데이터 수")
    latest_close: float
    prev_close: float
    daily_change_pct: float
    overall_direction: str
    overall_signal: int
    avg_probability: float
    confidence_score: float
    ai_opinion: str
    models: Dict[str, ModelPredictionDetail]
    parameters: Dict[str, Any]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "asset_name": "S&P 500",
                "ticker": "^GSPC",
                "base_date": "2026-09-19",
                "target_date": "2026-09-22",
                "total_records": 24500,
                "latest_close": 5850.25,
                "prev_close": 5830.10,
                "daily_change_pct": 0.35,
                "overall_direction": "상승 우세 ↑",
                "overall_signal": 1,
                "avg_probability": 0.5614,
                "confidence_score": 12.3,
                "ai_opinion": "단기 완만한 상승 가능성이 높으나, 보조지표 및 시장 변동성을 고려하여 분할 접근을 권장합니다.",
                "models": {},
                "parameters": {"window_size": 5, "threshold": 0.002, "train_split": 0.8},
            }
        }
    )


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    description: Optional[str] = None


class FeatureImportanceResponse(BaseModel):
    asset_name: str
    model_name: str
    features: List[FeatureImportanceItem]


class BacktestRecord(BaseModel):
    base_date: str
    target_date: str
    xgb_label: str
    xgb_prob: float
    rf_label: str
    rf_prob: float
    lgbm_label: Optional[str] = None
    lgbm_prob: Optional[float] = None
    ensemble_label: str
    ensemble_prob: float
    actual_return_pct: float
    actual_direction: str
    is_hit: bool


class BacktestSummaryResponse(BaseModel):
    asset_name: str
    total_days: int
    hit_count: int
    hit_ratio_pct: float
    out_of_sample_acc: float
    out_of_sample_f1: float
    thresholds: Optional[Dict[str, float]] = Field(None, description="모델별 최적 결정 임계값 맵")
    history: List[BacktestRecord]


class ChartPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    ma20: Optional[float] = None
    ema5: Optional[float] = None
    ema20: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None


class ChartResponse(BaseModel):
    asset_name: str
    ticker: str
    points: List[ChartPoint]


class RetrainRequest(BaseModel):
    asset_key_or_ticker: str
    window_size: int = Field(5, ge=2, le=30, description="사전 학습 모델과 일치해야 하므로 기본값 5 권장. 다른 값 입력 시 자동으로 5로 조정됩니다.")
    threshold: float = Field(0.002, ge=0.0, le=0.05)
    train_split: float = Field(0.8, ge=0.5, le=0.95)
    fast_mode: bool = Field(True, description="빠른 반응성을 위해 간소화된 CV 파라미터 적용 여부")
    force_sync: bool = Field(False, description="실시간 최신 시장 데이터 강제 다운로드 포함 여부")


class RetrainResponse(BaseModel):
    success: bool
    message: str
    prediction: PredictionOverviewResponse
