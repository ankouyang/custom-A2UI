import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "A2UIVue",
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue", "@a2ui/lit"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
