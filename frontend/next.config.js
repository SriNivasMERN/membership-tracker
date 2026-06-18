const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => ({
  reactStrictMode: false,
  // Keep dev-time chunks/cache separate from production build output
  // so `next dev` and `next build` never overwrite each other.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
