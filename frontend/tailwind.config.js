/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#00d4ff",
        "accent-hover": "#00b8e6",
      },
    },
  },
  plugins: [],
};
