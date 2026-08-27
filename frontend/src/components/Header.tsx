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
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">StockPredict AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Pro
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">Ensemble & TimeSeries AI 주가 예측 시스템</p>
            </div>
          </div>

          {/* Asset Tabs & Search */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-center max-w-2xl">
            {/* Preset Buttons */}
            <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-800">
              {presets.map((preset) => {
                const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                                 currentAsset.toLowerCase() === preset.ticker.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectAsset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Popular Assets Dropdown & Custom Search */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition"
              >
                <span>인기 종목</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    글로벌 주요 자산
                  </div>
                  {popular.map((item) => (
                    <button
                      key={item.ticker}
                      onClick={() => {
                        onSelectAsset(item.ticker);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-800 text-gray-200 transition"
                    >
                      <span className="font-semibold text-emerald-400">{item.ticker}</span>
                      <span className="text-gray-400 text-[11px] truncate max-w-[110px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Ticker Search Input */}
            <form onSubmit={handleSearch} className="relative hidden md:block w-44">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="티커 검색 (예: TSLA)"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </form>
          </div>

          {/* Action Buttons (Params & Sync) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenParams}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition"
              title="파라미터 튜닝"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">모델 설정</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="실시간 데이터 동기화"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
