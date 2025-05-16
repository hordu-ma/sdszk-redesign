// dashboard.ts - 仪表盘状态管理
import { defineStore } from "pinia";
import api, { ApiResponse } from "../utils/api";

interface OverviewCount {
  total: number;
  today: number;
}

interface DashboardOverview {
  users: OverviewCount;
  news: OverviewCount;
  resources: OverviewCount;
  activities: OverviewCount;
}

interface DashboardState {
  loading: boolean;
  overview: DashboardOverview;
  activityTrend: any[];
  recentActivities: any[];
}

export const useDashboardStore = defineStore("dashboard", {
  state: (): DashboardState => ({
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
    setLoading(status: boolean): void {
      this.loading = status;
    },

    // 获取仪表盘概览数据
    async fetchOverview(): Promise<void> {
      this.setLoading(true);
      try {
        const response = await api.get<any, ApiResponse>(
          "/api/dashboard/overview"
        );
        if (response && response.success) {
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
    async fetchRecentActivities(): Promise<void> {
      try {
        const response = await api.get<any, ApiResponse>(
          "/api/dashboard/recent-activities"
        );
        if (response && response.success) {
          this.recentActivities = response.data;
        }
      } catch (error) {
        console.error("获取最近活动失败:", error);
        throw error;
      }
    },
  },
});
