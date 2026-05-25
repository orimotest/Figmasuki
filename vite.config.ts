import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
      output: {
        entryFileNames: "ui.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
