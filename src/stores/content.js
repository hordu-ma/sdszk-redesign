// content.js - 内容状态管理
import { defineStore } from "pinia";
import api from "@/utils/api";

export const useContentStore = defineStore("content", {
  state: () => ({
    // 资讯模块
    news: {
      loading: false,
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      filters: {
        category: "",
        status: "",
        search: "",
      },
    },

    // 资源模块
    resources: {
      loading: false,
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      filters: {
        category: "",
        fileType: "",
        search: "",
      },
    },

    // 活动模块
    activities: {
      loading: false,
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      filters: {
        category: "",
        status: "",
        search: "",
      },
    },

    // 分类数据
    categories: {
      news: [],
      resources: [],
      activities: [],
    },

    // 系统设置
    settings: {},
  }),

  getters: {
    newsPagination: (state) => ({
      current: state.news.page,
      pageSize: state.news.limit,
      total: state.news.total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),

    resourcesPagination: (state) => ({
      current: state.resources.page,
      pageSize: state.resources.limit,
      total: state.resources.total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),

    activitiesPagination: (state) => ({
      current: state.activities.page,
      pageSize: state.activities.limit,
      total: state.activities.total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),

    newsCategories: (state) => {
      return state.categories.news;
    },

    resourceCategories: (state) => {
      return state.categories.resources;
    },
  },

  actions: {
    // 通用加载状态处理
    setLoading(module, status) {
      this[module].loading = status;
    },

    // 新闻相关操作
    async fetchNews(params = {}) {
      this.setLoading("news", true);
      try {
        const response = await api.get("/api/news", { params });
        this.news.items = response.data;
        this.news.total = response.total;
      } catch (error) {
        console.error("获取新闻列表失败:", error);
      } finally {
        this.setLoading("news", false);
      }
    },

    async createNews(newsData) {
      try {
        const response = await api.post("/api/news", newsData);
        return response.data;
      } catch (error) {
        console.error("创建新闻失败:", error);
        throw error;
      }
    },

    async updateNews(id, newsData) {
      try {
        const response = await api.put(`/api/news/${id}`, newsData);
        return response.data;
      } catch (error) {
        console.error("更新新闻失败:", error);
        throw error;
      }
    },

    async deleteNews(id) {
      try {
        await api.delete(`/api/news/${id}`);
        return true;
      } catch (error) {
        console.error("删除新闻失败:", error);
        throw error;
      }
    },

    // 资源相关操作
    async fetchResources(params = {}) {
      this.setLoading("resources", true);
      try {
        const response = await api.get("/api/resources", { params });
        this.resources.items = response.data;
        this.resources.total = response.total;
      } catch (error) {
        console.error("获取资源列表失败:", error);
      } finally {
        this.setLoading("resources", false);
      }
    },

    async createResource(resourceData) {
      try {
        const response = await api.post("/api/resources", resourceData);
        return response.data;
      } catch (error) {
        console.error("创建资源失败:", error);
        throw error;
      }
    },

    async updateResource(id, resourceData) {
      try {
        const response = await api.put(`/api/resources/${id}`, resourceData);
        return response.data;
      } catch (error) {
        console.error("更新资源失败:", error);
        throw error;
      }
    },

    async deleteResource(id) {
      try {
        await api.delete(`/api/resources/${id}`);
        return true;
      } catch (error) {
        console.error("删除资源失败:", error);
        throw error;
      }
    },
  },
});
