import axios, { AxiosError } from 'axios';
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

// 응답 인터셉터: 일관된 에러 포맷 (문자열, 배열, 객체 지원)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: any }>) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      let message = '요청 처리 중 오류가 발생했습니다.';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'object') {
        message = JSON.stringify(detail);
      }
      const customError = new Error(message);
      (customError as any).status = error.response.status;
      (customError as any).originalError = error;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  }
);

export const api = {
  getAssets: async (signal?: AbortSignal): Promise<AssetsResponse> => {
    const response = await apiClient.get<AssetsResponse>('/assets', { signal });
    return response.data;
  },

  getPrediction: async (asset: string, forceSync = false, signal?: AbortSignal): Promise<PredictionOverviewResponse> => {
    const response = await apiClient.get<PredictionOverviewResponse>('/predict', {
      params: { asset, force_sync: forceSync },
      signal,
    });
    return response.data;
  },

  getChartData: async (asset: string, points = 120, signal?: AbortSignal): Promise<ChartResponse> => {
    const response = await apiClient.get<ChartResponse>('/chart', {
      params: { asset, points },
      signal,
    });
    return response.data;
  },

  getFeatureImportance: async (asset: string, model = 'XGB', signal?: AbortSignal): Promise<FeatureImportanceResponse> => {
    const response = await apiClient.get<FeatureImportanceResponse>('/models/feature-importance', {
      params: { asset, model },
      signal,
    });
    return response.data;
  },

  getBacktest: async (asset: string, days = 20, signal?: AbortSignal): Promise<BacktestSummaryResponse> => {
    const response = await apiClient.get<BacktestSummaryResponse>('/backtest', {
      params: { asset, days },
      signal,
    });
    return response.data;
  },

  retrain: async (data: RetrainRequest): Promise<RetrainResponse> => {
    const response = await apiClient.post<RetrainResponse>('/retrain', data);
    return response.data;
  }
};
