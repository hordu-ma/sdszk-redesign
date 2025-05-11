<template>
  <div class="app-container">
    <Header />
    <router-view />
  </div>
</template>

<script setup>
import Header from "./components/Header.vue";
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-width: 100%;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* 响应式布局基础设置 */
@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
}

/* 链接样式 */
a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

a:hover {
  color: #409eff;
}

/* 列表样式重置 */
ul,
ol {
  list-style: none;
}

/* 图片基础样式 */
img {
  max-width: 100%;
  height: auto;
}

/* header样式 */
header {
  background-color: #9a2314;
  color: #fff;
  margin: 0;
  padding: 0;
  width: 100%;
  position: relative;
  z-index: 1;
}
</style>
