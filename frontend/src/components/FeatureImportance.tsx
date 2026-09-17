import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { BarChart3, HelpCircle, Layers } from 'lucide-react';
import { FeatureImportanceItem } from '../types';
import { api } from '../services/api';

interface FeatureImportanceProps {
  assetKey: string;
  refreshKey?: number;
}

const BAR_COLORS = [
  '#00c7be', '#007aff', '#5856d6', '#8b5cf6', '#af52de',
  '#d946ef', '#ff2d55', '#ff9f0a', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#ec4899', '#14b8a6', '#64748b'
];

export const FeatureImportance: React.FC<FeatureImportanceProps> = ({ assetKey, refreshKey }) => {
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
  }, [assetKey, selectedModel, refreshKey]);

  const chartData = [...features].reverse();

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 shadow-glass-specular border border-white/90">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100/80 shadow-2xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">AI 핵심 피처 중요도 분석</h2>
          <span className="text-xs text-slate-400 font-semibold">(상위 15개 요인)</span>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex bg-slate-200/40 p-0.5 rounded-xl border border-white/80 text-xs shadow-inner backdrop-blur-md">
          {['XGB', 'RF', 'LGBM'].map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1 rounded-lg transition font-bold ${
                selectedModel === model
                  ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90'
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
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-slate-600">피처 중요도 산출 중...</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${(Number(value) * 100).toFixed(2)}%`,
                    props.payload.description || '중요도'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.08)',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Highlight List */}
          <div className="lg:col-span-4 bg-white/70 p-4 rounded-3xl border border-white/90 shadow-sm space-y-3 backdrop-blur-xl">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              가장 영향력이 큰 TOP 5 요인
            </span>
            <div className="space-y-2">
              {features.slice(0, 5).map((item, idx) => (
                <div key={item.feature} className="flex items-start justify-between text-xs bg-white/85 p-2.5 rounded-2xl border border-white/90 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                        {idx + 1}
                      </span>
                      <span>{item.feature}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7 line-clamp-1 font-medium">{item.description}</p>
                  </div>
                  <span className="font-mono font-black text-indigo-700 text-xs">
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
