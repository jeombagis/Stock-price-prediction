import React from 'react';
import { TrendingUp, RefreshCw, Sliders, Scale } from 'lucide-react';
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
  popular?: AssetInfo[];
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
}) => {
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
                    S&P 500 · NASDAQ-100 · ML 모델 운용
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Segmented Instrument Selector for S&P 500 & NASDAQ-100 */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-xs">
            <div className="segmented-track w-full flex">
              {presets.map((preset) => {
                const isActive = currentAsset.toLowerCase() === preset.id.toLowerCase() || 
                                 currentAsset.toLowerCase() === preset.ticker.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectAsset(preset.id)}
                    className={`segmented-btn flex-1 justify-center text-xs font-semibold ${isActive ? 'selected' : ''}`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
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
        </div>

      </div>
    </header>
  );
};

export default Header;
