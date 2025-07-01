<template>
  <div class="admin-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>仪表盘</h2>
        <p>系统概览和关键指标监控</p>
      </div>
      <div class="header-right">
        <a-space>
          <a-button @click="refreshData" :loading="refreshing">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新数据
          </a-button>
          <a-button @click="exportData">
            <template #icon>
              <DownloadOutlined />
            </template>
            导出报告
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsData" :key="stat.key">
        <div
          class="stat-icon"
          :style="{ backgroundColor: stat.color + '20', color: stat.color }"
        >
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div
            class="stat-trend"
            :class="{
              'trend-up': stat.trend > 0,
              'trend-down': stat.trend < 0,
              'trend-neutral': stat.trend === 0,
            }"
          >
            <ArrowUpOutlined v-if="stat.trend > 0" />
            <ArrowDownOutlined v-if="stat.trend < 0" />
            <MinusOutlined v-if="stat.trend === 0" />
            <span>{{ Math.abs(stat.trend) }}%</span>
            <span class="trend-period">较上期</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表和快捷操作区域 -->
    <div class="dashboard-content">
      <div class="content-left">
        <!-- 访问量趋势图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>访问量趋势</h3>
            <div class="chart-controls">
              <a-select
                v-model:value="chartPeriod"
                style="width: 120px"
                @change="loadVisitTrends"
              >
                <a-select-option value="7">近7天</a-select-option>
                <a-select-option value="30">近30天</a-select-option>
                <a-select-option value="90">近90天</a-select-option>
              </a-select>
              <a-button type="text" @click="toggleChartType">
                <template #icon>
                  <BarChartOutlined v-if="chartType === 'line'" />
                  <LineChartOutlined v-else />
                </template>
              </a-button>
            </div>
          </div>
          <div class="chart-container" ref="chartRef"></div>
        </div>

        <!-- 内容分布图表 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>内容分布</h3>
            <a-select
              v-model:value="contentChartType"
              style="width: 120px"
              @change="loadContentDistribution"
            >
              <a-select-option value="category">按分类</a-select-option>
              <a-select-option value="status">按状态</a-select-option>
            </a-select>
          </div>
          <div class="chart-container" ref="contentChartRef"></div>
        </div>

        <!-- 最新动态 -->
        <div class="activity-card">
          <div class="card-header">
            <h3>最新动态</h3>
            <a-button type="link" @click="viewAllActivities">查看全部</a-button>
          </div>
          <div class="activity-list">
            <div
              class="activity-item"
              v-for="activity in recentActivities"
              :key="activity.id"
            >
              <div class="activity-avatar">
                <a-avatar :src="activity.user.avatar" :size="32">
                  {{ activity.user.username?.charAt(0)?.toUpperCase() }}
                </a-avatar>
              </div>
              <div class="activity-content">
                <div class="activity-text">
                  <strong>{{ activity.user.username }}</strong>
                  {{ activity.action }}
                  <strong>{{ activity.target }}</strong>
                </div>
                <div class="activity-time">
                  {{ formatTime(activity.createdAt) }}
                </div>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="empty-state">
              <a-empty description="暂无动态" />
            </div>
          </div>
        </div>
      </div>

      <div class="content-right">
        <!-- 快捷操作 -->
        <div class="quick-actions-card">
          <div class="card-header">
            <h3>快捷操作</h3>
          </div>
          <div class="quick-actions">
            <a-button
              v-for="action in quickActions"
              :key="action.key"
              :type="action.type"
              :icon="h(action.icon)"
              block
              @click="handleQuickAction(action.key)"
            >
              {{ action.label }}
            </a-button>
          </div>
        </div>

        <!-- 系统状态监控 -->
        <div class="system-status-card">
          <div class="card-header">
            <h3>系统状态</h3>
            <a-tag
              :color="systemStatus.overall === 'healthy' ? 'green' : 'red'"
            >
              {{ systemStatus.overall === "healthy" ? "正常" : "异常" }}
            </a-tag>
          </div>
          <div class="system-status">
            <div
              class="status-item"
              v-for="item in systemStatus.items"
              :key="item.key"
            >
              <div class="status-info">
                <span class="status-label">{{ item.label }}</span>
                <span class="status-value">{{ item.value }}</span>
              </div>
              <a-tag
                :color="
                  item.status === 'healthy'
                    ? 'green'
                    : item.status === 'warning'
                      ? 'orange'
                      : 'red'
                "
              >
                {{
                  item.status === "healthy"
                    ? "正常"
                    : item.status === "warning"
                      ? "警告"
                      : "异常"
                }}
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 性能指标 -->
        <div class="performance-card">
          <div class="card-header">
            <h3>性能指标</h3>
          </div>
          <div class="performance-metrics">
            <div
              class="metric-item"
              v-for="metric in performanceMetrics"
              :key="metric.key"
            >
              <div class="metric-header">
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-value">{{ metric.value }}</span>
              </div>
              <a-progress
                :percent="metric.percent"
                :status="metric.status"
                :stroke-color="metric.color"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据导出模态框 -->
    <a-modal
      v-model:open="exportModalVisible"
      title="导出数据报告"
      @ok="handleExport"
      @cancel="exportModalVisible = false"
      :confirm-loading="exporting"
    >
      <a-form :model="exportForm" layout="vertical">
        <a-form-item label="报告类型">
          <a-radio-group v-model:value="exportForm.type">
            <a-radio value="daily">日报</a-radio>
            <a-radio value="weekly">周报</a-radio>
            <a-radio value="monthly">月报</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="包含内容">
          <a-checkbox-group v-model:value="exportForm.content">
            <a-checkbox value="stats">统计数据</a-checkbox>
            <a-checkbox value="trends">趋势图表</a-checkbox>
            <a-checkbox value="activities">活动记录</a-checkbox>
            <a-checkbox value="performance">性能指标</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item label="导出格式">
          <a-radio-group v-model:value="exportForm.format">
            <a-radio value="pdf">PDF</a-radio>
            <a-radio value="excel">Excel</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import * as echarts from "echarts";
