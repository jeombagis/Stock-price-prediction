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
          canvas: '#fbfcfd',
          card: 'rgba(255, 255, 255, 0.72)',
          border: 'rgba(255, 255, 255, 0.88)',
          subtle: 'rgba(248, 250, 252, 0.65)',
        },
        intelligence: {
          cyan: '#00c7be',
          blue: '#007aff',
          indigo: '#5856d6',
          purple: '#af52de',
          magenta: '#d946ef',
          coral: '#ff2d55',
          orange: '#ff9f0a',
          emerald: '#34c759',
        },
        bullish: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        bearish: {
          DEFAULT: '#e11d48',
          light: '#f43f5e',
          dark: '#be123c',
          bg: 'rgba(244, 63, 94, 0.1)',
        },
        accent: {
          blue: '#2563eb',
          purple: '#7c3aed',
          cyan: '#0891b2',
          amber: '#d97706',
          indigo: '#4f46e5',
        }
      },
      boxShadow: {
        'glass-sm': '0 4px 16px -2px rgba(0, 0, 0, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.95)',
        'glass': '0 10px 32px -4px rgba(15, 23, 42, 0.04), 0 4px 8px -2px rgba(15, 23, 42, 0.02), inset 0 1px 1px 0 rgba(255, 255, 255, 0.98)',
        'glass-lg': '0 20px 48px -8px rgba(15, 23, 42, 0.06), 0 8px 16px -4px rgba(15, 23, 42, 0.02), inset 0 1px 1px 0 rgba(255, 255, 255, 1)',
        'glass-specular': '0 12px 35px -5px rgba(15, 23, 42, 0.05), inset 0 1.5px 1px 0 rgba(255, 255, 255, 1), inset 0 0 20px 0 rgba(255, 255, 255, 0.25)',
        'intelligence-glow': '0 0 35px -5px rgba(175, 82, 222, 0.22), 0 0 20px -3px rgba(0, 199, 190, 0.18)',
        'intelligence-glow-lg': '0 0 55px -6px rgba(175, 82, 222, 0.26), 0 0 32px -4px rgba(0, 199, 190, 0.22), 0 0 24px -4px rgba(255, 45, 85, 0.18)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
