/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#06B6D4",
        secondary: "#0891B2",

        dark: {
          bg: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          text: "#F8FAFC",
        },

        light: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          text: "#0F172A",
        },
      },
    },
  },

  plugins: [],
};