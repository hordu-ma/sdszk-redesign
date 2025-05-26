<template>
  <div class="user-layout">
    <div class="user-layout-container">
      <!-- 左侧导航菜单 -->
      <aside class="user-sidebar">
        <div class="user-info">
          <el-avatar :size="60" :src="userInfo?.avatar">
            <i class="el-icon-user-solid"></i>
          </el-avatar>
          <h3 class="user-name">{{ userInfo?.name || '用户' }}</h3>
          <p class="user-role">{{ getRoleText(userInfo?.role) }}</p>
        </div>

        <nav class="user-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isCurrentRoute(item.path) }"
          >
            <i :class="item.icon"></i>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="user-content">
        <div class="content-header">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>
                <router-link to="/">首页</router-link>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

// 计算属性
const userInfo = computed(() => userStore.userInfo)

// 导航菜单项
const menuItems = [
  {
    path: '/user/profile',
    name: '个人资料',
    icon: 'fas fa-user',
  },
  {
    path: '/user/favorites',
    name: '我的收藏',
    icon: 'fas fa-heart',
  },
  {
    path: '/user/history',
    name: '浏览历史',
    icon: 'fas fa-history',
  },
  {
    path: '/user/settings',
    name: '账户设置',
    icon: 'fas fa-cog',
  },
]

// 获取角色文本
const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    editor: '编辑',
    user: '普通用户',
  }
  return roleMap[role || 'user'] || '普通用户'
}

// 判断是否为当前路由
const isCurrentRoute = (path: string) => {
  return route.path === path
}

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem?.name || '个人中心'
})
</script>

<style scoped>
.user-layout {
  min-height: calc(100vh - 80px);
  background-color: #f5f7fa;
  padding: 20px 0;
}

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

.user-name {
  margin: 15px 0 5px;
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
}
</style>
