import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Sliders, Search, ChevronDown, Scale } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-white/78 backdrop-blur-[28px] saturate-[180%] border-b border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Brand Logo & Title (Neutral Non-commercial Research Branding) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => onSelectAsset('SnP500')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.28)] transition-transform duration-200 group-hover:scale-105">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#1d1d1f]">
                    StockAlgo AI
                  </span>
                  <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0071e3]/[0.08] text-[#0071e3] border border-[#0071e3]/20">
                    주가 알고리즘 분석 · S&P 500 · NASDAQ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Segmented Instrument Selector & Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-xl">
            {/* Segmented Control Track */}
            <div className="segmented-track">
              {presets.map((preset) => {
                const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                                 currentAsset.toLowerCase() === preset.ticker.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectAsset(preset.id)}
                    className={`segmented-btn ${isActive ? 'selected' : ''}`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Popular Assets Dropdown Pill */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="glass-button !py-1.5 !px-3 text-xs font-semibold text-[#515154] hover:text-[#1d1d1f]"
              >
                <span>인기 종목</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showDropdown && (
                <div className="absolute left-0 mt-2 w-52 bg-white/95 backdrop-blur-[24px] border border-black/[0.08] rounded-2xl shadow-glass-hover py-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                    글로벌 주요 자산
                  </div>
                  {popular.map((item) => (
                    <button
                      key={item.ticker}
                      onClick={() => {
                        onSelectAsset(item.ticker);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-black/[0.04] text-[#1d1d1f] transition"
                    >
                      <span className="font-bold text-[#0071e3]">{item.ticker}</span>
                      <span className="text-[#86868b] text-[11px] truncate max-w-[100px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Ticker Search Input */}
            <form onSubmit={handleSearch} className="relative w-36 lg:w-44">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
              <input
                type="text"
                placeholder="티커 검색 (예: TSLA)"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                className="w-full bg-white/80 border border-black/[0.08] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]"
              />
            </form>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenLegal && (
              <button
                onClick={onOpenLegal}
                className="glass-button !py-2 !px-3 text-xs text-[#515154] hover:text-[#1d1d1f]"
                title="법적 고지 및 면책 조항 열람"
              >
                <Scale className="w-3.5 h-3.5 text-[#86868b]" />
                <span className="hidden lg:inline">면책고지</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading || isSyncing}
              className="glass-button !py-2 !px-3 sm:!px-3.5 text-xs"
              title="최신 시장 시세 데이터 갱신"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0071e3] ${(isLoading || isSyncing) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">
                {(isLoading || isSyncing) ? '갱신 중...' : '데이터 갱신'}
              </span>
            </button>

            <button
              onClick={onOpenParams}
              disabled={isLoading || isSyncing}
              className="btn-apple-primary !py-2 !px-3 sm:!px-3.5 text-xs font-semibold"
              title="AI 모델 재학습 및 파라미터 튜닝"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI 모델 재학습</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-bar for Instrument Selection */}
        <div className="md:hidden flex items-center justify-between gap-2 py-2 border-t border-black/[0.04]">
          <div className="segmented-track flex-1">
            {presets.map((preset) => {
              const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                               currentAsset.toLowerCase() === preset.ticker.toLowerCase();
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectAsset(preset.id)}
                  className={`segmented-btn flex-1 justify-center text-xs ${isActive ? 'selected' : ''}`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearch} className="relative w-32">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="티커 (TSLA)"
              value={customTicker}
              onChange={(e) => setCustomTicker(e.target.value)}
              className="w-full bg-white/90 border border-black/[0.08] rounded-full pl-7 pr-2 py-1 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none"
            />
          </form>
        </div>

      </div>
    </header>
  );
};

export default Header;
