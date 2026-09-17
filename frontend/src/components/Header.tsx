import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Sliders, Search, Sparkles, ChevronDown, Scale } from 'lucide-react';
import { AssetInfo } from '../types';

interface HeaderProps {
  currentAsset: string;
  onSelectAsset: (assetId: string) => void;
  onRefresh: () => void;
  onOpenParams: () => void;
  onOpenLegal?: () => void;
  isLoading: boolean;
  isSyncing?: boolean;
  presets: AssetInfo[];
  popular: AssetInfo[];
}

export const Header: React.FC<HeaderProps> = ({
  currentAsset,
  onSelectAsset,
  onRefresh,
  onOpenParams,
  onOpenLegal,
  isLoading,
  isSyncing = false,
  presets,
  popular,
}) => {
  const [customTicker, setCustomTicker] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTicker.trim()) {
      onSelectAsset(customTicker.trim().toUpperCase());
      setCustomTicker('');
      setShowDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/80 bg-white/70 backdrop-blur-2xl shadow-[0_4px_30px_-5px_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand with Apple Intelligence Ring */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="h-10 w-10 rounded-2xl p-[1.5px] bg-gradient-to-tr from-cyan-400 via-purple-500 to-rose-500 shadow-md shadow-purple-500/15 transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-white/90 rounded-[14px] flex items-center justify-center backdrop-blur-md">
                  <TrendingUp className="h-5 w-5 text-purple-600 transition-colors group-hover:text-rose-500" />
                </div>
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-purple-500/20 to-rose-500/20 blur-sm -z-10 group-hover:opacity-100 opacity-60 transition" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">StockPredict AI</span>
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-50 via-purple-50 to-pink-50 text-purple-700 border border-purple-200/80 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-purple-500 animate-pulse" /> Beta
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Ensemble & TimeSeries AI 주가 예측 시스템</p>
            </div>
          </div>

          {/* Asset Tabs & Search */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-center max-w-2xl">
            {/* Apple Segmented Control */}
            <div className="flex items-center bg-slate-200/40 p-1 rounded-2xl border border-white/80 shadow-inner backdrop-blur-md">
              {presets.map((preset) => {
                const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                                 currentAsset.toLowerCase() === preset.ticker.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectAsset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90 ring-1 ring-slate-900/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/30'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Popular Assets Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/75 border border-white/90 text-slate-700 hover:text-slate-900 hover:bg-white/90 shadow-xs transition backdrop-blur-md"
              >
                <span>인기 종목</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-glass-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    글로벌 주요 자산
                  </div>
                  {popular.map((item) => (
                    <button
                      key={item.ticker}
                      onClick={() => {
                        onSelectAsset(item.ticker);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-purple-50/50 text-slate-700 transition"
                    >
                      <span className="font-extrabold text-indigo-600">{item.ticker}</span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[110px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Ticker Search Input */}
            <form onSubmit={handleSearch} className="relative hidden md:block w-44">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="티커 검색 (예: TSLA)"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                className="w-full bg-white/75 border border-white/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 shadow-xs transition backdrop-blur-md"
              />
            </form>
          </div>

          {/* Action Buttons (Latest Data Sync & AI Model Retrain) */}
          <div className="flex items-center gap-2">
            {onOpenLegal && (
              <button
                onClick={onOpenLegal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/80 border border-white/90 text-slate-600 hover:text-slate-900 hover:bg-white shadow-xs transition backdrop-blur-md active:scale-95"
                title="법적 고지, 저작권 및 면책 조항 열람"
              >
                <Scale className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">면책조항</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading || isSyncing}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 backdrop-blur-md border shadow-xs ${
                (isLoading || isSyncing)
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800 cursor-wait'
                  : 'bg-white/80 border-white/90 text-slate-700 hover:text-emerald-700 hover:bg-white hover:border-emerald-200 active:scale-95'
              }`}
              title="최신 시장 데이터 강제 동기화 (yfinance)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${(isLoading || isSyncing) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {(isLoading || isSyncing) ? '데이터 갱신 중...' : '최신 데이터 갱신'}
              </span>
            </button>

            <button
              onClick={onOpenParams}
              disabled={isLoading || isSyncing}
              className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 backdrop-blur-md disabled:opacity-50"
              title="AI 앙상블 모델 재학습 및 하이퍼파라미터 튜닝"
            >
              <Sliders className="w-3.5 h-3.5 text-white/90 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">AI 모델 재학습</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
