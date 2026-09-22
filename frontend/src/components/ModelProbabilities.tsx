import React from 'react';
import { Cpu, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { ModelPredictionDetail } from '../types';

interface ModelProbabilitiesProps {
  models: Record<string, ModelPredictionDetail>;
}

const MODEL_INFO: Record<string, { fullName: string; desc: string; iconColor: string }> = {
  XGB: {
    fullName: 'XGBoost',
    desc: '그래디언트 부스팅 기반 트리 앙상블',
    iconColor: 'text-[#d97706]'
  },
  RF: {
    fullName: 'Random Forest',
    desc: '의사결정 트리 배깅 앙상블',
    iconColor: 'text-[#059669]'
  },
  LGBM: {
    fullName: 'LightGBM',
    desc: '리프 중심 고속 부스팅 모델',
    iconColor: 'text-[#0284c7]'
  },
  LR: {
    fullName: 'Logistic Regression',
    desc: '정규화 지표 기반 선형 확률 분류',
    iconColor: 'text-[#9333ea]'
  },
  Ensemble: {
    fullName: 'Soft Voting Master',
    desc: '가중 결합 기반 종합 앙상블',
    iconColor: 'text-[#0071e3]'
  }
};

export const ModelProbabilities: React.FC<ModelProbabilitiesProps> = ({ models }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#0071e3] flex items-center justify-center border border-black/[0.04]">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">AI 모델별 예측 및 상승 확률 분석</h2>
        </div>
        <span className="text-xs text-[#86868b] font-medium hidden sm:inline">5개 머신러닝 알고리즘 다각도 평가</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {['Ensemble', 'XGB', 'RF', 'LGBM', 'LR']
          .filter(name => models[name])
          .map((name) => {
          const detail = models[name];
          const isUp = detail.signal === 1;
          const probPct = (detail.probability * 100).toFixed(1);
          const meta = MODEL_INFO[name] || {
            fullName: name,
            desc: '머신러닝 분류 모델',
            iconColor: 'text-[#86868b]'
          };
          const isMaster = name === 'Ensemble';

          return (
            <div
              key={name}
              className={`glass-panel glass-panel-hover !rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between relative ${
                isMaster 
                  ? '!bg-white/95 !border-[#0071e3]/35 shadow-[0_4px_20px_rgba(0,113,227,0.08)] ring-1 ring-[#0071e3]/20' 
                  : ''
              }`}
            >
              {isMaster && (
                <div className="absolute -top-2.5 right-3 bg-[#0071e3] text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Master Signal
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-black/[0.03] flex items-center justify-center border border-black/[0.04]">
                      <Layers className={`w-3.5 h-3.5 ${meta.iconColor}`} />
                    </div>
                    <span className="font-bold text-sm text-[#1d1d1f]">{name}</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    isUp 
                      ? 'bg-[#e02424]/[0.08] text-[#e02424] border-[#e02424]/20' 
                      : 'bg-[#059669]/[0.08] text-[#059669] border-[#059669]/20'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{detail.direction}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#86868b] font-medium line-clamp-1 mb-3" title={meta.desc}>
                  {meta.fullName}
                </p>

                {/* Probability Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868b] font-medium">상승 확률</span>
                    <span className="font-mono font-bold text-[#1d1d1f]">{probPct}%</span>
                  </div>
                  <div 
                    className="h-2 w-full bg-black/[0.05] rounded-full overflow-hidden p-0.5 border border-black/[0.03]"
                    role="progressbar"
                    aria-valuenow={detail.probability * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUp ? 'bg-[#e02424]' : 'bg-[#059669]'
                      }`}
                      style={{ width: `${detail.probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868b] font-medium">
                <span>정확도: <strong className="text-[#1d1d1f]">{detail.accuracy ? `${(detail.accuracy * 100).toFixed(1)}%` : '-'}</strong></span>
                <span>F1: <strong className="text-[#1d1d1f]">{detail.f1_score ? detail.f1_score.toFixed(3) : '-'}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModelProbabilities;
