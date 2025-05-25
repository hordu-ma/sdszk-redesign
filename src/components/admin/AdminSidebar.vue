<template>
  <div class="admin-sidebar" :class="{ 'admin-sidebar--collapsed': collapsed, 'mobile-visible': isMobileVisible }">
    <!-- 顶部Logo区域 -->
    <div class="sidebar-header">
      <div class="logo-container">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
        <span v-if="!collapsed" class="logo-text">管理后台</span>
      </div>
    </div>

    <!-- 菜单列表 -->
    <div class="sidebar-menu">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        theme="dark"
        :inline-collapsed="collapsed"
        @click="handleMenuClick"
      >
        <a-menu-item key="/admin/dashboard">
          <template #icon>
            <DashboardOutlined />
          </template>
          <span>仪表板</span>
        </a-menu-item>

        <a-sub-menu key="news">
          <template #icon>
            <FileTextOutlined />
          </template>
          <template #title>新闻管理</template>
          <a-menu-item key="/admin/news/list">新闻列表</a-menu-item>
          <a-menu-item key="/admin/news/create">发布新闻</a-menu-item>
          <a-menu-item key="/admin/news/categories">分类管理</a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="resources">
          <template #icon>
            <FolderOutlined />
          </template>
          <template #title>资源管理</template>
          <a-menu-item key="/admin/resources/list">资源列表</a-menu-item>
          <a-menu-item key="/admin/resources/create">上传资源</a-menu-item>
          <a-menu-item key="/admin/resources/categories">分类管理</a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="users">
          <template #icon>
            <UserOutlined />
          </template>
          <template #title>用户管理</template>
          <a-menu-item key="/admin/users/list">用户列表</a-menu-item>
          <a-menu-item key="/admin/users/roles">角色管理</a-menu-item>
          <a-menu-item key="/admin/users/permissions">权限管理</a-menu-item>
        </a-sub-menu>

        <a-menu-item key="/admin/settings">
          <template #icon>
            <SettingOutlined />
          </template>
          <span>系统设置</span>
        </a-menu-item>
      </a-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'

interface Props {
  collapsed: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'menu-click', path: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const selectedKeys = ref<string[]>([])
const isMobileVisible = ref(false)

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  newPath => {
    selectedKeys.value = [newPath]
    // 在移动端，点击菜单后自动隐藏侧边栏
    if (window.innerWidth <= 768) {
      isMobileVisible.value = false
    }
  },
  { immediate: true }
)

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  emit('menu-click', key)
}

// 监听窗口大小变化
const handleResize = () => {
  isMobileVisible.value = window.innerWidth > 768
}

onMounted(() => {
  handleResize() // 初始化时设置状态
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 提供给父组件的方法，用于切换移动端侧边栏的可见性
defineExpose({
  toggleMobileVisibility: () => {
    isMobileVisible.value = !isMobileVisible.value
  }
})
</script>

<style scoped lang="scss">
.admin-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 250px;
  background-color: #001529;
  z-index: 1000;
  transition: width 0.3s ease;

  &--collapsed {
    width: 80px;
  }
}

.sidebar-header {
  height: 64px;
  padding: 16px;
  border-bottom: 1px solid #ffffff1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  transition: opacity 0.3s ease;
}

.sidebar-menu {
  height: calc(100vh - 64px);
  overflow-y: auto;

  :deep(.ant-menu) {
    border-right: none;
    background-color: transparent;
  }

  :deep(.ant-menu-item) {
    color: rgba(255, 255, 255, 0.65);

    &:hover {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.1);
    }

    &.ant-menu-item-selected {
      color: #fff;
      background-color: #1890ff;
    }
  }

  :deep(.ant-menu-submenu-title) {
    color: rgba(255, 255, 255, 0.65);

    &:hover {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  :deep(.ant-menu-submenu-open > .ant-menu-submenu-title) {
    color: #fff;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);

    &--collapsed {
      transform: translateX(-100%);
    }

    &.mobile-visible {
      transform: translateX(0);
    }
  }
}
</style>
