// dashboard.js - 仪表盘状态管理
import { defineStore } from "pinia";
import api from "@/utils/api";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    loading: false,
    overview: {
      users: { total: 0, today: 0 },
      news: { total: 0, today: 0 },
      resources: { total: 0, today: 0 },
      activities: { total: 0, today: 0 },
    },
    activityTrend: [],
    recentActivities: [],
  }),

  actions: {
    setLoading(status) {
      this.loading = status;
    },

    // 获取仪表盘概览数据
    async fetchOverview() {
      this.setLoading(true);
      try {
        const response = await api.get("/api/dashboard/overview");
        if (response.success) {
          this.overview = response.data.overview;
          this.activityTrend = response.data.activityTrend;
        }
      } catch (error) {
        console.error("获取仪表盘概览数据失败:", error);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取最近活动
    async fetchRecentActivities() {
      try {
        const response = await api.get("/api/dashboard/recent-activities");
        if (response.success) {
          this.recentActivities = response.data;
        }
      } catch (error) {
        console.error("获取最近活动失败:", error);
        throw error;
      }
    },
  },
});
