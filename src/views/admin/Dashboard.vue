<template>
  <div class="dashboard-container">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><user-outlined /> 用户总数</div>
          </template>
          <div class="card-content">
            <div class="number">{{ overview.users.total }}</div>
            <div class="desc">今日新增 {{ overview.users.today }}</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><file-text-outlined /> 文章总数</div>
          </template>
          <div class="card-content">
            <div class="number">{{ overview.news.total }}</div>
            <div class="desc">今日新增 {{ overview.news.today }}</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><folder-outlined /> 资源总数</div>
          </template>
          <div class="card-content">
            <div class="number">{{ overview.resources.total }}</div>
            <div class="desc">今日新增 {{ overview.resources.today }}</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><calendar-outlined /> 活动总数</div>
          </template>
          <div class="card-content">
            <div class="number">{{ overview.activities.total }}</div>
            <div class="desc">今日新增 {{ overview.activities.today }}</div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="mt-4">
      <a-col :span="16">
        <a-card title="活动趋势">
          <template v-if="!loading">
            <v-chart :option="chartOption" autoresize />
          </template>
          <a-spin v-else />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="最近活动">
          <a-list
            :loading="loading"
            :data-source="recentActivities"
            class="recent-activities"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="activity-item">
                  <div class="activity-title">{{ item.action }}</div>
                  <div class="activity-meta">
                    <span>{{ item.user.username }}</span>
                    <span>{{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useDashboardStore } from "@/stores/dashboard";
import {
  UserOutlined,
  FileTextOutlined,
  FolderOutlined,
  CalendarOutlined,
} from "@ant-design/icons-vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
} from "echarts/components";
import { formatDate } from "@/utils/date";

// 注册 ECharts 必要组件
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
]);

const dashboardStore = useDashboardStore();
const loading = computed(() => dashboardStore.loading);
const overview = computed(() => dashboardStore.overview);
const activityTrend = computed(() => dashboardStore.activityTrend);
const recentActivities = computed(() => dashboardStore.recentActivities);

// 图表配置
const chartOption = computed(() => ({
  tooltip: {
    trigger: "axis",
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: activityTrend.value.map((item) => item._id),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "活动数",
      type: "line",
      data: activityTrend.value.map((item) => item.count),
      areaStyle: {},
      smooth: true,
    },
  ],
}));

// 初始化数据
onMounted(async () => {
  try {
    await Promise.all([
      dashboardStore.fetchOverview(),
      dashboardStore.fetchRecentActivities(),
    ]);
  } catch (error) {
    console.error("加载仪表盘数据失败:", error);
  }
});
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-content {
  text-align: center;
}

.number {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.desc {
  color: #666;
}

.mt-4 {
  margin-top: 16px;
}

.recent-activities {
  height: 400px;
  overflow-y: auto;
}

.activity-item {
  width: 100%;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

:deep(.ant-card-body) {
  padding: 16px;
}

.v-chart {
  width: 100%;
  height: 400px;
}
</style>
