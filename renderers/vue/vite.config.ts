import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 告诉 Vue：a2ui-* 开头的标签是自定义元素（Web Components）
          // 不要作为 Vue 组件处理
          isCustomElement: (tag) => tag.startsWith("a2ui-"),
        },
      },
    }),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "A2UIVue",
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue", "@a2ui/lit", "@a2ui/lit/0.8", "@a2ui/lit/ui"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
