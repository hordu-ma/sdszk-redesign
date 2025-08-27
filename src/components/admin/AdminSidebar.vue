<template>
  <div
    class="admin-sidebar"
    :class="{
      'admin-sidebar--collapsed': collapsed,
      'mobile-visible': isMobileVisible,
    }"
  >
    <!-- 顶部Logo区域 -->
    <div class="sidebar-header">
      <div class="logo-container">
        <img
src="@/assets/images/logo.png" alt="Logo" class="logo" />
        <span v-if="!collapsed"
class="logo-text">管理后台</span>
      </div>
    </div>

    <!-- 菜单列表 -->
    <div class="sidebar-menu">
      <a-menu
        v-model:selected-keys="selectedKeys"
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
          <template #title> 新闻管理 </template>
          <a-menu-item key="/admin/news/list"> 新闻列表 </a-menu-item>
          <a-menu-item key="/admin/news/create"> 发布新闻 </a-menu-item>
          <a-menu-item key="/admin/news/categories"> 分类管理 </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="resources">
          <template #icon>
            <FolderOutlined />
          </template>
          <template #title> 资源管理 </template>
          <a-menu-item key="/admin/resources/list"> 资源列表 </a-menu-item>
          <a-menu-item key="/admin/resources/create"> 上传资源 </a-menu-item>
          <a-menu-item key="/admin/resources/categories">
            分类管理
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="users">
          <template #icon>
            <UserOutlined />
          </template>
          <template #title> 用户管理 </template>
          <a-menu-item key="/admin/users/list"> 用户列表 </a-menu-item>
          <a-menu-item key="/admin/users/roles"> 角色管理 </a-menu-item>
          <a-menu-item key="/admin/users/permissions"> 权限管理 </a-menu-item>
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";

interface Props {
  collapsed: boolean;
}

interface Emits {
  (e: "toggle"): void;
  (e: "menu-click", path: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();
const selectedKeys = ref<string[]>([]);
const isMobileVisible = ref(false);

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath];
    // 在移动端，点击菜单后自动隐藏侧边栏
    if (window.innerWidth <= 768) {
      isMobileVisible.value = false;
    }
  },
  { immediate: true },
);

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  // 确保所有路径都正确处理
  if (key.startsWith("/admin/")) {
    selectedKeys.value = [key];
    // 直接使用 router 进行导航
    router.push(key).catch((err) => {
      if (err.name !== "NavigationDuplicated") {
        console.error("Navigation error:", err);
      }
    });
  } else {
    // 如果是子菜单标识而不是完整路径，则不进行导航
    console.log("非导航菜单项:", key);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  isMobileVisible.value = window.innerWidth > 768;
};

// 暴露方法给父组件
defineExpose({
  toggleMobileVisibility: () => {
    isMobileVisible.value = !isMobileVisible.value;
  },
});

onMounted(() => {
  window.addEventListener("resize", handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 250px;
  background-color: #001529;
  transition: all 0.3s;
  z-index: 1000;
  overflow-y: auto;

  &--collapsed {
    width: 80px;
  }
}

.sidebar-header {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  background-color: #002140;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  height: 32px;
  width: auto;
}

.logo-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s;
}

.admin-sidebar--collapsed .logo-text {
  opacity: 0;
}

.sidebar-menu {
  padding: 16px 0;
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    box-shadow: none;

    &.mobile-visible {
      transform: translateX(0);
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
