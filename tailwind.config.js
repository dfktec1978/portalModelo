/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azul: "#003049",
        vermelho: "#D62828",
        amarelo: "#FDC500",
        branco: "#FFFFFF",
        preto: "#222222",
      },
    },
  },
  plugins: [],
};
