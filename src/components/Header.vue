<template>
  <header class="header">
    <div class="header-content">
      <!-- 移动端菜单按钮 -->
      <div class="mobile-menu-button" @click="toggleMobileMenu">
        <i class="fas fa-bars"></i>
      </div>
      <!-- 添加关闭按钮 -->
      <div
        class="mobile-menu-close"
        :class="{ show: mobileMenuOpen }"
        @click="closeMobileMenu"
      >
        <i class="fas fa-times"></i>
      </div>
      <div class="logo-container">
        <img src="../assets/images/logo.png" alt="中心logo" class="logo" />
        <h1 class="center-name">山东省大中小学思政课一体化指导中心</h1>
      </div>
      <!-- 导航菜单 -->
      <nav :class="['nav-menu', { 'mobile-menu-open': mobileMenuOpen }]">
        <router-link to="/" class="nav-item" @click="closeMobileMenu"
          >首页</router-link
        >
        <router-link to="/about" class="nav-item" @click="closeMobileMenu"
          >平台简介</router-link
        >
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
const mobileMenuOpen = ref(false);

const handleLogin = () => {
  router.push("/login");
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  if (mobileMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
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

.mobile-menu-button {
  display: none;
  font-size: 24px;
  color: white;
  cursor: pointer;
  padding: 10px;
  z-index: 1000;
  order: -1; /* 确保它在最左边 */
  margin-right: 10px;
}

.mobile-menu-close {
  display: none;
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 1001;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-menu-close.show {
  opacity: 1;
  visibility: visible;
}

@media screen and (max-width: 768px) {
  .header-content {
    padding: 8px 15px;
  }

  .center-name {
    font-size: 14px;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  .logo-container {
    flex: 1;
    justify-content: center;
    padding-right: 40px; /* 为了平衡左侧菜单按钮的宽度 */
  }

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .mobile-menu-button i {
    font-size: 20px;
    transition: all 0.3s ease;
  }

  .mobile-menu-button:active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .mobile-menu-close {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 75%; /* 减小菜单宽度 */
    height: 100vh;
    background-color: #8a1f11; /* 稍深的背景色 */
    padding: 70px 15px 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    flex-direction: column;
    gap: 10px;
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999;
    overflow-y: auto;
  }

  .nav-menu.mobile-menu-open {
    transform: translateX(0);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  }

  /* 菜单打开时的遮罩 */
  .nav-menu.mobile-menu-open::after {
    content: "";
    position: fixed;
    top: 0;
    left: 75%; /* 与菜单宽度对应 */
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }

  .nav-item {
    font-size: 16px;
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 5px;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    transform: none;
    font-size: inherit;
    box-shadow: none;
  }

  .nav-item:active {
    background-color: rgba(255, 255, 255, 0.15);
    transform: scale(0.98);
  }

  .nav-dropdown {
    width: 100%;
    margin-bottom: 5px;
  }

  .nav-dropdown :deep(.el-dropdown) {
    width: 100%;
  }

  .nav-dropdown :deep(.el-dropdown-menu) {
    width: calc(100% - 30px);
    margin: 5px 15px;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .nav-dropdown :deep(.el-dropdown-menu__item) {
    color: white;
  }

  .dropdown-link {
    color: rgba(255, 255, 255, 0.9);
    padding: 12px 15px;
    font-size: 15px;
    border-radius: 6px;
    transition: all 0.25s ease;
  }

  .dropdown-link:active {
    background-color: rgba(255, 255, 255, 0.12);
  }

  .login-section {
    display: none;
  }

  /* 添加背景遮罩 */
  .nav-menu::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: -1;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .nav-menu.mobile-menu-open::before {
    opacity: 1;
    visibility: visible;
  }

  /* 调整下拉菜单在移动端的样式 */
  .dropdown-link {
    color: white;
    padding: 12px 15px;
    font-size: 15px;
    border-radius: 6px;
    transition: all 0.25s ease;
  }

  .dropdown-link:active {
    background-color: rgba(255, 255, 255, 0.12);
  }

  /* 添加菜单顶部关闭按钮区域 */
  .nav-menu::after {
    content: "菜单";
    position: fixed;
    top: 0;
    left: 0;
    width: 75%;
    height: 60px;
    background-color: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
