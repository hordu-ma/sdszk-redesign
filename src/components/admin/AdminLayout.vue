<template>
  <div class="admin-layout">
    <AdminSidebar
      ref="sidebarRef"
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
      @menu-click="handleMenuClick"
    />
    <div
      class="admin-main"
      :class="{ 'admin-main--collapsed': sidebarCollapsed }"
    >
      <AdminHeader @toggle-sidebar="toggleSidebar" @logout="handleLogout" />
      <div class="admin-content">
        <router-view v-slot="{ Component, route }">
          <keep-alive>
            <component
              :is="Component"
              v-if="route.meta.keepAlive"
              :key="route.fullPath"
            />
          </keep-alive>
          <component
            :is="Component"
            v-if="!route.meta.keepAlive"
            :key="route.fullPath"
          />
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const sidebarRef = ref<InstanceType<typeof AdminSidebar> | null>(null);

// 侧边栏折叠状态
const sidebarCollapsed = ref(false);

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    // 强制更新组件
    if (sidebarRef.value) {
      sidebarRef.value.$forceUpdate();
    }
  }
);

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;

  // 在移动端，切换侧边栏的可见性
  if (window.innerWidth <= 768 && sidebarRef.value) {
    sidebarRef.value.toggleMobileVisibility();
  }
};

// 处理菜单点击
const handleMenuClick = (path: string) => {
  if (route.path !== path) {
    router.push(path).catch((err) => {
      if (err.name !== "NavigationDuplicated") {
        console.error("Navigation error:", err);
      }
    });
  }
};

// 处理登出
const handleLogout = async () => {
  await userStore.logout();
  router.push("/admin/login");
};
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 250px;
  transition: margin-left 0.3s ease;

  &--collapsed {
    margin-left: 80px;
  }
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .admin-main {
    margin-left: 0;

    &--collapsed {
      margin-left: 0;
    }
  }
}
</style>
