import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Calendar, Activity, Zap } from 'lucide-react';
import { PredictionOverviewResponse } from '../types';

interface PredictionHeroProps {
  data: PredictionOverviewResponse;
}

const BULLISH_THRESHOLD = 0.52;
const BEARISH_THRESHOLD = 0.48;

export const PredictionHero: React.FC<PredictionHeroProps> = ({ data }) => {
  const isBullish = data.avg_probability >= BULLISH_THRESHOLD;
  const isBearish = data.avg_probability <= BEARISH_THRESHOLD;
  const isNeutral = !isBullish && !isBearish;

  const probPercent = (data.avg_probability * 100).toFixed(1);

  return (
    <div className="glass-panel !rounded-3xl p-5 sm:p-7 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Asset Info & Latest Price */}
        <div className="lg:col-span-4 space-y-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/90 text-[#1d1d1f] border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                {data.ticker}
              </span>
              <span className="text-xs text-[#515154] font-medium bg-black/[0.03] px-2.5 py-1 rounded-lg border border-black/[0.04] flex items-center gap-1">
                기준일: <strong className="text-[#1d1d1f]">{data.base_date}</strong>
              </span>
              {data.total_records ? (
                <span className="text-[11px] text-[#0071e3] font-semibold bg-[#0071e3]/[0.06] px-2.5 py-1 rounded-lg border border-[#0071e3]/15 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                  <span>{data.total_records.toLocaleString()}건 분석</span>
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] mt-2.5 tracking-tight">
              {data.asset_name}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#1d1d1f] tracking-tight">
              ${data.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
              data.daily_change_pct >= 0 
                ? 'bg-[#e02424]/[0.08] text-[#e02424] border-[#e02424]/20' 
                : 'bg-[#059669]/[0.08] text-[#059669] border-[#059669]/20'
            }`}>
              {data.daily_change_pct >= 0 ? '+' : ''}{data.daily_change_pct}%
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#515154] bg-white/70 px-3.5 py-2 rounded-xl border border-black/[0.06]">
            <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>예측 대상 거래일:</span>
            <span className="font-bold text-[#1d1d1f]">
              {data.target_date} (익일)
            </span>
          </div>
        </div>

        {/* Middle: AI Prediction Direction & Probability Meter */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-white/60 border border-black/[0.06] shadow-sm">
          <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#0071e3]" /> AI 익일 주가 예측 방향
          </div>

          {/* Direction Badge */}
          <div className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-extrabold text-lg sm:text-xl border shadow-sm transition-transform duration-200 ${
            isBullish 
              ? 'bg-[#e02424] text-white border-[#e02424]/50 shadow-[#e02424]/20'
              : (isBearish 
                  ? 'bg-[#059669] text-white border-[#059669]/50 shadow-[#059669]/20'
                  : 'bg-[#d97706] text-white border-[#d97706]/50 shadow-[#d97706]/20')
          }`}>
            {isBullish && <TrendingUp className="w-5 h-5 text-white" />}
            {isBearish && <TrendingDown className="w-5 h-5 text-white" />}
            {isNeutral && <Minus className="w-5 h-5 text-white" />}
            <span>{data.overall_direction}</span>
          </div>

          {/* Probability Gauge Bar */}
          <div className="w-full mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#515154]">앙상블 상승 확률</span>
              <span className={`font-mono text-sm font-bold ${
                isBullish ? 'text-[#e02424]' : (isBearish ? 'text-[#059669]' : 'text-[#d97706]')
              }`}>
                {probPercent}%
              </span>
            </div>
            
            <div 
              className="h-3 w-full bg-black/[0.06] rounded-full overflow-hidden p-0.5 border border-black/[0.04]"
              role="progressbar"
              aria-valuenow={Math.min(Math.max(data.avg_probability * 100, 5), 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isBullish
                    ? 'bg-[#e02424]' 
                    : (isBearish 
                        ? 'bg-[#059669]' 
                        : 'bg-[#d97706]')
                }`}
                style={{ width: `${Math.min(Math.max(data.avg_probability * 100, 5), 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-[#86868b] font-medium px-0.5">
              <span>0% (하락 확률 높음)</span>
              <span>50%</span>
              <span>100% (상승 확률 높음)</span>
            </div>
          </div>
        </div>

        {/* Right: AI Opinion & Confidence Score */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full p-5 rounded-2xl bg-white/60 border border-black/[0.06] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
              <Activity className="w-4 h-4 text-[#0071e3]" /> AI 종합 의견
            </div>
            <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#0071e3]/[0.08] border border-[#0071e3]/20 text-[#0071e3] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>신뢰도: <strong>{data.confidence_score}%</strong></span>
            </div>
          </div>

          <div className="relative pl-3 border-l-2 border-[#0071e3]">
            <p className="text-xs sm:text-sm text-[#515154] leading-relaxed font-medium">
              "{data.ai_opinion}"
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-2 border-t border-black/[0.05] font-medium">
            <span>판단 임계치: <strong className="text-[#1d1d1f]">+{((data.parameters.threshold || 0.002) * 100).toFixed(2)}%</strong></span>
            <span>룩백 윈도우: <strong className="text-[#1d1d1f]">{data.parameters.window_size || 5}일</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PredictionHero;
