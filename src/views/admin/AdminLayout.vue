<!-- AdminLayout.vue - 管理界面布局 -->
<template>
  <a-layout class="admin-layout" :class="{ collapsed: collapsed }">
    <!-- 侧边菜单 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      class="admin-sider"
      :trigger="null"
      :width="240"
    >
      <div class="admin-logo">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo-img" />
        <h1 v-show="!collapsed" class="logo-text">内容管理系统</h1>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        :items="menuItems"
        @click="handleMenuClick"
      />

      <div class="admin-user-info" :class="{ collapsed }">
        <a-avatar :src="userInfo?.avatar || '/avatar-placeholder.png'" />
        <div class="user-details" v-if="!collapsed">
          <div class="user-name">
            {{ userInfo?.name || userInfo?.username }}
          </div>
          <div class="user-role">{{ userRoleText }}</div>
        </div>
      </div>
    </a-layout-sider>

    <!-- 内容区域 -->
    <a-layout>
      <!-- 顶部导航 -->
      <a-layout-header class="admin-header">
        <div class="header-left">
          <MenuUnfoldOutlined
            v-if="collapsed"
            @click="collapsed = false"
            class="trigger"
          />
          <MenuFoldOutlined v-else @click="collapsed = true" class="trigger" />
          <BreadCrumb />
        </div>

        <div class="header-right">
          <!-- 消息通知 -->
          <a-dropdown :trigger="['click']">
            <a-badge
              :count="notifications.length"
              :dot="notifications.length > 0"
              class="notification-badge"
            >
              <BellOutlined class="header-icon" />
            </a-badge>
            <template #overlay>
              <NotificationsDropdown />
            </template>
          </a-dropdown>

          <!-- 个人菜单 -->
          <a-dropdown :trigger="['click']">
            <div class="header-user">
              <a-avatar :src="userInfo?.avatar || '/avatar-placeholder.png'" />
              <span class="user-name">{{
                userInfo?.name || userInfo?.username
              }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile">
                  <UserOutlined />
                  <span>个人资料</span>
                </a-menu-item>
                <a-menu-item key="settings">
                  <SettingOutlined />
                  <span>账户设置</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容 -->
      <a-layout-content class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <!-- 底部版权 -->
      <a-layout-footer class="admin-footer">
        <p>
          © {{ currentYear }} 山东省大中小学思政课一体化指导中心 内容管理系统
        </p>
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  HomeOutlined,
  ReadOutlined,
  FileTextOutlined,
  CalendarOutlined,
  FileOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { message, Modal } from "ant-design-vue";
import BreadCrumb from "@/components/admin/BreadCrumb.vue";
import NotificationsDropdown from "@/components/admin/NotificationsDropdown.vue";

export default {
  name: "AdminLayout",

  components: {
    BreadCrumb,
    NotificationsDropdown,
  },

  setup() {
    const router = useRouter();
    const route = useRoute();
    const userStore = useUserStore();
    const collapsed = ref(false);
    const selectedKeys = ref([]);
    const notifications = ref([]);

    // 计算当前年份
    const currentYear = computed(() => new Date().getFullYear());

    // 用户信息
    const userInfo = computed(() => userStore.userInfo);

    // 用户角色文本
    const userRoleText = computed(() => {
      const roleMap = {
        admin: "系统管理员",
        editor: "内容编辑",
        viewer: "普通用户",
      };
      return roleMap[userInfo.value?.role] || "未知角色";
    });

    // 构建菜单项
    const menuItems = computed(() => {
      const items = [
        {
          key: "/admin",
          icon: () => h(DashboardOutlined),
          label: "控制面板",
          title: "控制面板",
        },
        {
          key: "/admin/news",
          icon: () => h(ReadOutlined),
          label: "资讯管理",
          title: "资讯管理",
          children: [
            {
              key: "/admin/news/list",
              label: "资讯列表",
              title: "资讯列表",
            },
            {
              key: "/admin/news/categories",
              label: "资讯分类",
              title: "资讯分类",
            },
            {
              key: "/admin/news/create",
              label: "添加资讯",
              title: "添加资讯",
            },
          ],
        },
        {
          key: "/admin/resources",
          icon: () => h(FileOutlined),
          label: "资源管理",
          title: "资源管理",
          children: [
            {
              key: "/admin/resources/list",
              label: "资源列表",
              title: "资源列表",
            },
            {
              key: "/admin/resources/categories",
              label: "资源分类",
              title: "资源分类",
            },
            {
              key: "/admin/resources/create",
              label: "添加资源",
              title: "添加资源",
            },
          ],
        },
        {
          key: "/admin/activities",
          icon: () => h(CalendarOutlined),
          label: "活动管理",
          title: "活动管理",
          children: [
            {
              key: "/admin/activities/list",
              label: "活动列表",
              title: "活动列表",
            },
            {
              key: "/admin/activities/create",
              label: "添加活动",
              title: "添加活动",
            },
          ],
        },
      ];

      // 仅管理员可见的菜单
      if (userInfo.value?.role === "admin") {
        items.push(
          {
            key: "/admin/users",
            icon: () => h(TeamOutlined),
            label: "用户管理",
            title: "用户管理",
          },
          {
            key: "/admin/settings",
            icon: () => h(SettingOutlined),
            label: "系统设置",
            title: "系统设置",
            children: [
              {
                key: "/admin/settings/general",
                label: "基本设置",
                title: "基本设置",
              },
              {
                key: "/admin/settings/appearance",
                label: "外观设置",
                title: "外观设置",
              },
              {
                key: "/admin/settings/logs",
                label: "系统日志",
                title: "系统日志",
              },
            ],
          }
        );
      }

      return items;
    });

    // 更新选中的菜单
    const updateSelectedKeys = () => {
      const path = route.path;

      // 匹配最深层级的路由
      const findDeepestMatch = (items, path, parent = null) => {
        for (const item of items) {
          if (path === item.key) {
            return [item.key];
          }

          if (path.startsWith(item.key) && item.children) {
            const childMatch = findDeepestMatch(item.children, path, item);
            if (childMatch.length > 0) {
              return childMatch;
            }
          }
        }

        // 匹配父级路由
        if (parent && path.startsWith(parent.key)) {
          return [parent.key];
        }

        return [];
      };

      selectedKeys.value = findDeepestMatch(menuItems.value, path);

      // 默认选中第一个菜单
      if (selectedKeys.value.length === 0 && path === "/admin") {
        selectedKeys.value = ["/admin"];
      }
    };

    // 监听路由变化
    watch(() => route.path, updateSelectedKeys, { immediate: true });

    // 点击菜单项
    const handleMenuClick = ({ key }) => {
      router.push({ path: key });
    };

    // 处理退出登录
    const handleLogout = () => {
      Modal.confirm({
        title: "确定要退出登录吗?",
        content: "您的登录会话将被终止",
        okText: "确定",
        cancelText: "取消",
        onOk: async () => {
          await userStore.logout();
          message.success("已成功退出登录");
          router.push({ name: "AdminLogin" });
        },
      });
    };

    // 加载通知
    const loadNotifications = async () => {
      try {
        // TODO: 从API获取通知
        notifications.value = [];
      } catch (error) {
        console.error("加载通知失败:", error);
      }
    };

    // 初始化
    onMounted(() => {
      // 验证用户登录状态
      if (!userStore.isLoggedIn) {
        router.push({ name: "AdminLogin" });
        return;
      }

      loadNotifications();
    });

    return {
      collapsed,
      selectedKeys,
      menuItems,
      userInfo,
      userRoleText,
      notifications,
      currentYear,
      handleMenuClick,
      handleLogout,
      // 图标
      HomeOutlined,
      ReadOutlined,
      FileTextOutlined,
      CalendarOutlined,
      FileOutlined,
      SettingOutlined,
      TeamOutlined,
      UserOutlined,
      BellOutlined,
      MenuUnfoldOutlined,
      MenuFoldOutlined,
      DashboardOutlined,
      LogoutOutlined,
    };
  },
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s;
  background-color: #002140;
}

.logo-img {
  height: 32px;
  width: auto;
  transition: all 0.3s;
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 0 12px;
  white-space: nowrap;
  transition: opacity 0.3s;
}

.admin-sider {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.admin-user-info {
  margin-top: auto;
  padding: 16px;
  background-color: #001529;
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.admin-user-info.collapsed {
  justify-content: center;
}

.user-details {
  margin-left: 12px;
  overflow: hidden;
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  opacity: 0.8;
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.header-icon {
  font-size: 18px;
  padding: 0 12px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.3s;
}

.header-icon:hover {
  color: #1890ff;
}

.notification-badge {
  margin-right: 20px;
}

.header-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.header-user .user-name {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.65);
}

.admin-content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  border-radius: 2px;
  overflow: auto;
}

.admin-footer {
  text-align: center;
  padding: 12px 50px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  background: #f0f2f5;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
