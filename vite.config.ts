import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // 根据命令和模式设置不同的基础路径
  // 在preview模式下使用根路径，生产环境（GitHub Pages）使用子路径
  let base = "/";
  if (command === "build" && mode !== "preview") {
    base = "/sdszk-redesign/";
  }

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    publicDir: "public", // 确保静态资源目录正确
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      minify: "terser",
      cssCodeSplit: true, // 确保CSS正确分离
      assetsInlineLimit: 4096, // 小于4kb的资源将内联为base64
      terserOptions: {
        compress: {
          drop_console: false, // 保留console以便调试
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              "vue",
              "vue-router",
              "pinia",
              "ant-design-vue",
              "element-plus",
              "axios",
              "quill",
            ],
          },
          entryFileNames: "[name].[hash].js",
          chunkFileNames: "[name].[hash].js",
          assetFileNames: "[name].[hash].[ext]",
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5178,
      host: true,
      open: true,
      cors: true,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
      hmr: {
        overlay: false,
        host: "localhost",
      },
    },
    // 添加preview配置
    preview: {
      port: 4173,
      strictPort: true,
      host: true,
      cors: true,
    },
  };
});
