/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f6f3',
          100: '#ebe8e1',
          200: '#d4cfc1',
          400: '#8a8479',
          600: '#5c5650',
          800: '#2a2620',
          900: '#1a1714',
          950: '#0e0c0a',
        },
        gold: {
          400: '#ffd76b',
          500: '#ffc940',
          600: '#d9a522',
        },
        ember: {
          400: '#ff8a5b',
          500: '#ff6b4a',
          600: '#e44a2a',
        },
      },
      fontFamily: {
        han: ['"Noto Sans SC"', '"PingFang SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        mergeGlow: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)', filter: 'brightness(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-4px)' },
          '30%': { transform: 'translateX(4px)' },
          '45%': { transform: 'translateX(-2px)' },
          '60%': { transform: 'translateX(2px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-20px) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateY(120vh) rotate(720deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        wobble: 'wobble 0.5s ease',
        pop: 'pop 0.35s cubic-bezier(.22,1,.36,1)',
        'merge-glow': 'mergeGlow 0.45s ease',
        shake: 'shake 0.4s ease',
        confetti: 'confetti 1.6s linear forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
