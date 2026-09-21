import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { FeatureImportanceItem } from '../types';
import { api } from '../services/api';

interface FeatureImportanceProps {
  assetKey: string;
  refreshKey?: number;
}

// Apple Cool Cohesive Fintech Palette
const BAR_COLORS = [
  '#0071e3', '#0077ed', '#0284c7', '#0ea5e9', '#38bdf8',
  '#2563eb', '#3b82f6', '#4f46e5', '#6366f1', '#818cf8',
  '#06b6d4', '#0891b2', '#0d9488', '#14b8a6', '#64748b'
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
    <div className="glass-panel !rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#0071e3] flex items-center justify-center border border-black/[0.04]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">AI 핵심 피처 중요도</h2>
          </div>
          <span className="text-xs text-[#86868b] font-semibold">(TOP 15)</span>
        </div>

        {/* Model Selector Segmented Tabs */}
        <div className="segmented-track">
          {['XGB', 'RF', 'LGBM'].map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`segmented-btn !py-1 !px-2.5 text-xs ${selectedModel === model ? 'selected' : ''}`}
            >
              {model === 'XGB' ? 'XGBoost' : (model === 'RF' ? 'Random Forest' : 'LightGBM')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-[#515154]">피처 중요도 산출 중...</span>
          </div>
        </div>
      ) : features.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">
          피처 중요도 데이터가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Chart View */}
          <div className="lg:col-span-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fill: '#86868b' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#1d1d1f', fontWeight: 600 }}
                  width={85}
                />
                <Tooltip
                  formatter={(value: any, _, props: any) => [
                    `${(Number(value) * 100).toFixed(2)}%`,
                    props.payload.description || '중요도'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
                    color: '#1d1d1f'
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
          <div className="lg:col-span-4 p-3.5 rounded-2xl bg-white/60 border border-black/[0.05] shadow-xs space-y-2.5">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
              가장 영향력이 큰 TOP 5
            </span>
            <div className="space-y-1.5">
              {features.slice(0, 5).map((item, idx) => (
                <div key={item.feature} className="flex items-start justify-between text-xs bg-white/80 p-2 rounded-xl border border-black/[0.04]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#1d1d1f]">
                      <span className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{item.feature}</span>
                    </div>
                    <p className="text-[10px] text-[#86868b] pl-5 line-clamp-1">{item.description}</p>
                  </div>
                  <span className="font-mono font-bold text-[#0071e3] text-xs self-center">
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

export default FeatureImportance;
