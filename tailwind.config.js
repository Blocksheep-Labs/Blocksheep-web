/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        play_pattern: 'url("/bg.png")',
        race_pattern: 'url("/race-background.png")',
        race_bg: 'url("/race-bg.png")',
      },
    },
  },
  plugins: [],
};
