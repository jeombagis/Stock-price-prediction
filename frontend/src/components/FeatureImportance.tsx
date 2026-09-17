import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { BarChart3, HelpCircle, Layers } from 'lucide-react';
import { FeatureImportanceItem } from '../types';
import { api } from '../services/api';

interface FeatureImportanceProps {
  assetKey: string;
}

const BAR_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16',
  '#14b8a6', '#0ea5e9', '#6366f1', '#d946ef', '#64748b'
];

export const FeatureImportance: React.FC<FeatureImportanceProps> = ({ assetKey }) => {
  const [selectedModel, setSelectedModel] = useState<string>('XGB');
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadFeatureImportance = async () => {
      setLoading(true);
      try {
        const res = await api.getFeatureImportance(assetKey, selectedModel);
        if (isMounted) {
          // 차트 가독성을 위해 상위 항목들을 위에서부터 표시할 수 있도록 reverse
          setFeatures(res.features);
        }
      } catch (err) {
        console.error("Failed to load feature importance:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFeatureImportance();
    return () => { isMounted = false; };
  }, [assetKey, selectedModel]);

  // Recharts Y축 표시용 역순 데이터 (가장 높은 중요도가 상단에 오도록)
  const chartData = [...features].reverse();

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 shadow-glass border border-white/90">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-600" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">AI 핵심 피처 중요도 분석</h2>
          <span className="text-xs text-slate-400 font-medium">(상위 15개 요인)</span>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60 text-xs shadow-inner">
          {['XGB', 'RF', 'LGBM'].map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1 rounded-lg transition font-semibold ${
                selectedModel === model
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {model === 'XGB' ? 'XGBoost' : (model === 'RF' ? 'Random Forest' : 'LightGBM')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-slate-600">피처 중요도 산출 중...</span>
          </div>
        </div>
      ) : features.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          피처 중요도 데이터를 불러올 수 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Chart View */}
          <div className="lg:col-span-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${(Number(value) * 100).toFixed(2)}%`,
                    props.payload.description || '중요도'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.08)',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Highlight List */}
          <div className="lg:col-span-4 bg-white/60 p-4 rounded-2xl border border-white/80 shadow-xs space-y-3 backdrop-blur-md">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              가장 영향력이 큰 TOP 5 지표
            </span>
            <div className="space-y-2">
              {features.slice(0, 5).map((item, idx) => (
                <div key={item.feature} className="flex items-start justify-between text-xs bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{item.feature}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5 line-clamp-1">{item.description}</p>
                  </div>
                  <span className="font-mono font-bold text-cyan-700 text-xs">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
