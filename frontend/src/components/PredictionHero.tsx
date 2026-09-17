import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Calendar, Zap, Target, Sparkles } from 'lucide-react';
import { PredictionOverviewResponse } from '../types';

interface PredictionHeroProps {
  data: PredictionOverviewResponse;
}

export const PredictionHero: React.FC<PredictionHeroProps> = ({ data }) => {
  const isBullish = data.avg_probability >= 0.52;
  const isBearish = data.avg_probability <= 0.48;
  const isNeutral = !isBullish && !isBearish;

  const probPercent = (data.avg_probability * 100).toFixed(1);

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-glass-specular border border-white/90">
      {/* Apple Intelligence Multi-Chromatic Ambient Reflection */}
      <div 
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none ${
          isBullish 
            ? 'bg-gradient-to-bl from-teal-300 via-cyan-200 to-transparent' 
            : (isBearish 
                ? 'bg-gradient-to-bl from-rose-400 via-pink-300 to-transparent' 
                : 'bg-gradient-to-bl from-purple-300 via-indigo-200 to-transparent')
        }`}
      />
      <div 
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-tr from-cyan-300 via-purple-300 to-rose-200"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Left: Asset Info & Latest Price */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 text-slate-800 border border-white/90 shadow-2xs">
                {data.ticker}
              </span>
              <span className="text-xs text-slate-600 font-medium bg-white/70 px-2.5 py-1 rounded-xl border border-white/90 shadow-2xs flex items-center gap-1 backdrop-blur-md">
                기준일: <strong className="text-slate-900">{data.base_date}</strong>
              </span>
              {data.total_records ? (
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/70 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>총 {data.total_records.toLocaleString()}건 분석</span>
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {data.asset_name}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-black text-slate-900 tracking-tight">
              ${data.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl shadow-2xs border ${
              data.daily_change_pct >= 0 
                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80' 
                : 'bg-rose-50/90 text-rose-700 border-rose-200/80'
            }`}>
              {data.daily_change_pct >= 0 ? '+' : ''}{data.daily_change_pct}%
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 px-3.5 py-2 rounded-2xl border border-white/90 shadow-2xs backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>예측 대상 거래일 :</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              {data.target_date} (익일)
            </span>
          </div>
        </div>

        {/* Middle: AI Prediction Direction Badge & Probability Meter */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-white/70 rounded-3xl border border-white/90 shadow-sm backdrop-blur-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-600" /> AI 익일 주가 예측 방향
          </div>

          {/* Large Direction Indicator */}
          <div className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl font-black text-lg sm:text-xl border shadow-md transition-transform duration-200 hover:scale-105 ${
            isBullish 
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white border-emerald-400/40 shadow-emerald-500/20'
              : (isBearish 
                  ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white border-rose-400/40 shadow-rose-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/40 shadow-amber-500/20')
          }`}>
            {isBullish && <TrendingUp className="w-6 h-6 animate-pulse text-emerald-100" />}
            {isBearish && <TrendingDown className="w-6 h-6 animate-pulse text-rose-100" />}
            {isNeutral && <Minus className="w-6 h-6" />}
            <span>{data.overall_direction}</span>
          </div>

          {/* Probability Bar */}
          <div className="w-full mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">앙상블 상승 확률</span>
              <span className={isBullish ? 'text-emerald-700 font-mono text-sm' : (isBearish ? 'text-rose-700 font-mono text-sm' : 'text-amber-700 font-mono text-sm')}>
                {probPercent}%
              </span>
            </div>
            <div className="h-3.5 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5 border border-white/90 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                  isBullish
                    ? 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-500' 
                    : (isBearish 
                        ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-red-500' 
                        : 'bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400')
                }`}
                style={{ width: `${Math.min(Math.max(data.avg_probability * 100, 5), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
              <span>0% (강한 하락)</span>
              <span>50% (중립)</span>
              <span>100% (강한 상승)</span>
            </div>
          </div>
        </div>

        {/* Right: AI Opinion & Confidence Score with Apple Intelligence Accent */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full bg-white/70 p-5 rounded-3xl border border-white/90 shadow-sm backdrop-blur-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-600" /> AI 종합 분석 의견
            </div>
            <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-50/90 to-indigo-50/90 border border-purple-200/80 text-purple-900 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>신뢰도: <strong className="text-purple-950 font-black">{data.confidence_score}%</strong></span>
            </div>
          </div>

          <div className="relative group">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-white/80 p-3.5 rounded-2xl border border-white/90 shadow-2xs">
              "{data.ai_opinion}"
            </p>
            <div className="absolute -left-1 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-cyan-400 via-purple-500 to-rose-500 opacity-80" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 font-medium">
            <span>설정 임계치: <strong className="text-slate-700">+{((data.parameters.threshold || 0.002) * 100).toFixed(2)}%</strong></span>
            <span>룩백 윈도우: <strong className="text-slate-700">{data.parameters.window_size || 5}일</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
