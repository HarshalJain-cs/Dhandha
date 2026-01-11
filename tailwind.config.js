/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9e7',
          100: '#fdf3d0',
          200: '#fbe7a1',
          300: '#f9db72',
          400: '#f7cf43',
          500: '#d4af37', // Gold color (existing)
          600: '#b8962f',
          700: '#9b7e27',
          800: '#7e651f',
          900: '#614d17',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts with Ant Design
  },
}
