<template>
  <div class="admin-dashboard">
    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsData" :key="stat.key">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div
            class="stat-trend"
            :class="{ 'trend-up': stat.trend > 0, 'trend-down': stat.trend < 0 }"
          >
            <ArrowUpOutlined v-if="stat.trend > 0" />
            <ArrowDownOutlined v-if="stat.trend < 0" />
            <span>{{ Math.abs(stat.trend) }}%</span>
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
            <a-select v-model:value="chartPeriod" style="width: 120px">
              <a-select-option value="7">近7天</a-select-option>
              <a-select-option value="30">近30天</a-select-option>
              <a-select-option value="90">近90天</a-select-option>
            </a-select>
          </div>
          <div class="chart-container" ref="chartRef"></div>
        </div>

        <!-- 最新动态 -->
        <div class="activity-card">
          <div class="card-header">
            <h3>最新动态</h3>
            <a-button type="link" @click="viewAllActivities">查看全部</a-button>
          </div>
          <div class="activity-list">
            <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
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
                <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
              </div>
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

        <!-- 系统信息 -->
        <div class="system-info-card">
          <div class="card-header">
            <h3>系统信息</h3>
          </div>
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">系统版本：</span>
              <span class="info-value">v1.0.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务器状态：</span>
              <a-tag color="green">运行正常</a-tag>
            </div>
            <div class="info-item">
              <span class="info-label">数据库状态：</span>
              <a-tag color="green">连接正常</a-tag>
            </div>
            <div class="info-item">
              <span class="info-label">存储空间：</span>
              <span class="info-value">65% (6.5GB/10GB)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
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
} from '@ant-design/icons-vue'

const router = useRouter()
const chartRef = ref<HTMLElement>()
const chartPeriod = ref('7')

// 统计数据
const statsData = ref([
  {
    key: 'news',
    label: '新闻数量',
    value: '1,234',
    trend: 12.5,
    color: '#1890ff',
    icon: FileTextOutlined,
  },
  {
    key: 'resources',
    label: '资源数量',
    value: '856',
    trend: 8.2,
    color: '#52c41a',
    icon: FolderOutlined,
  },
  {
    key: 'users',
    label: '用户数量',
    value: '2,468',
    trend: 15.8,
    color: '#722ed1',
    icon: UserOutlined,
  },
  {
    key: 'views',
    label: '总访问量',
    value: '98.6K',
    trend: -2.1,
    color: '#fa541c',
    icon: EyeOutlined,
  },
])

// 快捷操作
const quickActions = ref([
  { key: 'create-news', label: '发布新闻', type: 'primary', icon: PlusOutlined },
  { key: 'upload-resource', label: '上传资源', type: 'default', icon: UploadOutlined },
  { key: 'user-management', label: '用户管理', type: 'default', icon: UserOutlined },
  { key: 'system-settings', label: '系统设置', type: 'default', icon: SettingOutlined },
])

// 最新动态
const recentActivities = ref([
  {
    id: 1,
    user: { username: '张三', avatar: '' },
    action: '发布了新闻',
    target: '《关于加强思政课建设的通知》',
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10分钟前
  },
  {
    id: 2,
    user: { username: '李四', avatar: '' },
    action: '上传了资源',
    target: '思政课教学课件.pptx',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
  },
  {
    id: 3,
    user: { username: '王五', avatar: '' },
    action: '修改了用户',
    target: '赵六的权限设置',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1小时前
  },
])

// 处理快捷操作
const handleQuickAction = (key: string) => {
  switch (key) {
    case 'create-news':
      router.push('/admin/news/create')
      break
    case 'upload-resource':
      router.push('/admin/resources/create')
      break
    case 'user-management':
      router.push('/admin/users/list')
      break
    case 'system-settings':
      router.push('/admin/settings')
      break
  }
}

// 查看全部动态
const viewAllActivities = () => {
  // 实现查看全部动态的逻辑
  message.info('功能开发中...')
}

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  const chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ]),
        },
        lineStyle: {
          color: '#1890ff',
        },
        data: [1200, 1320, 1010, 1340, 900, 1230, 1100],
      },
    ],
  }

  chart.setOption(option)

  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  initChart()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
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
.system-info-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
    color: #333;
  }
}

.chart-container {
  height: 300px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.activity-time {
  color: #999;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
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
}
</style>

<!-- declare module 'echarts'; -->
