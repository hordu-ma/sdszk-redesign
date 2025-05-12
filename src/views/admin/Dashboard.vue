<template>
  <div class="dashboard-container">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><user-outlined /> 用户总数</div>
          </template>
          <div class="card-content">
            <div class="number">2,674</div>
            <div class="desc">较昨日 +12</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><file-text-outlined /> 文章总数</div>
          </template>
          <div class="card-content">
            <div class="number">156</div>
            <div class="desc">较昨日 +3</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><folder-outlined /> 资源数量</div>
          </template>
          <div class="card-content">
            <div class="number">432</div>
            <div class="desc">较昨日 +5</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <div class="card-title"><calendar-outlined /> 近期活动</div>
          </template>
          <div class="card-content">
            <div class="number">8</div>
            <div class="desc">本月进行中</div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card style="margin-top: 16px">
      <template #title>最新动态</template>
      <template #extra>
        <a-radio-group v-model:value="timeRange" button-style="solid">
          <a-radio-button value="week">本周</a-radio-button>
          <a-radio-button value="month">本月</a-radio-button>
          <a-radio-button value="year">全年</a-radio-button>
        </a-radio-group>
      </template>
      <a-timeline>
        <a-timeline-item v-for="item in activities" :key="item.id">
          <template #dot>
            <component :is="item.icon" style="font-size: 16px" />
          </template>
          <div class="timeline-content">
            <div class="timeline-title">{{ item.title }}</div>
            <div class="timeline-time">{{ item.time }}</div>
            <div class="timeline-desc">{{ item.description }}</div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  UserOutlined,
  FileTextOutlined,
  FolderOutlined,
  CalendarOutlined,
} from "@ant-design/icons-vue";

const timeRange = ref("week");

const activities = ref([
  {
    id: 1,
    title: "更新了思政课教学资源",
    time: "2023-05-10 14:30",
    description: "上传了新的教学课件和教案资料，涉及马克思主义基本原理等内容。",
    icon: FolderOutlined,
  },
  {
    id: 2,
    title: "发布了新的通知公告",
    time: "2023-05-09 16:45",
    description: "关于举办2023年度思政课教学创新大赛的通知已发布。",
    icon: FileTextOutlined,
  },
  {
    id: 3,
    title: "新增用户注册",
    time: "2023-05-09 10:20",
    description: "今日新增注册教师用户12名，已完成身份认证。",
    icon: UserOutlined,
  },
  {
    id: 4,
    title: "活动报名开始",
    time: "2023-05-08 09:00",
    description: "大中小学思政课一体化建设研讨会报名通道已开启。",
    icon: CalendarOutlined,
  },
]);
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.card-content {
  text-align: center;
  padding: 8px 0;
}

.card-content .number {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.card-content .desc {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.timeline-content {
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}
</style>
