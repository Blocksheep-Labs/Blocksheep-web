/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        play_pattern: 'url("/bgs/bg.png")',
        race_pattern: 'url("/bgs/race-background.png")',
        race_bg: 'url("/bgs/race-bg.png")',
        tunnel_bg: 'url("/bgs/tunnel-bg.png")',
        bullrun_bg: 'url("/bgs/bullrun-bg.png")',
        underdog_bg: 'url("/bgs/underdog-gameplay-bg.png")',
        underdog_cover_bg: 'url("/bgs/underdog-cover-bg.png")',
        rabbit_hole_cover_bg: 'url("/bgs/rabbit-hole-cover-bg.png")',
        stats_top_bg: 'url("/bgs/podium.png")',
        bullrun_cover_bg: 'url("/bgs/bullrun-cover-bg.png")',
        bullrun_rules_bg: 'url("/bgs/bullrun-rules-bg.png")',
        bullrun_next_bg: 'url("/bgs/bullrun-next-round-bg.png")',
      },
    },
  },
  plugins: [],
};
