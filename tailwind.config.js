const colors = require('tailwindcss/colors')

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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#2563EB',
        accent: '#22C55E',
        textColor: '#111111',
        buttonHover: '#1D4ED8',
        // Project-wide branding remap: force legacy purple/pink/yellow usages
        // into the blue/green palette from community-connect-main
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
    },
  },
  plugins: [],
}
