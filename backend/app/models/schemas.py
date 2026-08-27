from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

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
    f1_score: Optional[float] = None
    accuracy: Optional[float] = None

class PredictionOverviewResponse(BaseModel):
    asset_name: str
    ticker: str
    base_date: str
    target_date: str
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
    window_size: int = Field(5, ge=2, le=30)
    threshold: float = Field(0.002, ge=0.0, le=0.05)
    train_split: float = Field(0.8, ge=0.5, le=0.95)
    fast_mode: bool = Field(True, description="빠른 반응성을 위해 간소화된 CV 파라미터 적용 여부")

class RetrainResponse(BaseModel):
    success: bool
    message: str
    prediction: PredictionOverviewResponse
