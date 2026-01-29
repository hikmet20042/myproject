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
        primary: '#2A7DE1',
        accent: '#29CC7A',
        textColor: '#111111',
        buttonHover: '#1e5fb8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
