import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#0fb880',
        'primary-dark': '#059669',
        secondary: '#0ea5e9',
        'accent-teal': '#14b8a6',
        'background-light': '#f6f8f7',
        'background-dark': '#10221c',
        'surface-dark': '#162e26',
        eco: {
          emerald: '#10b981',
          teal: '#0ea5e9',
          dark: '#0f172a',
          darker: '#020617',
        },
      },
      backgroundImage: {
        'gradient-eco': 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(16, 185, 129, 0.1)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        glow: '0 0 20px rgba(16, 185, 129, 0.4)',
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      },
      keyframes: {
        pulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      screens: { mobile: '390px', tablet: '768px', desktop: '1024px' },
    },
  },
  plugins: [],
} satisfies Config;
