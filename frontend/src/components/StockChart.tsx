import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area
} from 'recharts';
import { LineChart as ChartIcon, Activity, Layers, Calendar } from 'lucide-react';
import { ChartPoint } from '../types';

interface StockChartProps {
  points: ChartPoint[];
  assetName: string;
  ticker: string;
}

export const StockChart: React.FC<StockChartProps> = ({ points, assetName, ticker }) => {
  const [subIndicator, setSubIndicator] = useState<'RSI' | 'MACD'>('RSI');
  const [showBB, setShowBB] = useState<boolean>(true);
  const [range, setRange] = useState<number>(90); // 최근 N일

  const filteredPoints = points.slice(-range);

  // 최신가 및 변동
  const lastPoint = filteredPoints[filteredPoints.length - 1];

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 shadow-glass-specular border border-white/90">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs">
            <ChartIcon className="w-4 h-4" />
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">기술적 주가 분석 & 보조지표 차트</h2>
          <span className="text-xs text-slate-400 font-semibold">({ticker})</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Bollinger Band Toggle */}
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-2xs ${
              showBB 
                ? 'bg-purple-500 text-white border-purple-400 shadow-purple-500/20'
                : 'bg-white/80 text-slate-500 border-white/90 hover:text-slate-900 hover:bg-white'
            }`}
          >
            볼린저 밴드 {showBB ? 'ON' : 'OFF'}
          </button>

          {/* Sub Indicator Tab */}
          <div className="flex bg-slate-200/40 p-0.5 rounded-xl border border-white/80 text-xs shadow-inner backdrop-blur-md">
            <button
              onClick={() => setSubIndicator('RSI')}
              className={`px-3 py-1 rounded-lg transition font-bold ${
                subIndicator === 'RSI' ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setSubIndicator('MACD')}
              className={`px-3 py-1 rounded-lg transition font-bold ${
                subIndicator === 'MACD' ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              MACD
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex bg-slate-200/40 p-0.5 rounded-xl border border-white/80 text-xs shadow-inner backdrop-blur-md">
            {[30, 60, 90, 120].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-2.5 py-1 rounded-lg transition font-bold ${
                  range === d ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stock Price Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#94a3b8"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '1.25rem',
                boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.08), 0 0 20px -3px rgba(175, 82, 222, 0.1)',
                fontSize: '12px',
                color: '#0f172a'
              }}
              labelStyle={{ color: '#64748b', fontWeight: 800, marginBottom: '4px' }}
            />

            {/* Bollinger Bands */}
            {showBB && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={1.2} dot={false} name="BB 상단" />
                <Line type="monotone" dataKey="bb_lower" stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={1.2} dot={false} name="BB 하단" />
              </>
            )}

            {/* Price Area & Line */}
            <Area type="monotone" dataKey="close" stroke="#059669" strokeWidth={2.4} fillOpacity={1} fill="url(#priceGradient)" name="종가(Close)" />
            <Line type="monotone" dataKey="ma20" stroke="#f97316" strokeWidth={1.8} dot={false} name="20일 이평선" />
            <Line type="monotone" dataKey="ema5" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="EMA 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Indicator Panel */}
      <div className="pt-3 border-t border-slate-200/70">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 px-1">
          <span className="font-bold text-slate-700">
            {subIndicator === 'RSI' ? 'RSI (상대강도지수 14일) - 과매수(70) / 과매도(30)' : 'MACD (이동평균 수렴확산) & Histogram'}
          </span>
          {lastPoint && (
            <span className="font-mono text-emerald-700 font-bold">
              {subIndicator === 'RSI' && `최신 RSI: ${lastPoint.rsi?.toFixed(1) ?? '-'}`}
              {subIndicator === 'MACD' && `MACD: ${lastPoint.macd?.toFixed(4) ?? '-'} | Hist: ${lastPoint.macd_hist?.toFixed(4) ?? '-'}`}
            </span>
          )}
        </div>

        <div className="h-28 sm:h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {subIndicator === 'RSI' ? (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#94a3b8" tick={{ fontSize: 9, fill: '#64748b' }} orientation="right" />
                <ReferenceLine y={70} stroke="#e11d48" strokeDasharray="3 3" label={{ value: '70 과매수', fill: '#e11d48', fontSize: 10, fontWeight: 600 }} />
                <ReferenceLine y={30} stroke="#059669" strokeDasharray="3 3" label={{ value: '30 과매도', fill: '#059669', fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    boxShadow: '0 8px 20px -2px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Line type="monotone" dataKey="rsi" stroke="#0891b2" strokeWidth={2} dot={false} name="RSI (14)" />
              </ComposedChart>
            ) : (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 9, fill: '#64748b' }} orientation="right" />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    boxShadow: '0 8px 20px -2px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar dataKey="macd_hist" fill="#3b82f6" fillOpacity={0.8} name="MACD Hist" />
                <Line type="monotone" dataKey="macd" stroke="#d97706" strokeWidth={1.8} dot={false} name="MACD" />
                <Line type="monotone" dataKey="macd_signal" stroke="#ec4899" strokeWidth={1.4} dot={false} name="Signal" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
