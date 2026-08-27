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
    iconColor: 'text-amber-400'
  },
  RF: {
    fullName: 'Random Forest',
    desc: '다수의 의사결정 트리를 배깅하여 과적합을 방지하는 앙상블',
    iconColor: 'text-emerald-400'
  },
  LGBM: {
    fullName: 'LightGBM',
    desc: '리프 중심 트리 분할로 빠른 학습과 높은 정확도를 자랑하는 모델',
    iconColor: 'text-cyan-400'
  },
  LR: {
    fullName: 'Logistic Regression',
    desc: '스케일링된 기술적 지표들의 선형 조합 기반 분류 모델',
    iconColor: 'text-purple-400'
  },
  Ensemble: {
    fullName: 'Soft Voting Master Ensemble',
    desc: '4개 핵심 모델의 예측 확률을 가중 결합한 최종 앙상블',
    iconColor: 'text-indigo-400'
  }
};

export const ModelProbabilities: React.FC<ModelProbabilitiesProps> = ({ models }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">AI 모델별 개별 예측 및 상승 확률</h2>
        </div>
        <span className="text-xs text-gray-400">5개 머신러닝 알고리즘 다각도 분석</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Object.entries(models).map(([name, detail]) => {
          const isUp = detail.signal === 1;
          const probPct = (detail.probability * 100).toFixed(1);
          const meta = MODEL_INFO[name] || {
            fullName: name,
            desc: '머신러닝 분류 모델',
            iconColor: 'text-gray-400'
          };
          const isMaster = name === 'Ensemble';

          return (
            <div
              key={name}
              className={`glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative ${
                isMaster ? 'border-indigo-500/40 bg-indigo-950/20' : ''
              }`}
            >
              {isMaster && (
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  Master Signal
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className={`w-4 h-4 ${meta.iconColor}`} />
                    <span className="font-bold text-sm text-white">{name}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{detail.direction}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-1 mb-3" title={meta.desc}>
                  {meta.fullName}
                </p>

                {/* Probability */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">상승 확률</span>
                    <span className="font-mono font-bold text-white">{probPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUp ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${detail.probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
                <span>정확도(Acc): <strong className="text-gray-200">{detail.accuracy ? `${(detail.accuracy * 100).toFixed(1)}%` : '-'}</strong></span>
                <span>F1 Score: <strong className="text-gray-200">{detail.f1_score ? detail.f1_score.toFixed(3) : '-'}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
