import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PredictionHero } from './components/PredictionHero';
import { ModelProbabilities } from './components/ModelProbabilities';
import { StockChart } from './components/StockChart';
import { FeatureImportance } from './components/FeatureImportance';
import { BacktestTable } from './components/BacktestTable';
import { ParameterModal } from './components/ParameterModal';
import { api } from './services/api';
import {
  AssetInfo,
  PredictionOverviewResponse,
  ChartResponse
} from './types';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState<string>('SnP500');
  const [presets, setPresets] = useState<AssetInfo[]>([]);
  const [popular, setPopular] = useState<AssetInfo[]>([]);
  
  const [prediction, setPrediction] = useState<PredictionOverviewResponse | null>(null);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isParamModalOpen, setIsParamModalOpen] = useState<boolean>(false);

  // 1. Initial Asset List
  useEffect(() => {
    const fetchAssetList = async () => {
      try {
        const res = await api.getAssets();
        setPresets(res.presets);
        setPopular(res.popular);
      } catch (err) {
        console.error("Failed to load assets:", err);
      }
    };
    fetchAssetList();
  }, []);

  // 2. Load Prediction and Chart Data for Current Asset
  const loadData = async (asset: string, forceSync = false) => {
    setLoading(true);
    setError(null);
    try {
      const [predRes, chartRes] = await Promise.all([
        api.getPrediction(asset, forceSync),
        api.getChartData(asset, 120),
      ]);
      setPrediction(predRes);
      setChartData(chartRes);
    } catch (err: any) {
      console.error("Data load error:", err);
      setError(err.response?.data?.detail || "데이터를 불러오는 중 문제가 발생했습니다. 티커가 올바른지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentAsset);
  }, [currentAsset]);

  const handleSelectAsset = (assetId: string) => {
    setCurrentAsset(assetId);
  };

  const handleRefresh = () => {
    loadData(currentAsset, true);
  };

  const handleRetrainSuccess = (newPrediction: PredictionOverviewResponse) => {
    setPrediction(newPrediction);
    // 차트 데이터도 갱신
    api.getChartData(currentAsset, 120).then(setChartData).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        currentAsset={currentAsset}
        onSelectAsset={handleSelectAsset}
        onRefresh={handleRefresh}
        onOpenParams={() => setIsParamModalOpen(true)}
        isLoading={loading}
        presets={presets}
        popular={popular}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div className="text-sm">
              <strong className="font-semibold">오류 발생: </strong>
              {error}
            </div>
            <button
              onClick={() => loadData(currentAsset)}
              className="ml-auto text-xs underline hover:text-white text-rose-400 font-semibold"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Global Loading Spinner */}
        {loading && !prediction && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">AI 모델 데이터 분석 및 예측 수행 중...</p>
              <p className="text-xs text-gray-400 mt-1">XGBoost, LightGBM, Random Forest 앙상블 파이프라인 연산 중</p>
            </div>
          </div>
        )}

        {/* Dashboard Panels */}
        {prediction && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Main Prediction Headline */}
            <PredictionHero data={prediction} />

            {/* 2. Model Probabilities Breakdown */}
            <ModelProbabilities models={prediction.models} />

            {/* 3. Charts & Feature Importance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                {chartData ? (
                  <StockChart
                    points={chartData.points}
                    assetName={chartData.asset_name}
                    ticker={chartData.ticker}
                  />
                ) : (
                  <div className="glass-panel rounded-2xl p-6 h-80 flex items-center justify-center text-sm text-gray-400">
                    차트 데이터를 불러오는 중입니다...
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <FeatureImportance assetKey={currentAsset} />
              </div>
            </div>

            {/* 4. Backtesting & Historical Performance */}
            <BacktestTable assetKey={currentAsset} />
          </div>
        )}
      </main>

      {/* Parameter Tuning Modal */}
      {prediction && (
        <ParameterModal
          isOpen={isParamModalOpen}
          onClose={() => setIsParamModalOpen(false)}
          assetKey={currentAsset}
          currentParams={prediction.parameters}
          onRetrainSuccess={handleRetrainSuccess}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950/60 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-gray-400">
            Stock Price Prediction AI Engine | Powered by FastAPI, XGBoost, LightGBM, Scikit-Learn & React
          </p>
          <p className="text-[11px] text-gray-600">
            ⚠️ 본 예측 결과는 머신러닝 알고리즘에 의한 확률적 추정치이며, 투자 권유나 재정적 조언이 아닙니다. 실제 투자의 책임은 본인에게 있습니다.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
