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
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">AI 핵심 피처 중요도 분석</h2>
          <span className="text-xs text-gray-400">(상위 15개 요인)</span>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-xs">
          {['XGB', 'RF', 'LGBM'].map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedModel === model
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {model === 'XGB' ? 'XGBoost' : (model === 'RF' ? 'Random Forest' : 'LightGBM')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>피처 중요도 산출 중...</span>
          </div>
        </div>
      ) : features.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#9ca3af"
                  tick={{ fontSize: 11, fill: '#d1d5db' }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${(Number(value) * 100).toFixed(2)}%`,
                    props.payload.description || '중요도'
                  ]}
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
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
          <div className="lg:col-span-4 bg-gray-900/50 p-3.5 rounded-xl border border-gray-800 space-y-2.5">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              가장 영향력이 큰 TOP 5 지표
            </span>
            <div className="space-y-2">
              {features.slice(0, 5).map((item, idx) => (
                <div key={item.feature} className="flex items-start justify-between text-xs bg-gray-900/80 p-2 rounded-lg border border-gray-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item.feature}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 pl-5 line-clamp-1">{item.description}</p>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-xs">
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
