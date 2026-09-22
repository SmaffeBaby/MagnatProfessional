import flowbite from 'flowbite/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        magnat: {
          red: '#c40f1c',
          deep: '#9f0712',
          light: '#ef3332',
        },
      },
    },
  },
  plugins: [flowbite],
}
