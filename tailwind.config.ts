import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102A2E",
        teal: { 50: "#F0FDFA", 100: "#CCFBF1", 500: "#14B8A6", 600: "#0D9488", 700: "#0F766E", 900: "#134E4A" }
      },
      boxShadow: { soft: "0 12px 40px rgba(15, 118, 110, 0.08)" }
    }
  },
  plugins: []
} satisfies Config;
