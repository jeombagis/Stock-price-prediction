import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Calendar, ArrowRight, Zap, Target } from 'lucide-react';
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
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isBullish ? 'bg-emerald-500' : (isBearish ? 'bg-rose-500' : 'bg-amber-500')
        }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Asset Info & Latest Price */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                {data.ticker}
              </span>
              <span className="text-xs text-gray-400">데이터 기준일: {data.base_date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              {data.asset_name}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-white">
              ${data.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-lg ${
              data.daily_change_pct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {data.daily_change_pct >= 0 ? '+' : ''}{data.daily_change_pct}%
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/60 px-3 py-2 rounded-xl border border-gray-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>예측 대상 거래일 :</span>
            <span className="font-semibold text-gray-200 flex items-center gap-1">
              {data.target_date} (익일)
            </span>
          </div>
        </div>

        {/* Middle: AI Prediction Direction Badge & Probability Meter */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-gray-900/50 rounded-2xl border border-gray-800/80">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> AI 익일 주가 예측 방향
          </div>

          {/* Large Direction Indicator */}
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-lg sm:text-xl border shadow-lg ${
            isBullish 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
              : (isBearish 
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-rose-500/10'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-amber-500/10')
          }`}>
            {isBullish && <TrendingUp className="w-6 h-6 animate-pulse" />}
            {isBearish && <TrendingDown className="w-6 h-6 animate-pulse" />}
            {isNeutral && <Minus className="w-6 h-6" />}
            <span>{data.overall_direction}</span>
          </div>

          {/* Probability Bar */}
          <div className="w-full mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-400">앙상블 상승 확률</span>
              <span className={isBullish ? 'text-emerald-400 font-mono text-sm' : (isBearish ? 'text-rose-400 font-mono text-sm' : 'text-amber-400 font-mono text-sm')}>
                {probPercent}%
              </span>
            </div>
            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isBullish
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500' 
                    : (isBearish 
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500')
                }`}
                style={{ width: `${Math.min(Math.max(data.avg_probability * 100, 5), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 px-0.5">
              <span>0% (강한 하락)</span>
              <span>50% (중립)</span>
              <span>100% (강한 상승)</span>
            </div>
          </div>
        </div>

        {/* Right: AI Opinion & Confidence Score */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full bg-gray-900/40 p-4 rounded-2xl border border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Target className="w-4 h-4" /> AI 종합 투자 의견
            </div>
            <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>신뢰도: <strong className="text-white">{data.confidence_score}%</strong></span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal bg-black/20 p-3 rounded-xl border border-gray-800/50">
            "{data.ai_opinion}"
          </p>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800">
            <span>설정 임계치: <strong>+{((data.parameters.threshold || 0.002) * 100).toFixed(2)}%</strong></span>
            <span>룩백 윈도우: <strong>{data.parameters.window_size || 5}일</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
