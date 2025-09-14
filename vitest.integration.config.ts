/// <reference types="vitest" />
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@server": resolve(__dirname, "server"),
    },
  },
  test: {
    globals: true,
    environment: "node", // 使用Node.js环境
    include: ["__tests__/integration/**/*.{test,spec}.{ts,js}"],
    hookTimeout: 60000, // 60秒
    testTimeout: 60000, // 60秒
  },
  esbuild: {
    // 禁用esbuild转换，让Node.js处理模块
    include: [],
  },
});
