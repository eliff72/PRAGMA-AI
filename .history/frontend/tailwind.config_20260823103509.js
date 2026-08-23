/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF1F8",
          100: "#DCE1F0",
          200: "#B3BEDD",
          400: "#4C5D9E",
          600: "#233266",
          700: "#1B2854",
          800: "#152452",
          900: "#0D1636",
        },
        signal: {
          orange: "#F97316",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
