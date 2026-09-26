module.exports = {
  content: ['./src/**/*.{astro,html,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Cabin Sketch', 'Noto Sans SC Variable', 'sans-serif'],
        body: ['Noto Sans SC Variable', 'sans-serif']
      }
    }
  },
  plugins: []
};
