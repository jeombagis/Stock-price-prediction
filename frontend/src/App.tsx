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
import { AlertCircle, RefreshCw, Layers, CheckCircle2, X, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState<string>('SnP500');
  const [presets, setPresets] = useState<AssetInfo[]>([]);
  const [popular, setPopular] = useState<AssetInfo[]>([]);
  
  const [prediction, setPrediction] = useState<PredictionOverviewResponse | null>(null);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParamModalOpen, setIsParamModalOpen] = useState<boolean>(false);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

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

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await loadData(currentAsset, true);
      setRefreshKey((prev) => prev + 1);
      showToast(`'${currentAsset}' 최신 시장 데이터 갱신이 완료되었습니다.`);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrainSuccess = (newPrediction: PredictionOverviewResponse) => {
    setPrediction(newPrediction);
    setRefreshKey((prev) => prev + 1);
    // 차트 데이터도 갱신
    api.getChartData(currentAsset, 120).then(setChartData).catch(console.error);
    showToast(`'${newPrediction.asset_name}' 모델 재학습 및 성능 지표 갱신이 완료되었습니다.`);
  };

  return (
    <div className="relative min-h-screen bg-[#fbfcfe] text-slate-800 flex flex-col font-sans selection:bg-purple-200/70 selection:text-purple-950 overflow-x-hidden">
      {/* Apple Intelligence Multi-Spectral Ambient Fluid Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Vibrant Violet & Purple Light Mesh (Top Right) */}
        <div className="absolute -top-[10%] -right-[10%] w-[58vw] h-[58vw] rounded-full bg-gradient-to-bl from-purple-300/30 via-violet-200/25 to-transparent blur-3xl animate-aurora-1" />
        
        {/* Electric Cyan & Sky Blue Luminous Aura (Top Left) */}
        <div className="absolute -top-[12%] -left-[12%] w-[52vw] h-[52vw] rounded-full bg-gradient-to-br from-cyan-200/35 via-sky-100/30 to-transparent blur-3xl animate-aurora-2" />
        
        {/* Warm Sunset Coral & Magenta Ribbon (Center Left) */}
        <div className="absolute top-[42%] -left-[10%] w-[48vw] h-[48vw] rounded-full bg-gradient-to-tr from-rose-200/25 via-pink-100/20 to-transparent blur-3xl animate-aurora-3" />
        
        {/* Deep Cobalt & Indigo Glow (Bottom Right) */}
        <div className="absolute -bottom-[12%] right-[8%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-indigo-200/25 via-blue-100/20 to-transparent blur-3xl animate-aurora-2" />
        
        {/* Center Specular White Reflection Fill */}
        <div className="absolute top-[25%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-white/40 blur-3xl" />
      </div>

      {/* Navigation Header */}
      <Header
        currentAsset={currentAsset}
        onSelectAsset={handleSelectAsset}
        onRefresh={handleRefresh}
        onOpenParams={() => setIsParamModalOpen(true)}
        isLoading={loading}
        isSyncing={isSyncing}
        presets={presets}
        popular={popular}
      />

      {/* Floating Apple Liquid Glass Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 border border-white/90 shadow-glass-lg backdrop-blur-2xl text-xs font-semibold text-slate-800 ring-1 ring-purple-500/20 apple-intelligence-glow">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100/80 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-rose-50/80 backdrop-blur-xl border border-rose-200/80 text-rose-800 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div className="text-sm">
              <strong className="font-semibold">오류 발생: </strong>
              {error}
            </div>
            <button
              onClick={() => loadData(currentAsset)}
              className="ml-auto text-xs underline hover:text-rose-950 text-rose-700 font-semibold"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Apple Intelligence Chromatic Loading Spinner */}
        {loading && !prediction && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-5">
            <div className="relative">
              {/* Outer Iridescent Spinning Ring */}
              <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-500 animate-spin">
                <div className="w-full h-full bg-white/95 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-tr from-cyan-400/40 via-purple-500/40 to-rose-400/40 -z-10 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-extrabold text-slate-900 tracking-tight">AI 머신러닝 데이터 분석 및 예측 수행 중...</p>
              <p className="text-xs text-slate-500">XGBoost, LightGBM, Random Forest 멀티 앙상블 파이프라인 연산 중</p>
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
                  <div className="liquid-glass rounded-2xl p-6 h-80 flex items-center justify-center text-sm text-slate-400">
                    차트 데이터를 불러오는 중입니다...
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <FeatureImportance assetKey={currentAsset} refreshKey={refreshKey} />
              </div>
            </div>

            {/* 4. Backtesting & Historical Performance */}
            <BacktestTable assetKey={currentAsset} refreshKey={refreshKey} />
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
      <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur-xl py-6 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-600">
            Stock Price Prediction AI Engine | Powered by FastAPI, XGBoost, LightGBM, Scikit-Learn & React
          </p>
          <p className="text-[11px] text-slate-400">
            ⚠️ 본 예측 결과는 머신러닝 알고리즘에 의한 확률적 추정치이며, 투자 권유나 재정적 조언이 아닙니다. 실제 투자의 책임은 본인에게 있습니다.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
