<template>
  <div class="admin-header">
    <div class="header-left">
      <a-button type="text" class="sidebar-toggle" @click="emit('toggle-sidebar')">
        <template #icon>
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </template>
      </a-button>

      <a-breadcrumb class="breadcrumb">
        <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path">
          <router-link v-if="item.path" :to="item.path">
            {{ item.title }}
          </router-link>
          <span v-else>{{ item.title }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 通知 -->
      <a-badge :count="notificationCount" class="header-item">
        <a-button type="text" shape="circle">
          <template #icon>
            <BellOutlined />
          </template>
        </a-button>
      </a-badge>

      <!-- 用户菜单 -->
      <a-dropdown placement="bottomRight">
        <div class="user-info">
          <a-avatar :src="userInfo.avatar" :size="32">
            {{ userInfo.username?.charAt(0)?.toUpperCase() }}
          </a-avatar>
          <span class="username">{{ userInfo.username }}</span>
          <DownOutlined class="dropdown-icon" />
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item key="profile">
              <UserOutlined />
              个人资料
            </a-menu-item>
            <a-menu-item key="settings">
              <SettingOutlined />
              个人设置
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="emit('logout')">
              <LogoutOutlined />
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'

interface Props {
  collapsed?: boolean
}

interface Emits {
  (e: 'toggle-sidebar'): void
  (e: 'logout'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const userStore = useUserStore()

// 用户信息
const userInfo = computed(
  () =>
    userStore.userInfo || {
      username: '未登录',
      avatar: '',
      name: '未登录用户',
    }
)

// 通知数量
const notificationCount = computed(() => 0) // 暂时设为0，后续可以从API获取

// 面包屑导航
const breadcrumbItems = computed(() => {
  const pathArray = route.path.split('/').filter(Boolean)
  const items = []

  // 添加首页
  items.push({ title: '首页', path: '/admin/dashboard' })

  // 根据路径生成面包屑
  if (pathArray.length > 1) {
    const moduleName = pathArray[1]

    switch (moduleName) {
      case 'dashboard':
        items.push({ title: '仪表板', path: null })
        break
      case 'news':
        items.push({ title: '新闻管理', path: null })
        if (pathArray[2]) {
          const subModule = pathArray[2]
          switch (subModule) {
            case 'list':
              items.push({ title: '新闻列表', path: null })
              break
            case 'create':
              items.push({ title: '发布新闻', path: null })
              break
            case 'edit':
              items.push({ title: '编辑新闻', path: null })
              break
            case 'categories':
              items.push({ title: '分类管理', path: null })
              break
          }
        }
        break
      case 'resources':
        items.push({ title: '资源管理', path: null })
        if (pathArray[2]) {
          const subModule = pathArray[2]
          switch (subModule) {
            case 'list':
              items.push({ title: '资源列表', path: null })
              break
            case 'create':
              items.push({ title: '上传资源', path: null })
              break
            case 'edit':
              items.push({ title: '编辑资源', path: null })
              break
            case 'categories':
              items.push({ title: '分类管理', path: null })
              break
          }
        }
        break
      case 'users':
        items.push({ title: '用户管理', path: null })
        if (pathArray[2]) {
          const subModule = pathArray[2]
          switch (subModule) {
            case 'list':
              items.push({ title: '用户列表', path: null })
              break
            case 'roles':
              items.push({ title: '角色管理', path: null })
              break
            case 'permissions':
              items.push({ title: '权限管理', path: null })
              break
          }
        }
        break
      case 'settings':
        items.push({ title: '系统设置', path: null })
        break
    }
  }

  return items
})
</script>

<style scoped lang="scss">
.admin-header {
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
  color: #666;

  &:hover {
    background-color: #f5f5f5;
  }
}

.breadcrumb {
  :deep(.ant-breadcrumb-link) {
    color: #666;

    &:hover {
      color: #1890ff;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-item {
  :deep(.ant-btn) {
    color: #666;

    &:hover {
      background-color: #f5f5f5;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
}

.username {
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  color: #666;
  font-size: 12px;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0 16px;
  }

  .breadcrumb {
    display: none;
  }

  .username {
    display: none;
  }
}
</style>
