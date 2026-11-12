/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#060a12',
          900: '#0b1120',
          850: '#0f172a',
          800: '#15203b',
          700: '#1e2e54',
          600: '#2a3f73',
          border: '#1f2e52',
          'border-bright': '#2d447a',
          cyan: '#00f2fe',
          cyanGlow: 'rgba(0, 242, 254, 0.25)',
          blue: '#38bdf8',
          blueGlow: 'rgba(56, 189, 248, 0.25)',
          red: '#f43f5e',
          redGlow: 'rgba(244, 63, 94, 0.25)',
          amber: '#f59e0b',
          amberGlow: 'rgba(245, 158, 11, 0.25)',
          emerald: '#10b981',
          emeraldGlow: 'rgba(16, 185, 129, 0.25)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
