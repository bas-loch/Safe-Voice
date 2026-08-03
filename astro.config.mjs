import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ilparadiso-hammamet.netlify.app",
  output: "static",
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
