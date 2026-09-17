import React from 'react';
import { Cpu, CheckCircle2, TrendingUp, TrendingDown, Layers, HelpCircle } from 'lucide-react';
import { ModelPredictionDetail } from '../types';

interface ModelProbabilitiesProps {
  models: Record<string, ModelPredictionDetail>;
}

const MODEL_INFO: Record<string, { fullName: string; desc: string; iconColor: string }> = {
  XGB: {
    fullName: 'XGBoost Classifier',
    desc: '그래디언트 부스팅 기반의 고성능 트리 앙상블 모델',
    iconColor: 'text-amber-500'
  },
  RF: {
    fullName: 'Random Forest',
    desc: '다수의 의사결정 트리를 배깅하여 과적합을 방지하는 앙상블',
    iconColor: 'text-emerald-600'
  },
  LGBM: {
    fullName: 'LightGBM',
    desc: '리프 중심 트리 분할로 빠른 학습과 높은 정확도를 자랑하는 모델',
    iconColor: 'text-cyan-600'
  },
  LR: {
    fullName: 'Logistic Regression',
    desc: '스케일링된 기술적 지표들의 선형 조합 기반 분류 모델',
    iconColor: 'text-purple-600'
  },
  Ensemble: {
    fullName: 'Soft Voting Master Ensemble',
    desc: '4개 핵심 모델의 예측 확률을 가중 결합한 최종 앙상블',
    iconColor: 'text-indigo-600'
  }
};

export const ModelProbabilities: React.FC<ModelProbabilitiesProps> = ({ models }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">AI 모델별 개별 예측 및 상승 확률</h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">5개 머신러닝 알고리즘 다각도 분석</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Object.entries(models).map(([name, detail]) => {
          const isUp = detail.signal === 1;
          const probPct = (detail.probability * 100).toFixed(1);
          const meta = MODEL_INFO[name] || {
            fullName: name,
            desc: '머신러닝 분류 모델',
            iconColor: 'text-slate-400'
          };
          const isMaster = name === 'Ensemble';

          return (
            <div
              key={name}
              className={`liquid-glass glass-panel-hover rounded-2xl p-4 flex flex-col justify-between relative shadow-sm border border-white/80 backdrop-blur-xl ${
                isMaster ? 'border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 to-white/75 shadow-indigo-100/40' : ''
              }`}
            >
              {isMaster && (
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ring-2 ring-white">
                  Master Signal
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className={`w-4 h-4 ${meta.iconColor}`} />
                    <span className="font-extrabold text-sm text-slate-900">{name}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border shadow-xs ${
                    isUp 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                      : 'bg-rose-50 text-rose-700 border-rose-200/80'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{detail.direction}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-1 mb-3" title={meta.desc}>
                  {meta.fullName}
                </p>

                {/* Probability */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">상승 확률</span>
                    <span className="font-mono font-bold text-slate-900">{probPct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100/90 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUp ? 'bg-gradient-to-r from-teal-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-red-500'
                      }`}
                      style={{ width: `${detail.probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
                <span>정확도: <strong className="text-slate-800 font-bold">{detail.accuracy ? `${(detail.accuracy * 100).toFixed(1)}%` : '-'}</strong></span>
                <span>F1: <strong className="text-slate-800 font-bold">{detail.f1_score ? detail.f1_score.toFixed(3) : '-'}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
