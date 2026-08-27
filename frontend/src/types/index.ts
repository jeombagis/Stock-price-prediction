export interface AssetInfo {
  id: string;
  name: string;
  ticker: string;
  description: string;
  is_preset: boolean;
  category: string;
}

export interface AssetsResponse {
  presets: AssetInfo[];
  popular: AssetInfo[];
}

export interface ModelPredictionDetail {
  model_name: string;
  signal: number; // 1: 상승, 0: 하락
  direction: string; // "상승" | "하락/보합"
  probability: number;
  f1_score?: number;
  accuracy?: number;
}

export interface PredictionOverviewResponse {
  asset_name: string;
  ticker: string;
  base_date: string;
  target_date: string;
  latest_close: number;
  prev_close: number;
  daily_change_pct: number;
  overall_direction: string;
  overall_signal: number;
  avg_probability: number;
  confidence_score: number;
  ai_opinion: string;
  models: Record<string, ModelPredictionDetail>;
  parameters: {
    window_size: number;
    threshold: number;
    train_split: number;
    fast_mode: boolean;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  description?: string;
}

export interface FeatureImportanceResponse {
  asset_name: string;
  model_name: string;
  features: FeatureImportanceItem[];
}

export interface BacktestRecord {
  base_date: string;
  target_date: string;
  xgb_label: string;
  xgb_prob: number;
  rf_label: string;
  rf_prob: number;
  lgbm_label?: string;
  lgbm_prob?: number;
  ensemble_label: string;
  ensemble_prob: number;
  actual_return_pct: number;
  actual_direction: string;
  is_hit: boolean;
}

export interface BacktestSummaryResponse {
  asset_name: string;
  total_days: number;
  hit_count: number;
  hit_ratio_pct: number;
  out_of_sample_acc: number;
  out_of_sample_f1: number;
  history: BacktestRecord[];
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ema5?: number;
  ema20?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_lower?: number;
}

export interface ChartResponse {
  asset_name: string;
  ticker: string;
  points: ChartPoint[];
}

export interface RetrainRequest {
  asset_key_or_ticker: string;
  window_size: number;
  threshold: number;
  train_split: number;
  fast_mode: boolean;
}

export interface RetrainResponse {
  success: boolean;
  message: string;
  prediction: PredictionOverviewResponse;
}
