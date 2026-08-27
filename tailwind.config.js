/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        primary: {
          DEFAULT: '#1D2A1C',
          foreground: '#FDFBF7',
          light: '#2D3E2C'
        },
        accent: {
          DEFAULT: '#D87A4F',
          foreground: '#FFFFFF',
          light: '#FBECE3'
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EFE6',
          200: '#C8DCC8',
          500: '#5C7A58',
          800: '#233221',
          900: '#1D2A1C'
        },
        muted: {
          DEFAULT: '#F3F2EE',
          foreground: '#72706B'
        }
      },
      fontFamily: {
        serif: ['serif'],
        sans: ['Roboto', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