import { dashboardApi } from "@/api/modules/admin";
import {
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  HddOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();
const chartRef = ref<HTMLElement>();
const contentChartRef = ref<HTMLElement>();
const chartPeriod = ref("7");
const chartType = ref<"line" | "bar">("line");
const contentChartType = ref<"category" | "status">("category");
let chart: echarts.ECharts | null = null;
let contentChart: echarts.ECharts | null = null;
let isUnmounted = false;
let refreshTimer: NodeJS.Timeout | null = null;

// 状态管理
const refreshing = ref(false);
const exportModalVisible = ref(false);
const exporting = ref(false);

// 统计数据
const statsData = ref([
  {
    key: "news",
    label: "新闻数量",
    value: "0",
    trend: 0,
    color: "#1890ff",
    icon: FileTextOutlined,
  },
  {
    key: "resources",
    label: "资源数量",
    value: "0",
    trend: 0,
    color: "#52c41a",
    icon: FolderOutlined,
  },
  {
    key: "users",
    label: "用户数量",
    value: "0",
    trend: 0,
    color: "#722ed1",
    icon: UserOutlined,
  },
  {
    key: "views",
    label: "总访问量",
    value: "0",
    trend: 0,
    color: "#fa541c",
    icon: EyeOutlined,
  },
]);

// 快捷操作
const quickActions = ref([
  {
    key: "create-news",
    label: "发布新闻",
    type: "primary",
    icon: PlusOutlined,
  },
  {
    key: "upload-resource",
    label: "上传资源",
    type: "default",
    icon: UploadOutlined,
  },
  {
    key: "user-management",
    label: "用户管理",
    type: "default",
    icon: UserOutlined,
  },
  {
    key: "system-settings",
    label: "系统设置",
    type: "default",
    icon: SettingOutlined,
  },
]);

// 最新动态类型定义
interface ActivityItem {
  id: number | string;
  user: {
    username: string;
    avatar: string;
  };
  action: string;
  target: string;
  createdAt: Date;
}

// 最新动态
const recentActivities = ref<ActivityItem[]>([]);

// 系统状态
const systemStatus = ref({
  overall: "healthy" as "healthy" | "warning" | "error",
  items: [
    {
      key: "server",
      label: "服务器状态",
      value: "运行正常",
      status: "healthy" as "healthy" | "warning" | "error",
    },
    {
      key: "database",
      label: "数据库连接",
      value: "连接正常",
      status: "healthy" as "healthy" | "warning" | "error",
    },
    {
      key: "storage",
      label: "存储空间",
      value: "65% (6.5GB/10GB)",
      status: "warning" as "healthy" | "warning" | "error",
    },
    {
      key: "memory",
      label: "内存使用",
      value: "45% (2.3GB/5GB)",
      status: "healthy" as "healthy" | "warning" | "error",
    },
  ],
});

// 性能指标
const performanceMetrics = ref([
  {
    key: "cpu",
    label: "CPU使用率",
    value: "45%",
    percent: 45,
    status: "normal" as "normal" | "exception" | "success",
    color: "#1890ff",
  },
  {
    key: "memory",
    label: "内存使用率",
    value: "60%",
    percent: 60,
    status: "normal",
    color: "#52c41a",
  },
  {
    key: "disk",
    label: "磁盘使用率",
    value: "75%",
    percent: 75,
    status: "exception",
    color: "#fa541c",
  },
  {
    key: "network",
    label: "网络延迟",
    value: "12ms",
    percent: 20,
    status: "success",
    color: "#722ed1",
  },
]);

// 导出表单
const exportForm = ref<{
  type: "daily" | "weekly" | "monthly";
  content: string[];
  format: "pdf" | "excel";
}>({
  type: "daily",
  content: ["stats", "trends"],
  format: "pdf",
});

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await dashboardApi.getStats();
    if (isUnmounted) return;

    if (response.success && response.data) {
      const data = response.data;
      statsData.value = [
        {
          key: "news",
          label: "新闻数量",
          value: data.newsCount?.toString() || "0",
          trend: data.newsGrowth || 0,
          color: "#1890ff",
          icon: FileTextOutlined,
        },
        {
          key: "resources",
          label: "资源数量",
          value: data.resourceCount?.toString() || "0",
          trend: data.resourceGrowth || 0,
          color: "#52c41a",
          icon: FolderOutlined,
        },
        {
          key: "users",
          label: "用户数量",
          value: data.userCount?.toString() || "0",
          trend: data.userGrowth || 0,
          color: "#722ed1",
          icon: UserOutlined,
        },
        {
          key: "views",
          label: "总访问量",
          value: data.totalViews?.toString() || "0",
          trend: data.viewsGrowth || 0,
          color: "#fa541c",
          icon: EyeOutlined,
        },
      ];
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载统计数据失败:", error);
      message.error("加载统计数据失败");
    }
  }
};

