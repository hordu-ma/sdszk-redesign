<template>
  <header
    class="header"
    :class="{ 'header-scrolled': isScrolled }"
    :data-visible="isHeaderVisible"
  >
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
          <div
            v-for="item in menuItems"
            :key="item.path"
            class="mobile-nav-item"
          >
            <router-link
              :to="item.path"
              @click="item.children ? null : closeMenu"
              class="mobile-nav-link"
            >
              {{ item.name }}
              <i v-if="item.children" class="fas fa-chevron-down"></i>
            </router-link>
            <div v-if="item.children" class="mobile-submenu">
              <router-link
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                @click="closeMenu"
                class="mobile-submenu-link"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>
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
import { ref, onMounted, onUnmounted, watch } from "vue";

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);
// 添加滚动状态变量
const isScrolled = ref(false);
// 添加导航栏可见状态
const isHeaderVisible = ref(true);
// 上一次滚动位置
const lastScrollY = ref(0);
// 定时器用于防抖
let scrollTimer = null;

// 拓展的菜单项
const menuItems = [
  { path: "/", name: "首页" },
  { path: "/about", name: "平台简介" },
  {
    path: "/news",
    name: "资讯中心",
    children: [
      { path: "/news/center", name: "中心动态" },
      { path: "/news/notice", name: "通知公告" },
      { path: "/news/policy", name: "政策文件" },
    ],
  },
  { path: "/activities", name: "活动中心" },
  {
    path: "/resources",
    name: "资源中心",
    children: [
      { path: "/resources/theory", name: "理论研究" },
      { path: "/resources/teaching", name: "教学前沿" },
      { path: "/resources/video", name: "思政短视频" },
    ],
  },
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

// 检测页面滚动
const handleScroll = () => {
  // 当滚动超过50px时，设置isScrolled为true
  isScrolled.value = window.scrollY > 50;

  // 处理自动隐藏逻辑
  if (window.scrollY < 50) {
    // 在顶部时总是显示
    isHeaderVisible.value = true;
  } else {
    // 根据滚动方向决定是否显示
    const currentScrollY = window.scrollY;
    if (currentScrollY < lastScrollY.value) {
      // 向上滚动，显示导航
      isHeaderVisible.value = true;
    } else if (currentScrollY > lastScrollY.value + 10) {
      // 向下滚动超过10px，隐藏导航
      isHeaderVisible.value = false;
    }
    lastScrollY.value = currentScrollY;
  }

  // 防抖功能：停止滚动2秒后显示导航
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isHeaderVisible.value = true;
  }, 2000);
};

// 监听路由变化，在路由切换时显示头部
watch(
  () => route.path,
  () => {
    isHeaderVisible.value = true;
    isMenuOpen.value = false; // 关闭移动菜单
    document.body.style.overflow = "";
  }
);

// 组件挂载时添加滚动监听
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  // 初始检查一次滚动状态
  handleScroll();
});

// 组件卸载时移除滚动监听
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  clearTimeout(scrollTimer);
});
</script>

<style scoped>
.header {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #9a2314;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* 确保导航栏在最上层 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 74px; /* 初始高度 */
  transform: translateY(0);
}

/* 自动隐藏效果 */
.header:not(.header-scrolled) {
  transform: translateY(0) !important;
}

/* 滚动时导航栏隐藏 */
.header.header-scrolled:not([data-visible="true"]) {
  transform: translateY(-100%);
}

/* 通过JS控制可见性 */
.header[data-visible="true"] {
  transform: translateY(0);
}

/* 滚动时导航栏样式变化 */
.header-scrolled {
  background-color: rgba(122, 29, 16, 0.95); /* 半透明背景 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  height: 64px; /* 滚动后变小 */
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
}

/* 隐藏导航栏 */
.header-hidden {
  transform: translateY(-100%);
  transition: transform 0.3s ease;
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
  transition: padding 0.3s ease;
  height: 100%;
  position: relative;
}

