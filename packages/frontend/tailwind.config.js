/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        race_bg: 'url("/bgs/race-bg.jpg")',
        race_bg_track: 'url("/bgs/race-background.jpg")',
        bullrun_bg: 'url("/bgs/bullrun-bg.jpg")',
        underdog_bg: 'url("/bgs/underdog-gameplay-bg.jpg")',
        underdog_cover_bg: 'url("/bgs/underdog-cover-bg.jpg")',
        rabbit_hole_cover_bg: 'url("/bgs/rabbit-hole-cover-bg.jpg")',
        stats_top_bg: 'url("/bgs/podium.jpg")',
        bullrun_cover_bg: 'url("/bgs/bullrun-cover-bg.jpg")',
        bullrun_rules_bg: 'url("/bgs/bullrun-rules-bg.jpg")',
        bullrun_next_bg: 'url("/bgs/bullrun-next-round-bg.png")',
      },
    },
  },
  plugins: [],
};
