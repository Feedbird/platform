// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <-- 'class' strategy
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // ...
  ],
  theme: {
    
    extend: {
      colors: {
        primary: '#475467',    // Your primary color
        title: '#101828',
        background: '#FFFFFF', // Default background color
        border: "#EAECF0",
        black: '#1C1D1F',
        grey: '#838488',
        feedbird: '#125AFF',
        borderPrimary: '#EAE9E9',
        borderButton: '#E6E7EA',
        card: '#FFFFFF',
        cardForeground: '#1C1D1F',
        darkGrey: '#5C5E63',
        main: '#4670F9',
        buttonStroke: '#D3D3D3',
        elementStroke: '#EAE9E9',
      },
      // Set default border color to primary
      borderColor: ({ theme }) => ({
        DEFAULT: theme('colors.border'),
      }),
      fontFamily: {
        rubik: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