// 加载访问量趋势
const loadVisitTrends = async () => {
  try {
    const response = await dashboardApi.getVisitTrends(
      Number(chartPeriod.value)
    );
    if (isUnmounted) return;

    if (response.success && response.data && chart) {
      const data = response.data;
      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: chartType.value === "bar",
          data: data.map((item: any) => item.date),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "访问量",
            type: chartType.value,
            stack: chartType.value === "bar" ? "Total" : undefined,
            smooth: chartType.value === "line",
            areaStyle:
              chartType.value === "line"
                ? {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(24, 144, 255, 0.3)" },
                      { offset: 1, color: "rgba(24, 144, 255, 0.05)" },
                    ]),
                  }
                : undefined,
            lineStyle:
              chartType.value === "line"
                ? {
                    color: "#1890ff",
                  }
                : undefined,
            data: data.map((item: any) => item.visits),
          },
        ],
      };
      chart.setOption(option);
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载访问量趋势失败:", error);
      message.error("加载访问量趋势失败");
    }
  }
};

// 加载内容分布
const loadContentDistribution = async () => {
  try {
    const response = await dashboardApi.getContentDistribution(
      contentChartType.value
    );
    if (isUnmounted) return;

    if (response.success && response.data && contentChart) {
      const data = response.data;
      const option = {
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          left: "left",
        },
        series: [
          {
            name:
              contentChartType.value === "category" ? "分类分布" : "状态分布",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "18",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: data.map((item: any) => ({
              name: item.name,
              value: item.value,
            })),
          },
        ],
      };
      contentChart.setOption(option);
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载内容分布失败:", error);
      message.error("加载内容分布失败");
    }
  }
};

