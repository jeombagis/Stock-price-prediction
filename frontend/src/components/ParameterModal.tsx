import React, { useState } from 'react';
import { X, Sliders, Play, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RetrainRequest, PredictionOverviewResponse } from '../types';
import { api } from '../services/api';

interface ParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetKey: string;
  currentParams: {
    window_size: number;
    threshold: number;
    train_split: number;
    fast_mode: boolean;
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
  const [windowSize, setWindowSize] = useState<number>(currentParams.window_size || 5);
  const [threshold, setThreshold] = useState<number>(currentParams.threshold || 0.002);
  const [trainSplit, setTrainSplit] = useState<number>(currentParams.train_split || 0.8);
  const [fastMode, setFastMode] = useState<boolean>(currentParams.fast_mode ?? true);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    };

    try {
      const res = await api.retrain(payload);
      if (res.success) {
        onRetrainSuccess(res.prediction);
        onClose();
      }
    } catch (err: any) {
      console.error("Retrain failed:", err);
      setErrorMsg(err.response?.data?.detail || "재학습 중 오류가 발생했습니다.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass w-full max-w-lg rounded-3xl border border-white/90 bg-white/90 p-6 sm:p-7 shadow-2xl space-y-5 backdrop-blur-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">AI 모델 하이퍼파라미터 튜닝</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Asset Display */}
          <div className="text-xs text-slate-500 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 flex justify-between items-center">
            <span>대상 자산: <strong className="text-emerald-700 font-bold">{assetKey}</strong></span>
            <button
              type="button"
              onClick={handleReset}
              className="text-cyan-600 hover:underline text-[11px] font-semibold"
            >
              기본값 복원
            </button>
          </div>

          {/* 1. Threshold Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-800">
                상승 판단 임계값 (Threshold)
              </label>
              <span className="font-mono font-bold text-emerald-700">
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
              className="w-full h-2 bg-slate-200/80 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <p className="text-[11px] text-slate-400">
              익일 수익률이 이 값 이상일 때만 '상승(1)'으로 라벨링합니다. (기본값: +0.20%)
            </p>
          </div>

          {/* 2. Window Size Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-800">
                과거 시차 윈도우 크기 (Window Size)
              </label>
              <span className="font-mono font-bold text-cyan-700">
                {windowSize}일
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200/80 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <p className="text-[11px] text-slate-400">
              과거 N일간의 수익률 및 거래량 시차(Lag) 피처를 생성하여 모델에 입력합니다.
            </p>
          </div>

          {/* 3. Train Split Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-slate-800">
                학습 데이터 비율 (Train Split)
              </label>
              <span className="font-mono font-bold text-purple-700">
                {(trainSplit * 100).toFixed(0)}% 학습 / {((1 - trainSplit) * 100).toFixed(0)}% 검증
              </span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.90"
              step="0.05"
              value={trainSplit}
              onChange={(e) => setTrainSplit(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/80 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* 4. Fast Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div>
              <div className="text-xs font-bold text-slate-800">고속 학습 모드 (Fast Mode)</div>
              <div className="text-[10px] text-slate-400">활성화 시 수초 내에 즉시 결과 갱신</div>
            </div>
            <button
              type="button"
              onClick={() => setFastMode(!fastMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                fastMode ? 'bg-emerald-600 shadow-sm' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  fastMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70">
            <button
              type="button"
              onClick={onClose}
              disabled={isTraining}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isTraining}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>모델 재학습 중...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>재학습 & 예측 실행</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
