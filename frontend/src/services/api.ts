import axios from 'axios';
import {
  AssetsResponse,
  PredictionOverviewResponse,
  FeatureImportanceResponse,
  BacktestSummaryResponse,
  ChartResponse,
  RetrainRequest,
  RetrainResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 모델 학습 및 yfinance 다운로드를 위한 넉넉한 타임아웃
});

export const api = {
  getAssets: async (): Promise<AssetsResponse> => {
    const response = await apiClient.get<AssetsResponse>('/assets');
    return response.data;
  },

  getPrediction: async (asset: string, forceSync = false): Promise<PredictionOverviewResponse> => {
    const response = await apiClient.get<PredictionOverviewResponse>('/predict', {
      params: { asset, force_sync: forceSync }
    });
    return response.data;
  },

  getChartData: async (asset: string, points = 120): Promise<ChartResponse> => {
    const response = await apiClient.get<ChartResponse>('/chart', {
      params: { asset, points }
    });
    return response.data;
  },

  getFeatureImportance: async (asset: string, model = 'XGB'): Promise<FeatureImportanceResponse> => {
    const response = await apiClient.get<FeatureImportanceResponse>('/models/feature-importance', {
      params: { asset, model }
    });
    return response.data;
  },

  getBacktest: async (asset: string, days = 20): Promise<BacktestSummaryResponse> => {
    const response = await apiClient.get<BacktestSummaryResponse>('/backtest', {
      params: { asset, days }
    });
    return response.data;
  },

  retrain: async (data: RetrainRequest): Promise<RetrainResponse> => {
    const response = await apiClient.post<RetrainResponse>('/retrain', data);
    return response.data;
  }
};
