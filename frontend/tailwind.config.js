/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          canvas: '#f5f6fa',
          surface: 'rgba(255, 255, 255, 0.78)',
          card: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(0, 0, 0, 0.07)',
          borderBright: 'rgba(0, 0, 0, 0.12)',
          text: '#1d1d1f',
          muted: '#515154',
          dim: '#86868b',
          blue: '#0071e3',
          blueHover: '#0077ed',
          blueGlow: 'rgba(0, 113, 227, 0.25)',
        },
        direction: {
          up: '#e02424',
          upBg: 'rgba(224, 36, 36, 0.08)',
          upBorder: 'rgba(224, 36, 36, 0.25)',
          down: '#059669',
          downBg: 'rgba(5, 150, 105, 0.08)',
          downBorder: 'rgba(5, 150, 105, 0.25)',
          sideways: '#d97706',
          sidewaysBg: 'rgba(217, 119, 6, 0.08)',
          sidewaysBorder: 'rgba(217, 119, 6, 0.25)',
        }
      },
      boxShadow: {
        'glass': '0 4px 20px rgba(0, 0, 0, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
        'glass-card': '0 12px 32px 0 rgba(0, 0, 0, 0.04), 0 2px 6px 0 rgba(0, 0, 0, 0.02), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
        'glass-hover': '0 16px 40px -4px rgba(0, 0, 0, 0.07), 0 6px 16px -2px rgba(0, 0, 0, 0.03), inset 0 1px 2px 0 rgba(255, 255, 255, 1)',
        'glass-button': '0 4px 14px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        'apple-btn': '0 6px 20px rgba(0, 113, 227, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Pretendard Variable"', 'Pretendard', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
