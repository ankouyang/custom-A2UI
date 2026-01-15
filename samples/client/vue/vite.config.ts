import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { a2aMiddleware } from "./vite-plugins/a2a-middleware";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 告诉 Vue：a2ui-* 开头的标签是自定义元素（Web Components）
          isCustomElement: (tag) => tag.startsWith("a2ui-"),
        },
      },
    }),
    a2aMiddleware(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
});
