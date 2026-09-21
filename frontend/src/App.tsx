import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PredictionHero } from './components/PredictionHero';
import { ModelProbabilities } from './components/ModelProbabilities';
import { StockChart } from './components/StockChart';
import { FeatureImportance } from './components/FeatureImportance';
import { BacktestTable } from './components/BacktestTable';
import { ParameterModal } from './components/ParameterModal';
import { LegalModal } from './components/LegalModal';
import { api } from './services/api';
import {
  AssetInfo,
  PredictionOverviewResponse,
  ChartResponse
} from './types';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

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
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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
      showToast(`'${currentAsset}' 최신 시장 데이터 동기화가 완료되었습니다.`);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrainSuccess = (newPrediction: PredictionOverviewResponse) => {
    setPrediction(newPrediction);
    setRefreshKey((prev) => prev + 1);
    api.getChartData(currentAsset, 120).then(setChartData).catch(console.error);
    showToast(`'${newPrediction.asset_name}' 모델 재학습 및 성능 지표 갱신이 완료되었습니다.`);
  };

  return (
    <div className="relative min-h-screen text-[#1d1d1f] flex flex-col font-sans overflow-x-hidden">
      {/* 1. Ambient Liquid Glow Background (Apple White Glass) */}
      <div className="liquid-ambient-backdrop">
        <div className="ambient-orb orb-primary" />
        <div className="ambient-orb orb-cyan" />
        <div className="ambient-orb orb-purple" />
        <div className="ambient-orb orb-amber" />
      </div>

      {/* 2. Sticky Header */}
      <Header
        currentAsset={currentAsset}
        onSelectAsset={handleSelectAsset}
        onRefresh={handleRefresh}
        onOpenParams={() => setIsParamModalOpen(true)}
        onOpenLegal={() => setIsLegalModalOpen(true)}
        isLoading={loading}
        isSyncing={isSyncing}
        presets={presets}
        popular={popular}
      />

      {/* 3. Floating Apple Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-250 pointer-events-auto">
          <div className="glass-panel !rounded-full !px-4 !py-2.5 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1f] shadow-glass-hover">
            <div className="w-5 h-5 rounded-full bg-[#0071e3] flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#86868b] hover:text-[#1d1d1f] p-0.5 rounded-full transition ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Content Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5 z-10">
        {/* Sleek Apple White Glass Beta Notice Strip */}
        <div className="glass-panel !rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-[#515154]">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold text-[10px] border border-amber-500/20 tracking-wide">
              BETA PREVIEW
            </span>
            <span className="hidden sm:inline text-[#515154] font-medium">
              본 서비스는 AI 머신러닝 예측 알고리즘 성능 검증을 위한 <strong>베타 버전</strong>입니다. 통계적 추정치이며 미래 수익을 보장하지 않습니다.
            </span>
            <span className="sm:hidden text-[#515154] font-medium">
              AI 머신러닝 예측 알고리즘 검증용 베타 테스트 버전입니다.
            </span>
          </div>
          <button
            onClick={() => setIsLegalModalOpen(true)}
            className="text-xs text-[#0071e3] hover:underline font-semibold flex-shrink-0 flex items-center gap-1"
          >
            <span>면책 고지 열람</span>
            <span>→</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-panel !rounded-2xl p-4 bg-rose-50/70 border border-rose-200/80 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <div className="text-xs sm:text-sm font-medium">
              <strong>오류: </strong> {error}
            </div>
            <button
              onClick={() => loadData(currentAsset)}
              className="ml-auto text-xs underline hover:text-rose-950 font-bold"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Clean Apple Loading View */}
        {loading && !prediction && (
          <div className="min-h-[45vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-[#1d1d1f]">AI 예측 모델 파이프라인 연산 중...</p>
              <p className="text-xs text-[#86868b]">XGBoost, LightGBM, Random Forest 멀티 앙상블 분석</p>
            </div>
          </div>
        )}

        {/* Dashboard Panels */}
        {prediction && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 1. Main Prediction Headline */}
            <PredictionHero data={prediction} />

            {/* 2. Model Probabilities Breakdown */}
            <ModelProbabilities models={prediction.models} />

            {/* 3. Charts & Feature Importance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                {chartData ? (
                  <StockChart
                    points={chartData.points}
                    assetName={chartData.asset_name}
                    ticker={chartData.ticker}
                  />
                ) : (
                  <div className="glass-panel rounded-3xl p-6 h-80 flex items-center justify-center text-sm text-[#86868b]">
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

      {/* Legal & Disclaimer Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* 5. Apple Clean Minimalist Footer */}
      <footer className="mt-8 border-t border-black/[0.06] bg-white/70 backdrop-blur-[20px] py-6 text-center text-xs text-[#86868b] z-10">
        <div className="max-w-[1280px] mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-bold text-[#1d1d1f]">StockAlgo AI (주가 알고리즘 분석)</span>
            <span className="text-[#86868b]">·</span>
            <span>비상업적 연구 프로젝트 (Non-commercial Research Project)</span>
            <span className="text-[#86868b]">·</span>
            <span>FastAPI & Scikit-Learn / XGBoost / LightGBM</span>
          </div>
          <p className="text-[11px] text-[#86868b] max-w-2xl mx-auto leading-relaxed">
            본 시스템의 예측 결과는 통계적 추정치이며 실제 투자 성과를 보장하지 않습니다. 금융 투자에는 원금 손실 위험이 수반됩니다.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setIsLegalModalOpen(true)}
              className="text-[11px] font-semibold text-[#0071e3] hover:underline"
            >
              법적 고지, 저작권 및 면책 조항 (Legal Disclaimer)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
