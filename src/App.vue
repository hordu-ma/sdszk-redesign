<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
// App root component
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 响应式布局基础设置 */
@media (max-width: 768px) {
  .app-container {
    padding: 0 10px;
  }
}

/* 链接样式 */
a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

a:hover {
  color: #409EFF;
}

/* 列表样式重置 */
ul, ol {
  list-style: none;
}

/* 图片基础样式 */
img {
  max-width: 100%;
  height: auto;
}
</style>
