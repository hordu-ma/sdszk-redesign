<template>
  <div class="app-container">
    <!-- 根据路由判断是否显示前台布局 -->
    <template v-if="!isAdminRoute">
      <Header />
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <FooterLinks />
      <BackToTop />
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
import { useUserStore } from "./stores/user";
import Header from "./components/Header.vue";
import FooterLinks from "./components/FooterLinks.vue";
import BackToTop from "./components/BackToTop.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

// 应用初始化
onMounted(async () => {
  // 初始化用户信息
  await userStore.initUserInfo();
  
  // 处理GitHub Pages的路由重定向
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
}

/* 添加平滑滚动和边缘过渡效果 */
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
  overscroll-behavior-y: contain; /* 防止iOS上的弹性滚动 */
  -webkit-overflow-scrolling: touch; /* 在iOS设备上平滑滚动 */
}

/* 主内容区域样式，为固定头部留出空间 */
.main-content {
  margin-top: 74px; /* 与header初始高度一致 */
  min-height: calc(100vh - 74px);
  will-change: transform; /* 优化渲染性能 */
  transform: translateZ(0); /* 触发硬件加速 */
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

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
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
