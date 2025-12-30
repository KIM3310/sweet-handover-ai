import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
