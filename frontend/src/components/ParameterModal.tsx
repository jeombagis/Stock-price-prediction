import React, { useState } from 'react';
import { X, Sliders, Play, AlertCircle } from 'lucide-react';
import { RetrainRequest, PredictionOverviewResponse } from '../types';
import { api } from '../services/api';

interface ParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetKey: string;
  currentParams?: {
    window_size?: number;
    threshold?: number;
    train_split?: number;
    fast_mode?: boolean;
  };
  onRetrainSuccess: (newPrediction: PredictionOverviewResponse) => void;
}

export const ParameterModal: React.FC<ParameterModalProps> = ({
  isOpen,
  onClose,
  assetKey,
  currentParams,
  onRetrainSuccess,
}) => {
  const [windowSize, setWindowSize] = useState<number>(currentParams?.window_size || 5);
  const [threshold, setThreshold] = useState<number>(currentParams?.threshold ?? 0.002);
  const [trainSplit, setTrainSplit] = useState<number>(currentParams?.train_split ?? 0.8);
  const [fastMode, setFastMode] = useState<boolean>(currentParams?.fast_mode ?? true);
  const [forceSync, setForceSync] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && currentParams) {
      setWindowSize(currentParams.window_size || 5);
      setThreshold(currentParams.threshold ?? 0.002);
      setTrainSplit(currentParams.train_split ?? 0.8);
      setFastMode(currentParams.fast_mode ?? true);
      setErrorMsg(null);
    }
  }, [isOpen, currentParams]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTraining(true);
    setErrorMsg(null);

    const payload: RetrainRequest = {
      asset_key_or_ticker: assetKey,
      window_size: windowSize,
      threshold: threshold,
      train_split: trainSplit,
      fast_mode: fastMode,
      force_sync: forceSync,
    };

    try {
      const res = await api.retrain(payload);
      if (res.success) {
        onRetrainSuccess(res.prediction);
        onClose();
      } else {
        setErrorMsg(res.message || "재학습 요청에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("Retrain failed:", err);
      const msg = err.message || err.response?.data?.detail || "재학습 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setWindowSize(5);
    setThreshold(0.002);
    setTrainSplit(0.8);
    setFastMode(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[24px] animate-in fade-in duration-200">
      <div 
        className="glass-panel !bg-white/95 !rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-glass-hover space-y-5 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0071e3]/[0.08] text-[#0071e3] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight">AI 모델 재학습 & 파라미터</h3>
              <p className="text-xs text-[#86868b]">하이퍼파라미터 튜닝 및 학습 파이프라인</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Asset Display */}
          <div className="text-xs text-[#515154] bg-black/[0.03] p-3 rounded-xl border border-black/[0.04] flex justify-between items-center">
            <span>대상 자산: <strong className="text-[#0071e3] font-bold">{assetKey}</strong></span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[#0071e3] hover:underline text-[11px] font-semibold"
            >
              기본값 복원
            </button>
          </div>

          {/* 1. Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-[#1d1d1f]">
                상승 판단 임계값 (Threshold)
              </label>
              <span className="font-mono font-bold text-[#0071e3]">
                +{(threshold * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="0.000"
              max="0.015"
              step="0.0005"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-black/[0.08] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
            />
            <p className="text-[11px] text-[#86868b]">
              종가가 이 수치 이상 상승해야 '상승(1)'으로 라벨링합니다.
            </p>
          </div>

          {/* 2. Window Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-[#1d1d1f]">
                룩백 윈도우 (Window Size)
              </label>
              <span className="font-mono font-bold text-[#0071e3]">
                {windowSize}거래일
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={5}
              readOnly
              disabled
              className="w-full h-1.5 bg-black/[0.08] rounded-lg appearance-none cursor-not-allowed accent-[#0071e3] opacity-50"
            />
            <p className="text-[11px] text-[#86868b]">
              현재 모델 호환성을 위해 5일로 고정되어 있습니다. 과거 N일간의 기술적 지표 변화량을 모델 피처로 압축합니다.
            </p>
          </div>

          {/* 3. Train/Test Split Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-[#1d1d1f]">
                학습 데이터 비율 (Train Split)
              </label>
              <span className="font-mono font-bold text-[#0071e3]">
                {(trainSplit * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={trainSplit}
              onChange={(e) => setTrainSplit(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-black/[0.08] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
            />
            <p className="text-[11px] text-[#86868b]">
              전체 시계열 중 모델 학습에 사용할 비율 (잔여는 검증 세트).
            </p>
          </div>

          {/* 4. Speed Mode Toggle */}
          <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#1d1d1f]">고속 학습 모드 (Fast Mode)</div>
              <div className="text-[11px] text-[#86868b]">트리 깊이 및 반복 횟수를 최적화하여 1~2초 내에 학습</div>
            </div>
            <div className="segmented-track">
              <button
                type="button"
                onClick={() => setFastMode(true)}
                className={`segmented-btn !py-1 !px-2.5 text-xs ${fastMode ? 'selected' : ''}`}
              >
                고속
              </button>
              <button
                type="button"
                onClick={() => setFastMode(false)}
                className={`segmented-btn !py-1 !px-2.5 text-xs ${!fastMode ? 'selected' : ''}`}
              >
                정밀
              </button>
            </div>
          </div>

          {/* 5. Force Sync Checkbox */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="forceSyncCheck"
              checked={forceSync}
              onChange={(e) => setForceSync(e.target.checked)}
              className="rounded border-black/[0.15] text-[#0071e3] focus:ring-[#0071e3]"
            />
            <label htmlFor="forceSyncCheck" className="text-xs text-[#515154] font-medium cursor-pointer">
              Yahoo Finance에서 최신 시장 데이터 즉시 강제 갱신 후 재학습
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="glass-button !py-2.5 !px-4 text-xs font-semibold text-[#515154]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isTraining}
              className="btn-apple-primary !py-2.5 !px-5 text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTraining ? '모델 학습 파이프라인 가동 중...' : '모델 재학습 실행'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParameterModal;