/* 滚动时头部内容的样式变化 */
.header-scrolled .header-content {
  padding: 8px 40px;
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
  transition: all 0.3s ease;
}

.center-name {
  font-size: 20px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s ease;
}

/* 滚动时Logo和站点名称变小 */
.header-scrolled .logo {
  width: 42px;
  height: 42px;
  margin-right: 10px;
}

.header-scrolled .center-name {
  font-size: 18px;
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

/* 滚动状态下的导航项 */
.header-scrolled .nav-item {
  font-size: 15px;
  line-height: 24px;
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
  position: relative;
  z-index: 1001; /* 确保登录按钮在点击上下文中有较高的z-index */
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

/* 移动菜单触发按钮 */
.mobile-menu-trigger {
  display: none;
  background-color: #9a2314; /* 与header背景相同的红色 */
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #fff;
  font-size: 16px; /* 减小图标大小 */
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  width: 32px; /* 减小整体尺寸 */
  height: 32px; /* 减小整体尺寸，与登录按钮高度一致 */
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-right: 8px; /* 右侧与logo保持协调的间距 */
}

.mobile-menu-trigger:hover {
  background-color: rgba(154, 35, 20, 0.8); /* 保持红色调但稍微有变化 */
  border-color: #fff;
}

/* 移动端导航优化 */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  height: 100vh;
  background-color: #9a2314;
  z-index: 2000;
  transition: right 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow-y: auto;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.mobile-menu.menu-open {
  right: 0;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  z-index: 1500;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.menu-open .mobile-overlay {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.mobile-menu-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  z-index: 2100;
  padding: 10px;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.mobile-menu-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 80px 30px 30px;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 2001;
}

.mobile-nav a {
  color: #fff;
  font-size: 18px;
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: block;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2002;
  text-decoration: none;
}

.mobile-nav a:hover,
.mobile-nav a.router-link-active {
  padding-left: 10px;
  color: #ffcc80;
}

.mobile-submenu {
  margin-top: 10px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  z-index: 2002;
}

.mobile-submenu a {
  padding: 10px 5px;
  font-size: 16px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2003;
}

.mobile-nav-item {
  position: relative;
  width: 100%;
  margin-bottom: 5px;
}

.mobile-nav-link,
.mobile-submenu-link {
  position: relative;
  z-index: 2003;
  width: 100%;
  text-decoration: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-nav-link i {
  margin-left: 10px;
}

/* 确保透明遮罩与点击区域不冲突 */
.menu-open .mobile-menu {
  z-index: 2001; /* 高于遮罩层 */
  position: relative; /* 确保元素不被遮罩层覆盖 */
}

/* 修复移动端视图 */
@media screen and (max-width: 480px) {
  .header {
    height: 64px;
  }

  .logo {
    width: 32px;
    height: 32px;
    margin-right: 5px;
  }

  .center-name {
    font-size: 13px;
    max-width: calc(100vw - 180px);
  }

  .login-section :deep(.el-button) {
    padding: 5px 10px;
    font-size: 12px;
  }

  .mobile-menu-trigger {
    display: flex;
    position: relative;
    z-index: 1001;
    margin-left: 5px; /* 增加与左侧边界的距离 */
    width: 28px; /* 在更小屏幕上进一步缩小尺寸 */
    height: 28px;
    font-size: 14px;
  }
}

@media screen and (max-width: 768px) {
  .mobile-menu-trigger {
    display: flex;
    position: relative;
    z-index: 1001;
    margin-left: 8px; /* 增加与左侧边界的距离 */
  }

  .header-content {
    padding: 12px 20px;
    justify-content: space-between;
  }

  .center-name {
    font-size: 14px;
    max-width: calc(100vw - 200px);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .logo {
    width: 36px;
    height: 36px;
    margin-right: 6px;
  }

  .logo-container {
    padding-right: 0;
    flex: 1;
    justify-content: center;
  }

  .login-section {
    margin-left: 10px;
  }

  .login-section :deep(.el-button) {
    padding: 6px 12px;
    font-size: 14px;
  }
}
</style>
