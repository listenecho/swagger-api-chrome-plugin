import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy"; //引入插件
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        {
          src: "src/manifest.json", // 更新源文件路径
          dest: "dist", // 确保目标路径正确
        },
      ],
      hook: "writeBundle", // 更改执行时机
    }),
  ],
  server: {
    port: 4000,
  },
  base: "./",

  css: {
    preprocessorOptions: {
      // 支持less
      less: {
        javascriptEnabled: true,
      },
    },
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "./index.html"),
        background: path.resolve(__dirname, "./src/background.ts"),
        content: path.resolve(__dirname, "./src/content.ts"),
        manifest: path.resolve(__dirname, "./src/manifest.json"),
        worker: path.resolve(__dirname, "./src/worker.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