// 加载最新动态
const loadRecentActivities = async () => {
  try {
    const response = await dashboardApi.getRecentActivities();
    if (isUnmounted) return;

    if (response.success && response.data) {
      const items = response.data.items || [];
      recentActivities.value = items.map((item: any) => ({
        id: typeof item.id === "number" ? item.id : Date.now(),
        user: {
          username: item.user?.username || "未知用户",
          avatar: item.user?.avatar || "",
        },
        action: item.action || "未知操作",
        target: item.target || "未知对象",
        createdAt: new Date(item.createdAt || Date.now()),
      }));
    } else {
      console.warn("最新动态API返回异常:", response);
      recentActivities.value = [];
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载最新动态失败:", error);
      // 设置默认动态而不是显示错误消息
      recentActivities.value = [
        {
          id: "default-1",
          user: {
            username: "系统",
            avatar: "",
          },
          action: "系统启动",
          target: "CMS系统",
          createdAt: new Date(),
        },
      ];
    }
  }
};

// 加载系统状态
const loadSystemStatus = async () => {
  try {
    const response = await dashboardApi.getSystemStatus();
    if (isUnmounted) return;

    if (response.success && response.data) {
      systemStatus.value = response.data;
    } else {
      console.warn("系统状态API返回异常:", response);
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载系统状态失败:", error);
      // 设置默认状态而不是显示错误消息
      systemStatus.value = {
        overall: "warning",
        items: [
          {
            key: "server",
            label: "服务器状态",
            value: "检查中...",
            status: "warning",
          },
          {
            key: "database",
            label: "数据库连接",
            value: "检查中...",
            status: "warning",
          },
          {
            key: "storage",
            label: "存储空间",
            value: "检查中...",
            status: "warning",
          },
          {
            key: "memory",
            label: "内存使用",
            value: "检查中...",
            status: "warning",
          },
        ],
      };
    }
  }
};

// 加载性能指标
const loadPerformanceMetrics = async () => {
  try {
    const response = await dashboardApi.getPerformanceMetrics();
    if (isUnmounted) return;

    if (response.success && response.data) {
      performanceMetrics.value = response.data;
    } else {
      console.warn("性能指标API返回异常:", response);
    }
  } catch (error) {
    if (!isUnmounted) {
      console.error("加载性能指标失败:", error);
      // 设置默认指标而不是显示错误消息
      performanceMetrics.value = [
        {
          key: "cpu",
          label: "CPU使用率",
          value: "检查中...",
          percent: 0,
          status: "normal",
          color: "#1890ff",
        },
        {
          key: "memory",
          label: "内存使用率",
          value: "检查中...",
          percent: 0,
          status: "normal",
          color: "#52c41a",
        },
        {
          key: "disk",
          label: "磁盘使用率",
          value: "检查中...",
          percent: 0,
          status: "normal",
          color: "#fa541c",
        },
        {
          key: "network",
          label: "网络延迟",
          value: "检查中...",
          percent: 0,
          status: "normal",
          color: "#722ed1",
        },
      ];
    }
  }
};

