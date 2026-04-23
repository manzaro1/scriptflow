import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(() => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));