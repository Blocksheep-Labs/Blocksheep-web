/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        play_pattern: 'url("/public/bg.png")',
        race_pattern: 'url("/public/race-background.png")',
        race_bg: 'url("/public/race-bg.png")',
      },
    },
  },
  plugins: [],
};