// 刷新数据
const refreshData = async () => {
  refreshing.value = true;
  try {
    await Promise.all([
      loadStats(),
      loadVisitTrends(),
      loadContentDistribution(),
      loadRecentActivities(),
      loadSystemStatus(),
      loadPerformanceMetrics(),
    ]);
    message.success("数据刷新成功");
  } catch (error) {
    message.error("数据刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// 导出数据
const exportData = () => {
  exportModalVisible.value = true;
};

// 处理导出
const handleExport = async () => {
  exporting.value = true;
  try {
    const response = await dashboardApi.exportReport(exportForm.value);
    if (response.success) {
      message.success("报告导出成功");
      exportModalVisible.value = false;
    }
  } catch (error) {
    message.error("报告导出失败");
  } finally {
    exporting.value = false;
  }
};

// 切换图表类型
const toggleChartType = () => {
  chartType.value = chartType.value === "line" ? "bar" : "line";
  loadVisitTrends();
};

// 处理快捷操作
const handleQuickAction = (key: string) => {
  switch (key) {
    case "create-news":
      router.push("/admin/news/create");
      break;
    case "upload-resource":
      router.push("/admin/resources/create");
      break;
    case "user-management":
      router.push("/admin/users/list");
      break;
    case "system-settings":
      router.push("/admin/settings");
      break;
  }
};

// 查看全部动态
const viewAllActivities = () => {
  router.push("/admin/activities");
};

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return `${days}天前`;
  }
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
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
      data: [],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "访问量",
        type: "line",
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(24, 144, 255, 0.3)" },
            { offset: 1, color: "rgba(24, 144, 255, 0.05)" },
          ]),
        },
        lineStyle: {
          color: "#1890ff",
        },
        data: [],
      },
    ],
  };
  chart.setOption(option);
};

// 初始化内容分布图表
const initContentChart = () => {
  if (!contentChartRef.value) return;
  contentChart = echarts.init(contentChartRef.value);
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "内容分布",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [],
      },
    ],
  };
  contentChart.setOption(option);
};

// 监听图表周期变化
watch(chartPeriod, () => {
  loadVisitTrends();
});

// 监听内容图表类型变化
watch(contentChartType, () => {
  loadContentDistribution();
});

// 组件挂载时初始化
onMounted(async () => {
  isUnmounted = false;
  initChart();
  initContentChart();

  await Promise.all([
    loadStats(),
    loadVisitTrends(),
    loadContentDistribution(),
    loadRecentActivities(),
    loadSystemStatus(),
    loadPerformanceMetrics(),
  ]);

  // 设置自动刷新（每5分钟）
  refreshTimer = setInterval(
    () => {
      if (!isUnmounted) {
        loadStats();
        loadSystemStatus();
        loadPerformanceMetrics();
      }
    },
    5 * 60 * 1000
  );

  window.addEventListener("resize", handleResize);
});

// 组件卸载前清理
onBeforeUnmount(() => {
  isUnmounted = true;
  if (chart) {
    chart.dispose();
    chart = null;
  }
  if (contentChart) {
    contentChart.dispose();
    contentChart = null;
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  window.removeEventListener("resize", handleResize);
});

const handleResize = () => {
  if (chart) {
    chart.resize();
  }
  if (contentChart) {
    contentChart.resize();
  }
};
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #f0f0f0;

  .header-left {
    h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
      color: #262626;
    }

    p {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #8c8c8c;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;

  &.trend-up {
    color: #52c41a;
  }

  &.trend-down {
    color: #ff4d4f;
  }

  &.trend-neutral {
    color: #8c8c8c;
  }

  .trend-period {
    color: #bfbfbf;
    font-weight: normal;
  }
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.content-left,
.content-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-card,
.activity-card,
.quick-actions-card,
.system-status-card,
.performance-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .chart-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.chart-container {
  height: 300px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .empty-state {
    padding: 40px 0;
    text-align: center;
  }
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #fafafa;
  }
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #262626;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.activity-time {
  color: #8c8c8c;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.system-status,
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item,
.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label,
.metric-label {
  color: #8c8c8c;
  font-size: 14px;
}

.status-value,
.metric-value {
  color: #262626;
  font-size: 14px;
  font-weight: 500;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

<!-- declare module 'echarts'; -->
