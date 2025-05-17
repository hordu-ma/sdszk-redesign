<!-- AdminDashboard.vue - 管理员仪表盘页面 -->
<template>
  <div class="dashboard-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>
          {{ greeting }}，{{ userInfo?.name || userInfo?.username }}
          <a-tag color="blue" v-if="userInfo?.role === 'admin'">管理员</a-tag>
          <a-tag color="green" v-else-if="userInfo?.role === 'editor'"
            >编辑</a-tag
          >
          <a-tag color="orange" v-else>访客</a-tag>
        </h1>
        <p>欢迎使用山东省大中小学思政课一体化指导中心内容管理系统</p>
      </div>
      <div class="welcome-stats">
        <a-statistic
          title="今日访问量"
          :value="stats.todayVisits"
          style="margin-right: 32px"
        />
        <a-statistic title="总访问量" :value="stats.totalVisits" />
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="24" :sm="12" :md="12" :lg="6">
        <a-card hoverable @click="goToNews">
          <template #cover>
            <div class="card-icon blue">
              <ReadOutlined />
            </div>
          </template>
          <a-card-meta title="资讯文章">
            <template #description>
              <div class="card-stats">
                <div class="main-stat">{{ stats.totalNews }}</div>
                <a-tag color="blue">{{ stats.todayNews }} 今日新增</a-tag>
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="12" :lg="6">
        <a-card hoverable @click="goToResources">
          <template #cover>
            <div class="card-icon green">
              <FileOutlined />
            </div>
          </template>
          <a-card-meta title="资源文件">
            <template #description>
              <div class="card-stats">
                <div class="main-stat">{{ stats.totalResources }}</div>
                <a-tag color="green">{{
                  formatFileSize(stats.totalFileSize)
                }}</a-tag>
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="12" :lg="6">
        <a-card hoverable @click="goToActivities">
          <template #cover>
            <div class="card-icon orange">
              <CalendarOutlined />
            </div>
          </template>
          <a-card-meta title="活动安排">
            <template #description>
              <div class="card-stats">
                <div class="main-stat">{{ stats.totalActivities }}</div>
                <a-tag color="orange"
                  >{{ stats.upcomingActivities }} 即将进行</a-tag
                >
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="12" :lg="6">
        <a-card hoverable @click="goToUsers">
          <template #cover>
            <div class="card-icon purple">
              <TeamOutlined />
            </div>
          </template>
          <a-card-meta title="用户数量">
            <template #description>
              <div class="card-stats">
                <div class="main-stat">{{ stats.totalUsers }}</div>
                <a-tag color="purple">{{ stats.activeUsers }} 活跃用户</a-tag>
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="8">
          <a-button type="primary" block size="large" @click="goToNewNews">
            <FileAddOutlined /> 发布新资讯
          </a-button>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <a-button type="primary" block size="large" @click="goToNewResource">
            <UploadOutlined /> 上传资源文件
          </a-button>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8">
          <a-button type="primary" block size="large" @click="goToNewActivity">
            <PlusCircleOutlined /> 创建新活动
          </a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 内容概览 -->
    <a-row :gutter="[16, 16]" class="content-overview">
      <a-col :xs="24" :lg="12">
        <a-card
          title="最近发布的资讯"
          :extra="extraNewsLink"
          :loading="loading"
        >
          <a-list item-layout="horizontal" :data-source="recentNews">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <router-link :to="`/admin/news/edit/${item._id}`">{{
                      item.title
                    }}</router-link>
                  </template>
                  <template #description>
                    <div class="list-item-meta">
                      <span>{{ formatDate(item.publishDate) }}</span>
                      <a-tag :color="getCategoryColor(item.category)">{{
                        item.category
                      }}</a-tag>
                      <a-tag v-if="item.isPublished" color="green"
                        >已发布</a-tag
                      >
                      <a-tag v-else color="orange">草稿</a-tag>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar :src="item.cover || '/placeholder-news.jpg'" />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a key="edit" @click="goToEditNews(item._id)"
                    ><EditOutlined
                  /></a>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="12">
        <a-card
          title="最近的活动"
          :extra="extraActivitiesLink"
          :loading="loading"
        >
          <a-list item-layout="horizontal" :data-source="recentActivities">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <router-link :to="`/admin/activities/edit/${item._id}`">{{
                      item.title
                    }}</router-link>
                  </template>
                  <template #description>
                    <div class="list-item-meta">
                      <span>{{
                        formatDateRange(item.startDate, item.endDate)
                      }}</span>
                      <a-tag :color="getActivityColor(item.status)">{{
                        getActivityStatus(item.status)
                      }}</a-tag>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar
                      :src="item.poster || '/placeholder-activity.jpg'"
                    />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a key="edit" @click="goToEditActivity(item._id)"
                    ><EditOutlined
                  /></a>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 系统状态 -->
    <a-card title="系统状态" v-if="userInfo?.role === 'admin'">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-progress
            type="dashboard"
            :percent="systemStatus.cpuUsage"
            :format="percentFormat"
          />
          <div class="status-title">CPU 使用率</div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-progress
            type="dashboard"
            :percent="systemStatus.memoryUsage"
            :format="percentFormat"
          />
          <div class="status-title">内存使用率</div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-progress
            type="dashboard"
            :percent="systemStatus.diskUsage"
            :format="percentFormat"
          />
          <div class="status-title">磁盘使用率</div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic
            title="运行时间"
            :value="systemStatus.uptime"
            suffix="小时"
          />
        </a-col>
      </a-row>
      <a-divider />
      <a-row>
        <a-col :span="24">
          <div class="system-info">
            <p><strong>系统版本:</strong> {{ systemStatus.version }}</p>
            <p>
              <strong>上次更新:</strong>
              {{ formatDate(systemStatus.lastUpdate) }}
            </p>
            <p><strong>服务器地址:</strong> {{ systemStatus.serverAddress }}</p>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import {
  ReadOutlined,
  FileOutlined,
  CalendarOutlined,
  TeamOutlined,
  EditOutlined,
  FileAddOutlined,
  UploadOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import dayjs from "dayjs";

export default {
  name: "AdminDashboard",

  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const loading = ref(false);

    // 创建卡片的额外链接
    const extraNewsLink = h(
      "a",
      {
        onClick: () => goToNews(),
      },
      "查看全部"
    );

    const extraActivitiesLink = h(
      "a",
      {
        onClick: () => goToActivities(),
      },
      "查看全部"
    );

    // 用户信息
    const userInfo = computed(() => userStore.userInfo);

    // 问候语
    const greeting = computed(() => {
      const hour = new Date().getHours();
      if (hour < 6) return "夜深了";
      if (hour < 9) return "早上好";
      if (hour < 12) return "上午好";
      if (hour < 14) return "中午好";
      if (hour < 17) return "下午好";
      if (hour < 19) return "傍晚好";
      return "晚上好";
    });

    // 统计数据
    const stats = reactive({
      totalNews: 0,
      todayNews: 0,
      totalResources: 0,
      totalFileSize: 0,
      totalActivities: 0,
      upcomingActivities: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayVisits: 0,
      totalVisits: 0,
    });

    // 系统状态
    const systemStatus = reactive({
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      uptime: 0,
      version: "",
      lastUpdate: null,
      serverAddress: "",
    });

    // 最近的资讯
    const recentNews = ref([]);

    // 最近的活动
    const recentActivities = ref([]);

    // 格式化百分比
    const percentFormat = (percent) => {
      return `${percent}%`;
    };

    // 格式化日期
    const formatDate = (date) => {
      return dayjs(date).format("YYYY-MM-DD");
    };

    // 格式化日期范围
    const formatDateRange = (start, end) => {
      return `${dayjs(start).format("MM-DD")} 至 ${dayjs(end).format("MM-DD")}`;
    };

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // 获取分类颜色
    const getCategoryColor = (category) => {
      const colorMap = {
        中心动态: "blue",
        通知公告: "green",
        政策文件: "orange",
        媒体报道: "purple",
        研究成果: "red",
        思政研究: "cyan",
      };
      return colorMap[category] || "default";
    };

    // 获取活动状态文本
    const getActivityStatus = (status) => {
      const statusMap = {
        upcoming: "即将开始",
        ongoing: "进行中",
        completed: "已结束",
        canceled: "已取消",
      };
      return statusMap[status] || status;
    };

    // 获取活动状态颜色
    const getActivityColor = (status) => {
      const colorMap = {
        upcoming: "blue",
        ongoing: "green",
        completed: "default",
        canceled: "red",
      };
      return colorMap[status] || "default";
    };

    // 获取仪表盘数据
    const loadDashboardData = async () => {
      try {
        loading.value = true;

        // TODO: 实际项目中这里应该发起API请求获取数据
        // 示例：使用 axios 或其他库发起请求
        // const response = await axios.get('/api/dashboard-data');
        // const data = response.data;

        // TODO: 根据实际API响应更新统计数据
        // stats.totalNews = data.stats.totalNews;
        // stats.todayNews = data.stats.todayNews;
        // stats.totalResources = data.stats.totalResources;
        // stats.totalFileSize = data.stats.totalFileSize;
        // stats.totalActivities = data.stats.totalActivities;
        // stats.upcomingActivities = data.stats.upcomingActivities;
        // stats.totalUsers = data.stats.totalUsers;
        // stats.activeUsers = data.stats.activeUsers;
        // stats.todayVisits = data.stats.todayVisits;
        // stats.totalVisits = data.stats.totalVisits;

        // TODO: 根据实际API响应更新系统状态 (如果用户是管理员)
        // if (userInfo?.value?.role === 'admin') {
        //   systemStatus.cpuUsage = data.systemStatus.cpuUsage;
        //   systemStatus.memoryUsage = data.systemStatus.memoryUsage;
        //   systemStatus.diskUsage = data.systemStatus.diskUsage;
        //   systemStatus.uptime = data.systemStatus.uptime;
        //   systemStatus.version = data.systemStatus.version;
        //   systemStatus.lastUpdate = new Date(data.systemStatus.lastUpdate);
        //   systemStatus.serverAddress = data.systemStatus.serverAddress;
        // }

        // TODO: 根据实际API响应更新最近资讯和活动
        // recentNews.value = data.recentNews;
        // recentActivities.value = data.recentActivities;

        // 以下为模拟数据 (请在实际项目中删除)
        stats.totalNews = 127;
        stats.todayNews = 3;
        stats.totalResources = 89;
        stats.totalFileSize = 1.5 * 1024 * 1024 * 1024; // 1.5GB
        stats.totalActivities = 42;
        stats.upcomingActivities = 5;
        stats.totalUsers = 18;
        stats.activeUsers = 7;
        stats.todayVisits = 356;
        stats.totalVisits = 24689;

        systemStatus.cpuUsage = 28;
        systemStatus.memoryUsage = 45;
        systemStatus.diskUsage = 36;
        systemStatus.uptime = 156;
        systemStatus.version = "v1.2.3";
        systemStatus.lastUpdate = new Date("2023-06-15");
        systemStatus.serverAddress = "server.sdszk.example.com";

        recentNews.value = [
          { _id: '1', title: '资讯标题1', publishDate: new Date(), category: '中心动态', isPublished: true, cover: '' },
          { _id: '2', title: '资讯标题2', publishDate: new Date(), category: '通知公告', isPublished: false, cover: '' },
          { _id: '3', title: '资讯标题3', publishDate: new Date(), category: '政策文件', isPublished: true, cover: '' },
          { _id: '4', title: '资讯标题4', publishDate: new Date(), category: '媒体报道', isPublished: true, cover: '' },
          { _id: '5', title: '资讯标题5', publishDate: new Date(), category: '研究成果', isPublished: false, cover: '' },
        ];

        recentActivities.value = [
          { _id: 'a1', title: '活动标题1', startDate: new Date(), endDate: new Date(Date.now() + 86400000), status: 'upcoming', poster: '' },
          { _id: 'a2', title: '活动标题2', startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000), status: 'ongoing', poster: '' },
          { _id: 'a3', title: '活动标题3', startDate: new Date(Date.now() - 86400000*2), endDate: new Date(Date.now() - 86400000), status: 'completed', poster: '' },
          { _id: 'a4', title: '活动标题4', startDate: new Date(), endDate: new Date(), status: 'canceled', poster: '' },
          { _id: 'a5', title: '活动标题5', startDate: new Date(Date.now() + 86400000*2), endDate: new Date(Date.now() + 86400000*3), status: 'upcoming', poster: '' },
        ];

        console.log('Dashboard data loaded:', { stats: stats, recentNews: recentNews.value, recentActivities: recentActivities.value });

      } catch (error) {
        console.error("加载仪表盘数据失败:", error);
        // TODO: 显示错误提示给用户
      } finally {
        loading.value = false;
      }
    };

    // 路由方法
    const goToNews = () => router.push("/admin/news/list");
    const goToResources = () => router.push("/admin/resources/list");
    const goToActivities = () => router.push("/admin/activities/list");
    const goToUsers = () => router.push("/admin/users");
    const goToNewNews = () => router.push("/admin/news/create");
    const goToNewResource = () => router.push("/admin/resources/create");
    const goToNewActivity = () => router.push("/admin/activities/create");
    const goToEditNews = (id) => router.push(`/admin/news/edit/${id}`);
    const goToEditActivity = (id) =>
      router.push(`/admin/activities/edit/${id}`);

    onMounted(() => {
      console.log('onMounted called in AdminDashboard.vue');
      loadDashboardData();
      console.log('loadDashboardData called');
    });

    return {
      userInfo,
      greeting,
      stats,
      systemStatus,
      recentNews,
      recentActivities,
      loading,
      percentFormat,
      formatDate,
      formatDateRange,
      formatFileSize,
      getCategoryColor,
      getActivityStatus,
      getActivityColor,
      goToNews,
      goToResources,
      goToActivities,
      goToUsers,
      goToNewNews,
      goToNewResource,
      goToNewActivity,
      goToEditNews,
      goToEditActivity,
      extraNewsLink,
      extraActivitiesLink,
      // 图标
      ReadOutlined,
      FileOutlined,
      CalendarOutlined,
      TeamOutlined,
      EditOutlined,
      FileAddOutlined,
      UploadOutlined,
      PlusCircleOutlined,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.welcome-text h1 {
  font-size: 24px;
  margin-bottom: 8px;
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-text p {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  margin: 0;
}

.welcome-stats {
  display: flex;
  align-items: center;
  margin-top: 20px;
}

.stat-cards {
  margin-bottom: 24px;
}

.card-icon {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 48px;
}

.card-icon.blue {
  background-color: #e6f7ff;
  color: #1890ff;
}

.card-icon.green {
  background-color: #f6ffed;
  color: #52c41a;
}

.card-icon.orange {
  background-color: #fff7e6;
  color: #fa8c16;
}

.card-icon.purple {
  background-color: #f9f0ff;
  color: #722ed1;
}

.card-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-stat {
  font-size: 24px;
  font-weight: 600;
}

.quick-actions {
  margin-bottom: 24px;
}

.quick-actions h2 {
  margin-bottom: 16px;
}

.content-overview {
  margin-bottom: 24px;
}

.list-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.system-status {
  margin-bottom: 24px;
}

.status-title {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
}

.system-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

:deep(.ant-card-body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-stats {
    margin-top: 16px;
  }
}
</style>
