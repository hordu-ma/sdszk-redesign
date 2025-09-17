<template>
  <div class="app-container">
    <!-- 根据路由判断是否显示前台布局 -->
    <template v-if="!isAdminRoute">
      <header-component />
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <footer-links />
      <back-to-top />
    </template>
    <!-- 管理后台直接显示路由内容 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "./stores/user";
import HeaderComponent from "./components/Header.vue";
import FooterLinks from "./components/FooterLinks.vue";
import BackToTop from "./components/BackToTop.vue";

const route = useRoute();
const userStore = useUserStore();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

// 应用初始化
onMounted(async () => {
  // 初始化用户信息
  await userStore.initUserInfo();
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
  height: auto;
}

/* 添加平滑滚动和边缘过渡效果 */
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}

/* 主内容区域样式，为固定头部留出空间 */
.main-content {
  margin-top: 74px; /* 与header初始高度一致 */
  background-color: #f4f5f7;
  position: relative;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  line-height: 1.6;
  overflow-x: hidden;
}

.app-container {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #f4f5f7;
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

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
}
</style>
