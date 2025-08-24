// postcss.config.js
module.exports = {
  plugins: {
    'postcss-nesting': {},     // if you use nesting rules
    '@tailwindcss/postcss': {}, // Tailwind’s new PostCSS integration
    autoprefixer: {},          // vendor prefixes
  },
}