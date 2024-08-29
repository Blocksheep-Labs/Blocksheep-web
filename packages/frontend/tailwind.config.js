/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        play_pattern: 'url("/bg.png")',
        race_pattern: 'url("/race-background.png")',
        race_bg: 'url("/race-bg.png")',
        tunnel_bg: 'url("/tunnel-bg.png")',
        underdog_cover_bg: 'url("/underdog-cover-bg.png")',
        rabbit_hole_cover_bg: 'url("/rabbit-hole-cover-bg.png")',
      },
    },
  },
  plugins: [],
};
