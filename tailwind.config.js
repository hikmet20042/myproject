/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // darkMode removed
  theme: {
    extend: {
      colors: {
        primary: '#722f37',
        accent: '#f2e8dc',
        textColor: '#111111',
        buttonHover: '#3f3f3f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
