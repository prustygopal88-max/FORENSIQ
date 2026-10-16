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
        forensiq: {
          bg: '#07090e',
          card: '#0f1422',
          cardHover: '#141c2e',
          surface: '#182238',
          border: '#1f2a40',
          borderLight: '#2a3a57',
          cyan: '#06b6d4',
          cyanGlow: '#0891b2',
          blue: '#3b82f6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          muted: '#8b9bb4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
