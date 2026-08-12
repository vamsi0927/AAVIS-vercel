/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6", // teal-500
        secondary: "#0ea5e9", // sky-500
      },
    },
  },
  plugins: [],
}
