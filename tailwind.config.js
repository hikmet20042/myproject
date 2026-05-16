const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#2563EB',
        accent: '#22C55E',
        textColor: '#111111',
        buttonHover: '#1D4ED8',
        indigo: colors.blue,
        purple: colors.blue,
        violet: colors.cyan,
        fuchsia: colors.emerald,
        pink: colors.emerald,
        rose: colors.green,
        yellow: colors.emerald,
        amber: colors.green,
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 4px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
