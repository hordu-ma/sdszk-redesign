import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_PUBLIC_PATH || "/sdszk-redesign/";

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
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
  };
});
