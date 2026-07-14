/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a6ff',
          500: '#3183ff',
          600: '#1a63f5',
          700: '#154de1',
          800: '#183fb6',
          900: '#193a8f',
        },
      },
      keyframes: {
        'message-in': {
          '0%': { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.5 },
          '40%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        'message-in': 'message-in 0.22s ease-out',
        'bounce-dot': 'bounce-dot 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
