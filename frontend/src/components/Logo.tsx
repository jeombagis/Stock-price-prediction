import React, { useId } from 'react';

export interface LogoProps {
  /** Size in pixels or preset string ('sm' = 24px, 'md' = 36px, 'lg' = 48px) */
  size?: number | 'sm' | 'md' | 'lg';
  /** Whether to show the text 'StockAlgo AI' next to the emblem */
  showText?: boolean;
  /** Whether to show the index & model status badge */
  showBadge?: boolean;
  /** Custom badge text */
  badgeText?: string;
  /** Additional classes for container */
  className?: string;
  /** Additional classes for the emblem SVG */
  iconClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  showBadge = false,
  badgeText = 'S&P 500 · NASDAQ-100 · ML 모델 운용',
  className = '',
  iconClassName = '',
}) => {
  const uniqueId = useId().replace(/:/g, '-');

  const dimension =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 24
      : size === 'lg'
      ? 48
      : 36;

  const bgId = `stockalgo-bg${uniqueId}`;
  const rimId = `stockalgo-rim${uniqueId}`;
  const specularId = `stockalgo-specular${uniqueId}`;
  const areaId = `stockalgo-area${uniqueId}`;
  const maskGradId = `stockalgo-mask-grad${uniqueId}`;
  const maskId = `stockalgo-mask${uniqueId}`;
  const bar1Id = `stockalgo-bar1${uniqueId}`;
  const bar2Id = `stockalgo-bar2${uniqueId}`;
  const bar3Id = `stockalgo-bar3${uniqueId}`;
  const bar4Id = `stockalgo-bar4${uniqueId}`;
  const trajId = `stockalgo-traj${uniqueId}`;
  const nodeHaloId = `stockalgo-node-halo${uniqueId}`;
  const glowId = `stockalgo-glow${uniqueId}`;
  const sparkId = `stockalgo-spark${uniqueId}`;

  const emblem = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={dimension}
      height={dimension}
      className={`rounded-xl shadow-[0_2px_10px_rgba(0,113,227,0.28)] flex-shrink-0 select-none ${iconClassName}`}
      aria-hidden={showText ? 'true' : undefined}
      aria-label={!showText ? 'StockAlgo AI 로고' : undefined}
    >
      <defs>
        {/* Background Gradient: Apple Pro Deep Navy / Royal Blue */}
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0077ED" />
          <stop offset="50%" stopColor="#0056C7" />
          <stop offset="100%" stopColor="#002466" />
        </linearGradient>

        {/* Glass Rim Highlight */}
        <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
        </linearGradient>

        {/* Ambient Top-Left Specular Light */}
        <radialGradient id={specularId} cx="22%" cy="18%" r="65%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#0077ED" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0077ED" stopOpacity="0" />
        </radialGradient>

        {/* Horizon Area Gradient */}
        <linearGradient id={areaId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
          <stop offset="70%" stopColor="#0071E3" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0071E3" stopOpacity="0" />
        </linearGradient>

        {/* Mask to fade out area fill on the right */}
        <linearGradient id={maskGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="512" height="512" fill={`url(#${maskGradId})`} />
        </mask>

        {/* Candlestick Bar Gradients */}
        <linearGradient id={bar1Id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
        </linearGradient>

        <linearGradient id={bar2Id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.22" />
        </linearGradient>

        <linearGradient id={bar3Id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.28" />
        </linearGradient>

        {/* AI Predicted Forward Candlestick */}
        <linearGradient id={bar4Id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
        </linearGradient>

        {/* Trajectory Stroke Gradient */}
        <linearGradient id={trajId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="30%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Node Halo Gradient */}
        <radialGradient id={nodeHaloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
          <stop offset="60%" stopColor="#0071E3" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0071E3" stopOpacity="0" />
        </radialGradient>

        {/* Glow Filters */}
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={sparkId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Apple Squircle Base with Precision Rim */}
      <rect width="512" height="512" rx="114" fill={`url(#${bgId})`} />
      <rect width="512" height="512" rx="114" fill={`url(#${specularId})`} />
      <rect
        x="8"
        y="8"
        width="496"
        height="496"
        rx="106"
        fill="none"
        stroke={`url(#${rimId})`}
        strokeWidth="4"
      />

      {/* 2. Technical Coordinate Grid */}
      <g opacity="0.55">
        <line
          x1="76"
          y1="185"
          x2="436"
          y2="185"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeDasharray="6 8"
          strokeWidth="1.5"
        />
        <line
          x1="76"
          y1="285"
          x2="436"
          y2="285"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeDasharray="6 8"
          strokeWidth="1.5"
        />
        <line
          x1="76"
          y1="385"
          x2="436"
          y2="385"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeDasharray="6 8"
          strokeWidth="1.5"
        />
      </g>

      {/* 3. Candlesticks: 3 Historical + 1 AI Forecast Pillar */}
      {/* Historical Bar 1 */}
      <g>
        <line
          x1="115"
          y1="275"
          x2="115"
          y2="415"
          stroke="#7DD3FC"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <rect
          x="98"
          y="300"
          width="34"
          height="95"
          rx="8"
          fill={`url(#${bar1Id})`}
          stroke="#BAE6FD"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
      </g>

      {/* Historical Bar 2 */}
      <g>
        <line
          x1="183"
          y1="220"
          x2="183"
          y2="415"
          stroke="#7DD3FC"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        <rect
          x="166"
          y="245"
          width="34"
          height="150"
          rx="8"
          fill={`url(#${bar2Id})`}
          stroke="#BAE6FD"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
      </g>

      {/* Historical Bar 3 */}
      <g>
        <line
          x1="251"
          y1="160"
          x2="251"
          y2="415"
          stroke="#7DD3FC"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <rect
          x="234"
          y="185"
          width="34"
          height="210"
          rx="8"
          fill={`url(#${bar3Id})`}
          stroke="#FFFFFF"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
      </g>

      {/* AI Predicted Pillar 4 */}
      <g>
        <line
          x1="319"
          y1="115"
          x2="319"
          y2="415"
          stroke="#38BDF8"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <rect
          x="302"
          y="135"
          width="34"
          height="260"
          rx="8"
          fill={`url(#${bar4Id})`}
          stroke="#67E8F9"
          strokeWidth="2"
          strokeOpacity="0.9"
        />
      </g>

      {/* 4. Area Gradient Under Prediction Curve */}
      <path
        d="M 80 360 C 145 355, 190 290, 251 225 C 310 160, 360 125, 420 102 L 440 420 L 80 420 Z"
        fill={`url(#${areaId})`}
        mask={`url(#${maskId})`}
      />

      {/* 5. Trajectory Glow Underlayer */}
      <path
        d="M 80 360 C 145 355, 190 290, 251 225 C 310 160, 360 125, 420 102"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        filter={`url(#${glowId})`}
      />

      {/* 6. Trajectory Main Vector */}
      <path
        d="M 80 360 C 145 355, 190 290, 251 225 C 310 160, 360 125, 420 102"
        fill="none"
        stroke={`url(#${trajId})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 7. Discrete Algorithmic Data Nodes */}
      <circle cx="115" cy="346" r="6" fill="#FFFFFF" opacity="0.95" />
      <circle cx="183" cy="295" r="6" fill="#FFFFFF" opacity="0.98" />
      <circle cx="251" cy="225" r="7.5" fill="#FFFFFF" />
      <circle cx="319" cy="163" r="7.5" fill="#FFFFFF" />

      {/* 8. AI Target Apex Beacon & Starburst */}
      <circle
        cx="420"
        cy="102"
        r="28"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeDasharray="5 4"
        opacity="0.9"
      />
      <circle
        cx="420"
        cy="102"
        r="20"
        fill={`url(#${nodeHaloId})`}
        opacity="0.85"
      />
      <circle cx="420" cy="102" r="9.5" fill="#FFFFFF" />
      <path
        d="M 420 72 L 424.5 97.5 L 450 102 L 424.5 106.5 L 420 132 L 415.5 106.5 L 390 102 L 415.5 97.5 Z"
        fill="#FFFFFF"
        filter={`url(#${sparkId})`}
        opacity="0.95"
      />
    </svg>
  );

  if (!showText) {
    return emblem;
  }

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {emblem}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#1d1d1f]">
            StockAlgo{' '}
            <span className="bg-gradient-to-r from-[#0071e3] to-[#0a84ff] bg-clip-text text-transparent font-black">
              AI
            </span>
          </span>
          {showBadge && (
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0071e3]/[0.08] text-[#0071e3] border border-[#0071e3]/20">
              {badgeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logo;
