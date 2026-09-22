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
import { LineChart as ChartIcon } from 'lucide-react';
import { ChartPoint } from '../types';

interface StockChartProps {
  points: ChartPoint[];
  assetName: string;
  ticker: string;
}

export const StockChart: React.FC<StockChartProps> = ({ points, assetName, ticker }) => {
  const [subIndicator, setSubIndicator] = useState<'RSI' | 'MACD'>('RSI');
  const [showBB, setShowBB] = useState<boolean>(true);
  const [range, setRange] = useState<number>(90);

  const filteredPoints = points.slice(-range);
  const lastPoint = filteredPoints[filteredPoints.length - 1];

  if (filteredPoints.length === 0) {
    return (
      <div className="glass-panel !rounded-3xl p-5 sm:p-6 h-64 flex items-center justify-center text-sm text-[#86868b]">
        차트 데이터를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="glass-panel !rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#0071e3] flex items-center justify-center border border-black/[0.04]">
            <ChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">기술적 주가 분석 & 지표 차트</h2>
          </div>
          <span className="text-xs text-[#86868b] font-semibold">({ticker})</span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Bollinger Band Chip Button */}
          <button
            onClick={() => setShowBB(!showBB)}
            className={`chip-btn ${showBB ? 'active' : ''}`}
          >
            <span className="chip-dot bg-[#9333ea]" />
            <span>볼린저 밴드</span>
          </button>

          {/* Sub Indicator Segmented Tab */}
          <div className="segmented-track">
            <button
              onClick={() => setSubIndicator('RSI')}
              className={`segmented-btn !py-1 !px-2.5 text-xs ${subIndicator === 'RSI' ? 'selected' : ''}`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setSubIndicator('MACD')}
              className={`segmented-btn !py-1 !px-2.5 text-xs ${subIndicator === 'MACD' ? 'selected' : ''}`}
            >
              MACD
            </button>
          </div>

          {/* Range Selector */}
          <div className="segmented-track">
            {[30, 60, 90, 120].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`segmented-btn !py-1 !px-2 text-xs ${range === d ? 'selected' : ''}`}
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
                <stop offset="5%" stopColor="#0071e3" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#0071e3" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#86868b' }} tickLine={false} />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#94a3b8"
              tick={{ fontSize: 10, fill: '#86868b' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '1rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
                fontSize: '12px',
                color: '#1d1d1f'
              }}
              labelStyle={{ color: '#515154', fontWeight: 700, marginBottom: '4px' }}
            />

            {/* Bollinger Bands */}
            {showBB && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="#9333ea" strokeDasharray="3 3" strokeWidth={1.2} dot={false} name="BB 상단" />
                <Line type="monotone" dataKey="bb_lower" stroke="#9333ea" strokeDasharray="3 3" strokeWidth={1.2} dot={false} name="BB 하단" />
              </>
            )}

            {/* Price Area & Line */}
            <Area type="monotone" dataKey="close" stroke="#0071e3" strokeWidth={2.2} fillOpacity={1} fill="url(#priceGradient)" name="종가(Close)" />
            <Line type="monotone" dataKey="ma20" stroke="#d97706" strokeWidth={1.6} dot={false} name="20일선" />
            <Line type="monotone" dataKey="ema5" stroke="#0284c7" strokeWidth={1.4} dot={false} name="EMA 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Indicator Panel */}
      <div className="pt-3 border-t border-black/[0.05]">
        <div className="flex items-center justify-between text-xs text-[#86868b] mb-1.5 px-1">
          <span className="font-semibold text-[#515154]">
            {subIndicator === 'RSI' ? 'RSI (상대강도지수 14일) - 과매수(70) / 과매도(30)' : 'MACD (이동평균 수렴확산) & Histogram'}
          </span>
          {lastPoint && (
            <span className="font-mono text-[#0071e3] font-bold">
              {subIndicator === 'RSI' && `최신 RSI: ${lastPoint.rsi?.toFixed(1) ?? '-'}`}
              {subIndicator === 'MACD' && `MACD: ${lastPoint.macd?.toFixed(4) ?? '-'} | Hist: ${lastPoint.macd_hist?.toFixed(4) ?? '-'}`}
            </span>
          )}
        </div>

        <div className="h-28 sm:h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {subIndicator === 'RSI' ? (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#86868b' }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#94a3b8" tick={{ fontSize: 9, fill: '#86868b' }} orientation="right" />
                <ReferenceLine y={70} stroke="#e02424" strokeDasharray="3 3" label={{ value: '70 과매수', fill: '#e02424', fontSize: 10, fontWeight: 600 }} />
                <ReferenceLine y={30} stroke="#059669" strokeDasharray="3 3" label={{ value: '30 과매도', fill: '#059669', fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Line type="monotone" dataKey="rsi" stroke="#0284c7" strokeWidth={1.8} dot={false} name="RSI (14)" />
              </ComposedChart>
            ) : (
              <ComposedChart data={filteredPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#86868b' }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 9, fill: '#86868b' }} orientation="right" />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Bar dataKey="macd_hist" fill="#0071e3" fillOpacity={0.7} name="MACD Hist" />
                <Line type="monotone" dataKey="macd" stroke="#d97706" strokeWidth={1.6} dot={false} name="MACD" />
                <Line type="monotone" dataKey="macd_signal" stroke="#9333ea" strokeWidth={1.4} dot={false} name="Signal" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default StockChart;
