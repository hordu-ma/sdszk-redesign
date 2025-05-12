<!-- NotificationsDropdown.vue - 通知菜单组件 -->
<template>
  <div class="notifications-dropdown">
    <a-menu>
      <div class="notifications-header">
        <div class="notification-title">通知中心</div>
        <a
          @click="markAllAsRead"
          v-if="notifications.length > 0"
          class="mark-read-link"
        >
          全部已读
        </a>
      </div>

      <a-spin :spinning="loading">
        <a-empty v-if="notifications.length === 0" description="暂无通知" />

        <div class="notifications-list" v-else>
          <a-menu-item
            v-for="(notification, index) in notifications"
            :key="notification.id || index"
            @click="handleNotificationClick(notification)"
          >
            <div
              class="notification-item"
              :class="{ 'notification-unread': !notification.isRead }"
            >
              <div class="notification-icon" :class="notification.type">
                <component :is="notificationIcon(notification.type)" />
              </div>
              <div class="notification-content">
                <div class="notification-message">
                  {{ notification.message }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
            </div>
          </a-menu-item>
        </div>
      </a-spin>

      <div class="notifications-footer">
        <router-link to="/admin/notifications">查看所有通知</router-link>
      </div>
    </a-menu>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 设置dayjs语言为中文
dayjs.locale("zh-cn");
// 加载相对时间插件
dayjs.extend(relativeTime);

export default {
  name: "NotificationsDropdown",

  setup() {
    const router = useRouter();
    const notifications = ref([]);
    const loading = ref(false);

    // 模拟加载通知
    const loadNotifications = async () => {
      try {
        loading.value = true;

        // 模拟API调用，实际项目中应替换为真实API
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 模拟数据
        notifications.value = [
          {
            id: 1,
            type: "info",
            message: "系统将于今晚进行维护升级",
            isRead: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
            link: "/admin/notifications/1",
          },
          {
            id: 2,
            type: "success",
            message: "您提交的文章《关于思政课改革的思考》已发布",
            isRead: true,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3小时前
            link: "/admin/news/view/123",
          },
          {
            id: 3,
            type: "warning",
            message: "您有3篇文章等待审核",
            isRead: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
            link: "/admin/news/pending",
          },
          {
            id: 4,
            type: "error",
            message: "无法上传文件，磁盘空间不足",
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
            link: "/admin/settings/storage",
          },
        ];
      } catch (error) {
        message.error("加载通知失败");
        console.error("加载通知失败:", error);
      } finally {
        loading.value = false;
      }
    };

    // 处理通知点击
    const handleNotificationClick = (notification) => {
      // 标记为已读
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      // 跳转到相关页面
      if (notification.link) {
        router.push(notification.link);
      }
    };

    // 标记单个通知为已读
    const markAsRead = async (id) => {
      try {
        // 实际项目中应调用API
        const index = notifications.value.findIndex((n) => n.id === id);
        if (index !== -1) {
          notifications.value[index].isRead = true;
        }
      } catch (error) {
        console.error("标记通知失败:", error);
      }
    };

    // 标记所有通知为已读
    const markAllAsRead = async () => {
      try {
        // 实际项目中应调用API
        notifications.value.forEach((notification) => {
          notification.isRead = true;
        });

        message.success("已将所有通知标记为已读");
      } catch (error) {
        message.error("操作失败");
        console.error("标记所有通知失败:", error);
      }
    };

    // 根据通知类型返回对应的图标组件
    const notificationIcon = (type) => {
      switch (type) {
        case "success":
          return CheckCircleOutlined;
        case "warning":
          return ExclamationCircleOutlined;
        case "error":
          return CloseCircleOutlined;
        case "info":
        default:
          return InfoCircleOutlined;
      }
    };

    // 格式化时间为相对时间（例如：3小时前）
    const formatTime = (time) => {
      return dayjs(time).fromNow();
    };

    // 初始化
    onMounted(() => {
      loadNotifications();
    });

    return {
      notifications,
      loading,
      handleNotificationClick,
      markAllAsRead,
      notificationIcon,
      formatTime,
    };
  },
};
</script>

<style scoped>
.notifications-dropdown {
  min-width: 320px;
  max-width: 360px;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.notification-title {
  font-weight: 600;
  font-size: 16px;
}

.mark-read-link {
  font-size: 13px;
  color: #1890ff;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
}

.notification-unread {
  background-color: #e6f7ff;
}

.notification-icon {
  font-size: 16px;
  margin-right: 12px;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon.info {
  color: #1890ff;
  background-color: #e6f7ff;
}

.notification-icon.success {
  color: #52c41a;
  background-color: #f6ffed;
}

.notification-icon.warning {
  color: #faad14;
  background-color: #fffbe6;
}

.notification-icon.error {
  color: #f5222d;
  background-color: #fff1f0;
}

.notification-content {
  flex: 1;
}

.notification-message {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.notifications-footer {
  padding: 10px 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-menu-item) {
  margin: 0 !important;
  padding: 0 16px !important;
}

:deep(.ant-menu-item-active) {
  background-color: #f5f5f5;
}
</style>
