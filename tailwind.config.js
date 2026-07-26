/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './admin.html',
    './image-uploader.html',
    './app.js',
    './admin.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d97706',
        warm: '#b45309',
      },
      fontFamily: {
        serif: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
}
