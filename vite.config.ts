// 性能优化配置更新
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// 性能优化配置 - 适用于开发和生产环境
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 开发和生产环境优化
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
    open: false, // 测试环境不自动打开浏览器
    host: true, // 监听所有地址
    port: 5173,
    strictPort: true, // 端口被占用时直接失败
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
        timeout: 10000, // 10秒超时
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
      "dayjs",
      "echarts",
    ],
    // 强制重新构建依赖
    force: false,
  },

  // 环境变量配置
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },

  // 开发模式下的性能优化
  esbuild: {
    // 开发模式下保留调试信息，但优化性能
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
