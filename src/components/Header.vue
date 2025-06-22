<template>
  <header
    class="header"
    :class="{ 'header-scrolled': isScrolled }"
    :data-visible="isHeaderVisible"
  >
    <div class="header-content">
      <button class="mobile-menu-trigger" @click="toggleMenu">
        <span class="sr-only">打开菜单</span>
        <i class="fas fa-bars"></i>
      </button>

      <div class="logo-container">
        <img src="../assets/images/logo.png" alt="中心logo" class="logo" />
        <h1 class="center-name">
          <span class="full-name">山东省大中小学思政课一体化中心</span>
          <span class="short-name">山东省大中小学思政课一体化中心</span>
        </h1>
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
                <router-link to="/news?category=center" class="dropdown-link"
                  >中心动态</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/news?category=notice" class="dropdown-link"
                  >通知公告</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/news?category=policy" class="dropdown-link"
                  >政策文件</router-link
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <a href="http://show.sdszk.cn/#/" target="_blank" class="nav-item"
          >活动中心</a
        >
        <el-dropdown trigger="hover" class="nav-dropdown">
          <router-link to="/resources" class="nav-item">资源中心</router-link>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <router-link
                  to="/resources?category=theory"
                  class="dropdown-link"
                  >理论前沿</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link
                  to="/resources?category=teaching"
                  class="dropdown-link"
                  >教学研究</router-link
                >
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link
                  to="/resources?category=video"
                  class="dropdown-link"
                  >影像思政</router-link
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link to="/ai" class="nav-item">AI思政</router-link>
      </nav>

      <!-- 搜索和登录区域 -->
      <div class="search-login-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索"
          class="search-input search-box"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon class="search-icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>

        <div class="auth-buttons" v-if="!isAuthenticated">
          <router-link to="/auth" class="auth-button">
            <el-button class="custom-auth-button login-button" plain
              >登录/注册</el-button
            >
          </router-link>
        </div>
        <div class="user-menu" v-else>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown-link">
              <el-avatar :size="32" :src="userInfo?.avatar" />
              {{ userInfo?.name }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 移动端遮罩层 -->
      <transition name="fade">
        <div v-if="isMenuOpen" class="mobile-overlay" @click="closeMenu"></div>
      </transition>

      <!-- 移动端菜单容器 -->
      <div class="mobile-menu" :class="{ 'menu-open': isMenuOpen }">
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
            <component
              :is="item.external ? 'a' : 'router-link'"
              :to="!item.external ? item.path : undefined"
              :href="item.external ? item.path : undefined"
              :target="item.external ? '_blank' : undefined"
              @click="item.children ? null : closeMenu"
              class="mobile-nav-link"
            >
              {{ item.name }}
              <i v-if="item.children" class="fas fa-chevron-down"></i>
            </component>
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
          <!-- 移动端登录注册按钮 -->
          <div class="mobile-auth" v-if="!isAuthenticated">
            <router-link to="/auth" class="mobile-auth-link" @click="closeMenu">
              登录/注册
            </router-link>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Search, ArrowDown } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 状态管理
const isMenuOpen = ref(false);
const isScrolled = ref(false);
const isHeaderVisible = ref(true);
const lastScrollY = ref(0);
const searchKeyword = ref("");
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

// 用户状态
const isAuthenticated = computed(() => userStore.isAuthenticated);
const userInfo = computed(() => userStore.userInfo);

// 菜单项配置
interface MenuItem {
  path: string;
  name: string;
  children?: MenuItem[];
  external?: boolean;
}

const menuItems: MenuItem[] = [
  { path: "/", name: "首页" },
  { path: "/about", name: "平台简介" },
  {
    path: "/news",
    name: "资讯中心",
    children: [
      { path: "/news?category=center", name: "中心动态" },
      { path: "/news?category=notice", name: "通知公告" },
      { path: "/news?category=policy", name: "政策文件" },
    ],
  },
  { path: "http://show.sdszk.cn/#/", name: "活动中心", external: true },
  {
    path: "/resources",
    name: "资源中心",
    children: [
      { path: "/resources?category=theory", name: "理论前沿" },
      { path: "/resources?category=teaching", name: "教学研究" },
      { path: "/resources?category=video", name: "影像思政" },
    ],
  },
  { path: "/ai", name: "AI思政" },
];

