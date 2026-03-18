import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#F8F5F0",
          surface: "#FFFFFF",
          elevated: "#F0EBE3",
          input: "#F0EBE3",
        },
        terracotta: "#D97746",
        amber: "#E89A20",
        parchment: {
          DEFAULT: "#1C1C1E",
          dim: "#636366",
          muted: "#9B8B7A",
        },
        success: "#2E7D32",
        warning: "#E89A20",
        error: "#C62828",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Cormorant Garamond", "serif"],
      },
      fontSize: {
        hero: "42px",
        xl2: "28px",
        lg: "18px",
        md: "15px",
        sm: "13px",
        xs: "11px",
      },
      borderRadius: {
        card: "14px",
        btn: "24px",
        input: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 2px 12px rgba(217, 119, 70, 0.08)",
        modal: "0 8px 40px rgba(0,0,0,0.12)",
      },
      width: {
        sidebar: "220px",
      },
    },
  },
  plugins: [],
};

export default config;
