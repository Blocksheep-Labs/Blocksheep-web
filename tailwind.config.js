/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'play_pattern': 'url("/public/bg.png")'
      }
    },
  },
  plugins: [],
}