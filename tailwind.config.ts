import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        leaf: "#2f7a58",
        citrus: "#f4bd4a",
        tomato: "#d95745",
        sky: "#8fc7d3",
        porcelain: "#f6f4ee",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(23, 33, 27, 0.08)",
        card: "0 10px 24px rgba(23, 33, 27, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
