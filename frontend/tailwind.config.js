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
          950: '#070b16',
          900: '#0b1329',
          850: '#0f1b38',
          800: '#15244a',
          700: '#1e3366',
          600: '#2c478a',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-bright': 'rgba(0, 242, 254, 0.25)',
          cyan: '#00f2fe',
          blue: '#38bdf8',
          violet: '#8b5cf6',
          red: '#f43f5e',
          amber: '#f59e0b',
          emerald: '#10b981',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'mesh-dark': 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(244, 63, 94, 0.1) 0px, transparent 50%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.3) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(0, 242, 254, 0.2)',
        'glow-cyan': '0 0 25px rgba(0, 242, 254, 0.3)',
        'glow-red': '0 0 25px rgba(244, 63, 94, 0.3)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
