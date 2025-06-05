import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// GitHub Pages 专用配置
export default defineConfig({
  base: '/sdszk-redesign/', // 您的 GitHub 仓库名
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
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    outDir: 'dist',
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['element-plus', 'ant-design-vue'],
          'utils-vendor': ['axios'],
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name]-[hash].${extType}`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
            return `images/[name]-[hash].${extType}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${extType}`
          }
          return `assets/[name]-[hash].${extType}`
        },
      },
    },

    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
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
    include: ['vue', 'vue-router', 'pinia', 'axios', 'element-plus', 'ant-design-vue'],
  },
})
