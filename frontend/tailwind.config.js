/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Палітра з макета в README: темно-синій фон, сині акценти, зелені бейджі match
        ink: {
          950: '#05080f',
          900: '#0a0f1c',
          850: '#0e1526',
          800: '#121a2e',
          700: '#1b2540',
          600: '#27324f',
        },
        brand: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
