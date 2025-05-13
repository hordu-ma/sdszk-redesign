<template>
  <div class="app-container">
    <!-- 根据路由判断是否显示前台布局 -->
    <template v-if="!isAdminRoute">
      <Header />
      <router-view />
      <FooterLinks />
    </template>
    <!-- 管理后台直接显示路由内容 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Header from "./components/Header.vue";
import FooterLinks from "./components/FooterLinks.vue";

const route = useRoute();
const router = useRouter();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

// 处理GitHub Pages的路由重定向
onMounted(() => {
  const redirect = sessionStorage.getItem("redirect");
  if (redirect) {
    sessionStorage.removeItem("redirect");
    router.push(redirect);
  }
});
</script>

<style>
@import "./styles/components.css";

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
  min-height: 100vh;
  overflow-x: hidden;
  background-color: #f4f5f7;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  background-color: #f4f5f7;
  overflow-x: hidden; /* 防止水平滚动 */
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
