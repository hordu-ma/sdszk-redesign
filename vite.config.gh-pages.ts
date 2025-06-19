import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// GitHub Pages 专用配置
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  console.log("GitHub Pages 构建模式:", mode);
  console.log("API 基础 URL:", env.VITE_API_BASE_URL);

  return {
    base: "/sdszk-redesign/", // GitHub 仓库名
    plugins: [
      vue({
        template: {
          compilerOptions: {
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
      outDir: "dist",
      // 代码分割优化
      rollupOptions: {
        output: {
          manualChunks: {
            "vue-vendor": ["vue", "vue-router", "pinia"],
            "ui-vendor": ["element-plus", "ant-design-vue"],
            "utils-vendor": ["axios"],
          },
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const fileName = assetInfo.name || "";
            const info = fileName.split(".");
            const extType = info[info.length - 1];

            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(fileName)) {
              return `media/[name]-[hash].${extType}`;
            }
            if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(fileName)) {
              return `images/[name]-[hash].${extType}`;
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(fileName)) {
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
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info"],
        },
      },

      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      sourcemap: false,
    },

    css: {
      devSourcemap: false,
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/styles/variables.scss" as *;
            @use "@/styles/mixins.scss" as *;
          `,
        },
      },
    },

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
  };
});
