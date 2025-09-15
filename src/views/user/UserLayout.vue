<template>
  <div class="user-layout">
    <!-- 未登录状态：显示友好的登录引导 -->
    <div v-if="!isAuthenticated" class="login-guide-container">
      <div class="login-guide-card">
        <div class="guide-icon">
          <i class="fas fa-user-circle" />
        </div>
        <h2 class="guide-title">欢迎来到个人中心</h2>
        <p class="guide-description">
          登录后您可以管理个人资料、查看收藏内容、浏览历史记录等个性化功能
        </p>
        <div class="guide-features">
          <div class="feature-item">
            <i class="fas fa-heart" />
            <span>收藏管理</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-history" />
            <span>浏览历史</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-user" />
            <span>个人资料</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-cog" />
            <span>账户设置</span>
          </div>
        </div>
        <div class="guide-actions">
          <router-link to="/auth" class="login-btn">
            <el-button type="primary" size="large">
              <i class="fas fa-sign-in-alt" />
              立即登录
            </el-button>
          </router-link>
          <router-link to="/" class="back-btn">
            <el-button size="large" plain>
              <i class="fas fa-arrow-left" />
              返回首页
            </el-button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 已登录状态：显示正常的个人中心界面 -->
    <div v-else class="user-layout-container">
      <!-- 左侧导航菜单 -->
      <aside class="user-sidebar">
        <div class="user-info">
          <div class="avatar-container">
            <el-avatar :size="60" :src="userInfo?.avatar" class="user-avatar">
              <i class="el-icon-user-solid" />
            </el-avatar>
          </div>
          <h3 class="user-name">
            {{ userInfo?.name || "用户" }}
          </h3>
          <p class="user-role">
            {{ getRoleText(userInfo?.role) }}
          </p>
        </div>

        <nav class="user-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isCurrentRoute(item.path) }"
          >
            <i :class="item.icon" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="user-content">
        <div class="content-header">
          <h2 class="page-title">
            {{ currentPageTitle }}
          </h2>
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>
                <router-link to="/"> 首页 </router-link>
              </el-breadcrumb-item>
              <el-breadcrumb-item>个人中心</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="content-body">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const userStore = useUserStore();

// 计算属性
const userInfo = computed(() => userStore.userInfo);
const isAuthenticated = computed(() => userStore.isAuthenticated);

// 导航菜单项
const menuItems = [
  {
    path: "/user/profile",
    name: "个人资料",
    icon: "fas fa-user",
  },
  {
    path: "/user/favorites",
    name: "我的收藏",
    icon: "fas fa-heart",
  },
  {
    path: "/user/history",
    name: "浏览历史",
    icon: "fas fa-history",
  },
  {
    path: "/user/settings",
    name: "账户设置",
    icon: "fas fa-cog",
  },
];

// 获取角色文本
const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    admin: "管理员",
    editor: "编辑",
    user: "普通用户",
  };
  return roleMap[role || "user"] || "普通用户";
};

// 判断是否为当前路由
const isCurrentRoute = (path: string) => {
  return route.path === path;
};

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find((item) => item.path === route.path);
  return currentItem?.name || "个人中心";
});
</script>

<style scoped>
.user-layout {
  min-height: calc(100vh - 80px);
  background-color: #f5f7fa;
  padding: 20px 0;
}

/* 登录引导样式 */
.login-guide-container {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-guide-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.guide-icon {
  margin-bottom: 24px;
}

.guide-icon i {
  font-size: 64px;
  color: #409eff;
  opacity: 0.8;
}

.guide-title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.guide-description {
  margin: 0 0 40px;
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
}

.guide-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: #e8f4ff;
  transform: translateY(-2px);
}

.feature-item i {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
}

.feature-item span {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.guide-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.login-btn,
.back-btn {
  text-decoration: none;
}

.guide-actions .el-button {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.guide-actions .el-button i {
  margin-right: 8px;
}

/* 已登录状态的布局 */
.user-layout-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 0 20px;
}

/* 左侧导航 */
.user-sidebar {
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: fit-content;
}

.user-info {
  padding: 30px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.user-avatar {
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-name {
  margin: 0 0 5px;
  font-size: 18px;
  font-weight: 600;
}

.user-role {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.user-nav {
  padding: 10px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #409eff;
}

.nav-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-left-color: #409eff;
}

.nav-item i {
  width: 20px;
  margin-right: 10px;
  font-size: 16px;
}

/* 右侧内容区域 */
.user-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.content-header {
  padding: 20px 30px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}

.page-title {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.breadcrumb {
  margin: 0;
}

.content-body {
  padding: 30px;
  min-height: 500px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-layout-container {
    flex-direction: column;
    padding: 0 15px;
  }

  .user-sidebar {
    width: 100%;
    margin-bottom: 20px;
  }

  .user-info {
    padding: 20px;
  }

  .nav-item {
    padding: 12px 15px;
  }

  .content-body {
    padding: 20px 15px;
  }

  /* 登录引导响应式 */
  .login-guide-card {
    padding: 40px 24px;
  }

  .guide-title {
    font-size: 24px;
  }

  .guide-features {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .guide-actions {
    flex-direction: column;
  }

  .guide-actions .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .user-layout {
    padding: 15px 0;
  }

  .user-layout-container {
    gap: 15px;
    padding: 0 10px;
  }

  .content-header {
    padding: 15px 20px;
  }

  .page-title {
    font-size: 20px;
  }

  .content-body {
    padding: 20px 15px;
  }

  /* 小屏幕登录引导 */
  .login-guide-container {
    padding: 20px 10px;
  }

  .login-guide-card {
    padding: 30px 20px;
  }

  .guide-icon i {
    font-size: 48px;
  }

  .guide-title {
    font-size: 20px;
  }

  .guide-description {
    font-size: 14px;
  }
}
</style>
