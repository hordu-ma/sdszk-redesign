// 性能优化配置更新
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// 生产环境性能优化配置
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 生产环境优化
          hoistStatic: true,
          cacheHandlers: true,
        },
      },
    }),
  ],

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Vue相关依赖打包到单独chunk
          "vue-vendor": ["vue", "vue-router", "pinia"],
          // UI组件库单独打包
          "ui-vendor": ["element-plus", "ant-design-vue"],
          // 工具库单独打包
          "utils-vendor": ["axios", "echarts"],
        },
        // 优化chunk文件名
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const extType = info[info.length - 1];
          if (
            /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)
          ) {
            return `media/[name]-[hash].${extType}`;
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
            return `images/[name]-[hash].${extType}`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${extType}`;
          }
          return `assets/[name]-[hash].${extType}`;
        },
      },
    },

    // 压缩优化
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
      },
    },

    // Chunk大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 启用CSS代码分割
    cssCodeSplit: true,

    // 生成sourcemap用于生产环境调试
    sourcemap: false,
  },

  // 开发服务器优化
  server: {
    open: true,
    // 热更新优化
    hmr: {
      overlay: false,
    },
    // API代理配置
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // CSS预处理器优化
  css: {
    devSourcemap: false,
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

  // 预构建优化
  optimizeDeps: {
    include: [
      "vue",
      "vue-router",
      "pinia",
      "axios",
      "element-plus",
      "ant-design-vue",
    ],
  },
});