// 处理登录相关
const handleCommand = (command: string) => {
  switch (command) {
    case "profile":
      router.push("/user/profile");
      break;
    case "logout":
      userStore.logout();
      router.push("/");
      break;
  }
};

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: "/search",
      query: { q: searchKeyword.value.trim() },
    });
  }
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? "hidden" : "";
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = "";
};

// 处理滚动效果
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;

  if (window.scrollY < 50) {
    isHeaderVisible.value = true;
  } else {
    const currentScrollY = window.scrollY;
    if (currentScrollY < lastScrollY.value) {
      isHeaderVisible.value = true;
    } else if (currentScrollY > lastScrollY.value + 10) {
      isHeaderVisible.value = false;
    }
    lastScrollY.value = currentScrollY;
  }

  if (scrollTimer !== null) {
    clearTimeout(scrollTimer);
  }
  scrollTimer = setTimeout(() => {
    isHeaderVisible.value = true;
  }, 2000);
};

// 监听路由变化
watch(
  () => route.path,
  () => {
    isHeaderVisible.value = true;
    isMenuOpen.value = false;
    document.body.style.overflow = "";
  }
);

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer);
  }
});
</script>

<style lang="scss" scoped>
.header {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #9a2314;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 74px;
  transform: translateY(0);
}

.header-scrolled {
  background-color: rgba(122, 29, 16, 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  height: 64px;
  backdrop-filter: blur(10px);
}

.header[data-visible="true"] {
  transform: translateY(0);
}

.header[data-visible="false"] {
  transform: translateY(-100%);
}

.header-content {
  max-width: 1440px; /* 增加最大宽度 */
  width: 100%;
  margin: 0 auto;
  padding: 12px 24px; /* 减小两侧内边距 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  transition: padding 0.3s ease;
  height: 100%;
  position: relative;
  gap: 20px; /* 添加间距 */

  @include sm {
    padding: 8px 12px;
    gap: 8px; /* 减小整体间距 */
  }

  @include xs {
    padding: 6px 8px;
    gap: 4px;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  padding-right: 0; /* 移除右侧内边距 */
  min-width: 300px; /* 增加最小宽度 */
  max-width: 360px; /* 增加最大宽度 */

  @include sm {
    flex: 1;
    min-width: 0;
    margin: 0 8px;
    max-width: none;
    gap: 6px; /* 减小logo和文字的间距 */
  }
}

.logo {
  width: 50px;
  height: 50px;
  margin-right: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0; /* 防止logo被压缩 */

  @include sm {
    width: 36px;
    height: 36px;
    margin-right: 6px;
  }
}

.center-name {
  font-size: 18px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  line-height: 1.4;
}

.full-name {
  display: block;
}

.short-name {
  display: none;
}

@include sm {
  .full-name {
    display: none;
  }

  .short-name {
    display: block;
    font-size: 14px;
    max-width: calc(100vw - 110px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  .center-name {
    font-size: 14px;
    max-width: calc(100vw - 140px); /* 进一步扩大显示区域 */
    line-height: 1.2;
    padding-right: 4px; /* 添加一点右侧内边距 */
  }
}

@include xs {
  .center-name {
    font-size: 13px;
    max-width: calc(100vw - 120px); /* 最大程度扩大显示区域 */
    letter-spacing: -0.3px;
  }
}

.desktop-nav {
  display: flex;
  gap: 24px; /* 稍微减小导航项间距 */
  margin: 0; /* 移除左右边距 */
  align-items: center;
  height: 40px;
  flex: 1; /* 让导航区域占据剩余空间 */
  justify-content: center; /* 居中导航项 */
}

.nav-item {
  text-decoration: none;
  color: #fff;
  font-size: 15px; /* 稍微减小字体 */
  padding: 6px 0;
  position: relative;
  transition: all 0.3s ease;
  display: inline-block;
  line-height: 24px;
  white-space: nowrap; /* 防止文字换行 */
}

.search-login-container {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 280px; /* 固定最小宽度 */
  justify-content: flex-end; /* 右对齐 */

  @include sm {
    gap: 8px;
    min-width: auto;
    margin-left: auto;

    .auth-buttons {
      margin-right: 8px;

      .auth-button .el-button {
        font-size: 13px;
        height: 32px;
        padding: 0 12px;
      }
    }

    .user-menu {
      display: none;
    }

    .search-box {
      display: none;
    }

    .login-button {
      padding: 6px 12px;
      font-size: 14px;
    }
  }
}

.search-input {
  width: 180px; /* 减小搜索框宽度 */
  transition: width 0.3s ease;

  &:focus-within {
    width: 220px; /* 聚焦时增加宽度 */
  }
}

.custom-auth-button {
  color: #9a2314 !important;
  border-color: #9a2314 !important;
  background-color: rgba(255, 255, 255, 0.9) !important;

  &:hover {
    color: #fff !important;
    background-color: #9a2314 !important;
  }
}

/* 响应式布局优化 */
@include min($breakpoint-lg) {
  .header-content {
    padding: 12px 16px;
  }

  .logo-container {
    min-width: 240px;
  }

  .desktop-nav {
    gap: 20px;
  }

  .nav-item {
    font-size: 14px;
  }

  .search-login-container {
    min-width: 240px;
  }

  .search-input {
    width: 160px;

    &:focus-within {
      width: 200px;
    }
  }
}

@include min($breakpoint-md) {
  .logo-container {
    min-width: 220px;
  }

  .center-name {
    font-size: 16px;
  }

  .desktop-nav {
    gap: 16px;
  }

  .search-login-container {
    min-width: 220px;
  }

  .search-input {
    width: 140px;

    &:focus-within {
      width: 180px;
    }
  }
}

@include sm {
  .header-content {
    padding: 8px 12px;
    justify-content: space-between;
  }

  .desktop-nav {
    display: none;
  }

  .search-input {
    display: none !important;
  }

  .logo-container {
    flex: 1;
    min-width: 0;
    margin: 0 12px;
    max-width: none; /* 移动端下取消最大宽度限制 */
  }

  .center-name {
    font-size: 14px;
    max-width: calc(100vw - 140px); /* 调整计算方式，扩大文字显示区域 */
    line-height: 1.2; /* 稍微压缩行高 */
    letter-spacing: -0.2px;
  }

  .search-login-container {
    min-width: auto;
    gap: 8px;
  }

  .search-input {
    width: 120px;

    &:focus-within {
      width: 160px;
    }
  }

  .logo {
    width: 40px;
    height: 40px;
    margin-right: 8px;
  }

  .auth-buttons {
    margin-right: 8px;
  }

  .auth-buttons .auth-button .el-button {
    padding: 0 12px;
    height: 32px;
    font-size: 13px;
  }

  .user-menu {
    display: none; /* 移动端隐藏用户菜单，在mobile-nav中显示 */
  }
}

@include xs {
  .header-content {
    padding: 8px;
  }

  .center-name {
    font-size: 13px;
    max-width: calc(100vw - 160px); /* 进一步扩大文字显示区域 */
    letter-spacing: -0.2px; /* 稍微调整字间距 */
  }

  .logo {
    width: 36px;
    height: 36px;
    margin-right: 6px;
  }

  .search-input {
    width: 100px;

    &:focus-within {
      width: 140px;
    }
  }

  .auth-button :deep(.el-button) {
    padding: 4px 8px;
    font-size: 13px;
  }
}

/* 移动端样式 */
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
}

.mobile-menu.menu-open {
  right: 0;
}

/* 遮罩层淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1500;
  cursor: pointer;
}

.mobile-nav {
  padding: 80px 30px 30px;
}

.mobile-nav-link,
.mobile-submenu-link {
  color: #fff;
  text-decoration: none;
  padding: 12px 0;
  display: block;
  font-size: 16px;
  transition: all 0.3s ease;
}

.mobile-auth {
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.mobile-auth-link {
  color: #fff;
  text-decoration: none;
  display: block;
  padding: 12px 0;
  font-size: 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.mobile-menu-trigger {
  display: none;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  margin-right: 4px;

  .fas {
    font-size: 20px;
  }

  @include sm {
    display: block;
    margin-right: 8px;
  }
}

.mobile-menu-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  z-index: 2001;
}
</style>
