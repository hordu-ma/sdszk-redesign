<template>
  <a-layout class="admin-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="admin-sider"
    >
      <div class="logo">
        <img src="../assets/images/logo.png" alt="Logo" />
        <span v-show="!collapsed">管理系统</span>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="dashboard">
          <template #icon>
            <DashboardOutlined />
          </template>
          <router-link to="/admin/dashboard">仪表盘</router-link>
        </a-menu-item>
        <a-menu-item key="news">
          <template #icon>
            <FileTextOutlined />
          </template>
          <router-link to="/admin/news">新闻管理</router-link>
        </a-menu-item>
        <a-menu-item key="resources">
          <template #icon>
            <FolderOutlined />
          </template>
          <router-link to="/admin/resources">资源管理</router-link>
        </a-menu-item>
        <a-menu-item key="activities">
          <template #icon>
            <CalendarOutlined />
          </template>
          <router-link to="/admin/activities">活动管理</router-link>
        </a-menu-item>
        <a-menu-item key="users">
          <template #icon>
            <TeamOutlined />
          </template>
          <router-link to="/admin/users">用户管理</router-link>
        </a-menu-item>
        <a-menu-item key="settings">
          <template #icon>
            <SettingOutlined />
          </template>
          <router-link to="/admin/settings">系统设置</router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="admin-header">
        <menu-unfold-outlined
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined
          v-else
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <div class="header-right">
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <a-avatar>
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="username">管理员</span>
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="1" @click="handleLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../stores/user";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const collapsed = ref(false);
const selectedKeys = ref([route.name]);

const handleLogout = () => {
  userStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-sider {
  background: #001529;
}

.logo {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.logo img {
  width: 32px;
  height: 32px;
}

.logo span {
  color: white;
  margin-left: 8px;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 1;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.ant-dropdown-link {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
}

.username {
  margin-left: 8px;
}

.admin-content {
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  border-radius: 2px;
}
</style>
