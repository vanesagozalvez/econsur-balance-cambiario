import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        institucional: {
          navy: "#1F3864",
          teal: "#2E86AB",
          gray: "#A6A6A6",
          amber: "#D97706",
          darkgray: "#6B7280",
          lightteal: "#8FBFE0",
          bg: "#F5F7FA",
          card: "#FFFFFF",
          border: "#E5E7EB",
          text: "#1F2937",
          textsec: "#6B7280",
        },
      },
      fontFamily: {
        institucional: ["Arial", "Helvetica", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(31, 56, 100, 0.06), 0 1px 3px 0 rgba(31, 56, 100, 0.08)",
        cardHover: "0 4px 12px 0 rgba(31, 56, 100, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
