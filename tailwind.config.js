/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        accent: '#43E8A4',
        warning: '#FFD166',
        'dark-bg': '#0F0F1A',
        'card-bg': '#1A1A2E',
        'text-primary': '#FFFFFF',
        'text-muted': '#8888AA',
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1' }],
        'display-lg': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
}
