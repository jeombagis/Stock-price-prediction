import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Sliders, Search, Sparkles, ChevronDown } from 'lucide-react';
import { AssetInfo } from '../types';

interface HeaderProps {
  currentAsset: string;
  onSelectAsset: (assetId: string) => void;
  onRefresh: () => void;
  onOpenParams: () => void;
  isLoading: boolean;
  presets: AssetInfo[];
  popular: AssetInfo[];
}

export const Header: React.FC<HeaderProps> = ({
  currentAsset,
  onSelectAsset,
  onRefresh,
  onOpenParams,
  isLoading,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white ring-1 ring-white/60">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">StockPredict AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Ensemble & TimeSeries AI 주가 예측 시스템</p>
            </div>
          </div>

          {/* Asset Tabs & Search */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-center max-w-2xl">
            {/* Apple Segmented Control */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner backdrop-blur-md">
              {presets.map((preset) => {
                const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                                 currentAsset.toLowerCase() === preset.ticker.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectAsset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 shadow-xs transition backdrop-blur-md"
              >
                <span>인기 종목</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50/80 text-slate-700 transition"
                    >
                      <span className="font-bold text-emerald-600">{item.ticker}</span>
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
                className="w-full bg-white/80 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition backdrop-blur-md"
              />
            </form>
          </div>

          {/* Action Buttons (Params & Sync) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenParams}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 shadow-xs transition backdrop-blur-md"
              title="파라미터 튜닝"
            >
              <Sliders className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">모델 설정</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 shadow-xs transition backdrop-blur-md ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="실시간 데이터 동기화"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
