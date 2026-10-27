import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-chakra)", "sans-serif"] },
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffe0df",
          500: "#d32b33",
          600: "#bd2027",
          700: "#94171d",
          900: "#701319",
        },
      },
    },
  },
  plugins: [],
};
export default config;
