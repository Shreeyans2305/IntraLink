/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6ff',
          100: '#e4ebff',
          200: '#c9d6ff',
          300: '#9fb6ff',
          400: '#6f8eff',
          500: '#3f66ff',
          600: '#2c4fdb',
          700: '#203ca8',
          800: '#182d7a',
          900: '#12225c',
        },
      },
      animation: {
        fadeIn: 'fadeIn 180ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

