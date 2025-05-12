<template>
  <header class="header">
    <div class="header-content">
      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-trigger" @click="toggleMenu">
        <span class="sr-only">打开菜单</span>
        <i class="fas fa-bars"></i>
      </button>
      <div class="logo-container">
        <img src="../assets/images/logo.png" alt="中心logo" class="logo" />
        <h1 class="center-name">山东省大中小学思政课一体化指导中心</h1>
      </div>
      <!-- 桌面端导航菜单 -->
      <nav class="desktop-nav">
        <router-link to="/" class="nav-item">首页</router-link>
        <router-link to="/about" class="nav-item">平台简介</router-link>
        <el-dropdown trigger="hover" class="nav-dropdown">
          <router-link to="/news" class="nav-item">资讯中心</router-link>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <router-link to="/news/center" class="dropdown-link"
                  >中心动态</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/news/notice" class="dropdown-link"
                  >通知公告</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/news/policy" class="dropdown-link"
                  >政策文件</router-link
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link to="/activities" class="nav-item">活动中心</router-link>
        <el-dropdown trigger="hover" class="nav-dropdown">
          <router-link to="/resources" class="nav-item">资源中心</router-link>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <router-link to="/resources/theory" class="dropdown-link"
                  >理论研究</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/resources/teaching" class="dropdown-link"
                  >教学前沿</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/resources/video" class="dropdown-link"
                  >思政短视频</router-link
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link to="/ai" class="nav-item">AI思政</router-link>
      </nav>

      <!-- 移动端菜单容器 -->
      <div class="mobile-menu" :class="{ 'menu-open': isMenuOpen }">
        <!-- 移动端遮罩层 -->
        <div class="mobile-overlay" @click="closeMenu"></div>
        <!-- 移动端关闭按钮 -->
        <button class="mobile-menu-close" @click="closeMenu">
          <span class="sr-only">关闭菜单</span>
          <i class="fas fa-times"></i>
        </button>
        <!-- 移动端导航菜单 -->
        <nav class="mobile-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            @click="closeMenu"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
      <div class="login-section">
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref } from "vue";

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);

const menuItems = [
  { path: "/", name: "首页" },
  { path: "/about", name: "平台简介" },
  { path: "/news", name: "资讯中心" },
  { path: "/activities", name: "活动中心" },
  { path: "/resources", name: "资源中心" },
  { path: "/ai", name: "AI思政" },
];

const handleLogin = () => {
  router.push("/login");
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = "";
};
</script>

<style scoped>
.header {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #9a2314;
}

.header-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  align-items: center;
  padding-right: 20px;
}

.logo {
  width: 50px;
  height: 50px;
  margin-right: 12px;
}

.center-name {
  font-size: 20px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  gap: 30px;
  margin-right: auto;
  margin-left: 60px;
  align-items: center;
  height: 40px;
}

/* Desktop styles for nav items */
.desktop-nav {
  display: flex;
  gap: 30px;
  margin-right: auto;
  margin-left: 60px;
  align-items: center;
  height: 40px;
}

@media screen and (max-width: 768px) {
  .desktop-nav {
    display: none;
  }
}

.nav-item {
  text-decoration: none;
  color: #fff;
  font-size: 16px;
  padding: 6px 0;
  position: relative;
  transition: all 0.3s ease;
  display: inline-block;
  line-height: 28px;
  transform: translateY(0);
  box-shadow: 0 0 0 rgba(255, 255, 255, 0);
}

/* 为非下拉菜单的导航项添加悬停效果 */
.nav-menu > .nav-item:hover,
.nav-menu > .nav-item.router-link-active {
  transform: translateY(-5px);
  font-size: 18px;
  box-shadow: 0 6px 12px rgba(255, 255, 255, 0.3);
  transform-origin: center;
  scale: 1.05;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: rgba(255, 255, 255, 0.95);
}

.nav-item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #fff;
  transition: width 0.3s ease;
}

.nav-item:hover::after,
.nav-item.router-link-active::after {
  width: 100%;
}

.nav-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

.nav-dropdown :deep(.el-dropdown),
.nav-dropdown :deep(.el-dropdown:focus),
.nav-dropdown :deep(.el-dropdown:focus-visible),
.nav-dropdown :deep(.el-dropdown:hover),
.nav-dropdown :deep(.el-dropdown:active) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.nav-dropdown :deep(.el-popper) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.nav-dropdown :deep(.el-dropdown-menu) {
  background-color: #faf0f0;
  border: none;
  padding: 5px 0;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(154, 35, 20, 0.15);
  min-width: 160px;
  margin-top: 5px;
}

.nav-dropdown :deep(.el-dropdown-menu__item) {
  padding: 0;
  line-height: normal;
  position: relative;
}

.nav-dropdown :deep(.el-dropdown-menu__item:not(:last-child)) {
  border-bottom: 1px solid rgba(154, 35, 20, 0.1);
}

.nav-dropdown :deep(.el-dropdown-menu__item:hover) {
  background: linear-gradient(
    to right,
    rgba(154, 35, 20, 0.1),
    rgba(154, 35, 20, 0.05)
  );
}

.dropdown-link {
  display: block;
  padding: 12px 24px;
  color: #4a2219;
  text-decoration: none;
  font-size: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.dropdown-link:hover {
  color: #9a2314;
  padding-left: 28px;
  background-color: rgba(154, 35, 20, 0.03);
}

.dropdown-link:hover::before {
  content: "";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #9a2314;
}

.login-section {
  margin-left: 20px;
}

.login-section :deep(.el-button) {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #fff;
  padding: 8px 24px;
  transition: all 0.3s ease;
}

.login-section :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
  color: #fff;
}

/* 移动端菜单相关样式 */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 999;
  pointer-events: none;
}

.mobile-menu.menu-open {
  pointer-events: auto;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  z-index: 1000;
}

.menu-open .mobile-overlay {
  opacity: 1;
  visibility: visible;
}

.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background-color: #8a1f11;
  padding: 60px 20px 20px;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  z-index: 1001;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
}

.menu-open .mobile-nav {
  transform: translateX(0);
}

.mobile-menu-trigger {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
  z-index: 998;
}

.mobile-menu-trigger:hover,
.mobile-menu-trigger:active {
  background-color: rgba(255, 255, 255, 0.2);
}

.mobile-menu-close {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1002;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
}

.menu-open .mobile-menu-close {
  opacity: 1;
  visibility: visible;
}

.mobile-menu-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

@media screen and (max-width: 768px) {
  .header-content {
    padding: 8px 16px;
    position: relative;
  }

  .center-name {
    font-size: 14px;
    text-align: center;
  }

  .logo {
    width: 40px;
    height: 40px;
    margin-right: 8px;
  }

  .logo-container {
    flex: 1;
    justify-content: center;
    padding-right: 40px;
  }

  .mobile-menu-trigger {
    display: flex;
    order: -1;
    margin-right: 10px;
  }

  .mobile-menu-trigger i {
    font-size: 20px;
  }

  .mobile-nav .nav-item {
    font-size: 16px;
    padding: 14px 16px;
    margin: 2px 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    width: 100%;
    text-align: left;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-nav .nav-item:hover,
  .mobile-nav .nav-item.router-link-active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
  }

  .mobile-nav .nav-item::after {
    display: none;
  }

  .login-section {
    display: none;
  }
}
</style>
