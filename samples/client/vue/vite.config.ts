import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { a2aMiddleware } from "./vite-plugins/a2a-middleware";

export default defineConfig({
  plugins: [vue(), a2aMiddleware()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
});
