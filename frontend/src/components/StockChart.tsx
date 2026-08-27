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
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">기술적 주가 분석 & 보조지표 차트</h2>
          <span className="text-xs text-gray-400">({ticker})</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Bollinger Band Toggle */}
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showBB 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            볼린저 밴드 {showBB ? 'ON' : 'OFF'}
          </button>

          {/* Sub Indicator Tab */}
          <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-xs">
            <button
              onClick={() => setSubIndicator('RSI')}
              className={`px-2.5 py-1 rounded-md transition ${
                subIndicator === 'RSI' ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setSubIndicator('MACD')}
              className={`px-2.5 py-1 rounded-md transition ${
                subIndicator === 'MACD' ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              MACD
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-xs">
            {[30, 60, 90, 120].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-2 py-1 rounded-md transition ${
                  range === d ? 'bg-gray-700 text-white font-semibold' : 'text-gray-400 hover:text-white'
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
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}
            />

            {/* Bollinger Bands */}
            {showBB && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={1} dot={false} name="BB 상단" />
                <Line type="monotone" dataKey="bb_lower" stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={1} dot={false} name="BB 하단" />
              </>
            )}

            {/* Price Area & Line */}
            <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" name="종가(Close)" />
            <Line type="monotone" dataKey="ma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="20일 이평선" />
            <Line type="monotone" dataKey="ema5" stroke="#38bdf8" strokeWidth={1} dot={false} name="EMA 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Indicator Panel */}
      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1 px-1">
          <span className="font-semibold text-gray-300">
            {subIndicator === 'RSI' ? 'RSI (상대강도지수 14일) - 과매수(70) / 과매도(30)' : 'MACD (이동평균 수렴확산) & Histogram'}
          </span>
          {lastPoint && (
            <span className="font-mono text-emerald-400">
              {subIndicator === 'RSI' && `최신 RSI: ${lastPoint.rsi?.toFixed(1) ?? '-'}`}
              {subIndicator === 'MACD' && `MACD: ${lastPoint.macd?.toFixed(4) ?? '-'} | Hist: ${lastPoint.macd_hist?.toFixed(4) ?? '-'}`}
            </span>
          )}
        </div>

        <div className="h-28 sm:h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {subIndicator === 'RSI' ? (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#6b7280" tick={{ fontSize: 9 }} orientation="right" />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '70 과매수', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30 과매도', fill: '#10b981', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1.8} dot={false} name="RSI (14)" />
              </ComposedChart>
            ) : (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#6b7280" tick={{ fontSize: 9 }} orientation="right" />
                <ReferenceLine y={0} stroke="#4b5563" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <Bar dataKey="macd_hist" fill="#3b82f6" name="MACD Hist" />
                <Line type="monotone" dataKey="macd" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MACD" />
                <Line type="monotone" dataKey="macd_signal" stroke="#ec4899" strokeWidth={1.2} dot={false} name="Signal" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
