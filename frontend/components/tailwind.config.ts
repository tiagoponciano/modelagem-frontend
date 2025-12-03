import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Importante para o dark mode manual funcionar bem
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // <--- VERIFIQUE SE ESTA LINHA EXISTE
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // suas extensões...
    },
  },
  plugins: [],
};
export default config;
