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
          canvas: '#f8fafc',
          card: 'rgba(255, 255, 255, 0.72)',
          border: 'rgba(255, 255, 255, 0.85)',
          subtle: 'rgba(241, 245, 249, 0.6)',
        },
        bullish: {
          DEFAULT: '#059669', // emerald-600
          light: '#10b981',
          dark: '#047857',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        bearish: {
          DEFAULT: '#e11d48', // rose-600
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
        'glass-sm': '0 4px 20px -2px rgba(0, 0, 0, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.95)',
        'glass': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
        'glass-lg': '0 20px 45px -10px rgba(0, 0, 0, 0.07), 0 8px 16px -4px rgba(0, 0, 0, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 1)',
        'glass-glow': '0 0 35px -5px rgba(59, 130, 246, 0.15)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
