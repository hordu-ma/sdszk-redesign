import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { createHtmlPlugin } from "vite-plugin-html";
import viteCompression from "vite-plugin-compression";
// import viteImagemin from "vite-plugin-imagemin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: "/", // 部署在域名根路径
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: env.VITE_APP_TITLE || "山东省思想政治理论课一体化平台",
          },
        },
      }),
      // Gzip 压缩
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10KB 以上的文件才压缩
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false, // 保留原文件
      }),
      // Brotli 压缩（更高效）
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10KB 以上的文件才压缩
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
      // 图片压缩 - 暂时禁用以解决构建问题
      // viteImagemin({
      //   // GIF 优化
      //   gifsicle: {
      //     optimizationLevel: 3, // 降低优化级别以加快构建
      //     interlaced: false,
      //   },
      //   // PNG 优化 - 禁用 optipng，使用 pngquant 代替
      //   optipng: false,
      //   // JPEG 优化
      //   mozjpeg: {
      //     quality: 85, // 提高质量以保持视觉效果
      //     progressive: true, // 启用渐进式加载
      //   },
      //   // PNG 量化压缩
      //   pngquant: {
      //     quality: [0.7, 0.85], // 提高质量范围
      //     speed: 4,
      //   },
      //   // SVG 优化
      //   svgo: {
      //     plugins: [
      //       {
      //         name: 'removeViewBox',
      //         active: false, // 保留 viewBox 以确保 SVG 正确缩放
      //       },
      //       {
      //         name: 'removeEmptyAttrs',
      //         active: false, // 保留可能需要的空属性
      //       },
      //       {
      //         name: 'removeDoctype',
      //       },
      //       {
      //         name: 'removeComments',
      //       },
      //     ],
      //   },
      //   // 输出详细信息
      //   verbose: true,
      // }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 全局导入变量和mixins
          additionalData: `
            @use "@/styles/variables.scss" as *;
            @use "@/styles/mixins.scss" as *;
          `,
        },
      },
    },
    build: {
      target: "es2015",
      outDir: "dist",
      assetsDir: "assets",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            "element-plus": ["element-plus"],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
