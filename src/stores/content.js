// content.js - 内容状态管理
import { defineStore } from "pinia";
import axios from "axios";

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
    /**
     * 加载资讯列表
     * @param {Object} params - 查询参数
     * @param {boolean} resetPage - 是否重置页码
     */
    async fetchNewsList(params = {}, resetPage = false) {
      try {
        this.news.loading = true;

        // 合并查询参数
        const queryParams = {
          page: resetPage ? 1 : this.news.page,
          limit: this.news.limit,
          ...this.news.filters,
          ...params,
        };

        // 更新当前页码
        if (resetPage) {
          this.news.page = 1;
        }

        // 保存过滤条件
        if (params.category !== undefined)
          this.news.filters.category = params.category;
        if (params.status !== undefined)
          this.news.filters.status = params.status;
        if (params.search !== undefined)
          this.news.filters.search = params.search;

        // 发起请求
        const response = await axios.get("/api/news", { params: queryParams });

        // 更新状态
        this.news.items = response.data.data || [];
        this.news.total = response.data.pagination?.total || 0;

        return response.data;
      } catch (error) {
        console.error("加载资讯列表失败:", error);
        throw error;
      } finally {
        this.news.loading = false;
      }
    },

    /**
     * 加载单个资讯详情
     * @param {string} id - 资讯ID
     */
    async fetchNewsDetail(id) {
      try {
        const response = await axios.get(`/api/news/${id}`);
        return response.data?.data;
      } catch (error) {
        console.error("加载资讯详情失败:", error);
        throw error;
      }
    },

    /**
     * 创建资讯
     * @param {Object} newsData - 资讯数据
     */
    async createNews(newsData) {
      try {
        const response = await axios.post("/api/news", newsData);
        return response.data?.data;
      } catch (error) {
        console.error("创建资讯失败:", error);
        throw error;
      }
    },

    /**
     * 更新资讯
     * @param {string} id - 资讯ID
     * @param {Object} newsData - 资讯数据
     */
    async updateNews(id, newsData) {
      try {
        const response = await axios.patch(`/api/news/${id}`, newsData);
        return response.data?.data;
      } catch (error) {
        console.error("更新资讯失败:", error);
        throw error;
      }
    },

    /**
     * 删除资讯
     * @param {string} id - 资讯ID
     */
    async deleteNews(id) {
      try {
        const response = await axios.delete(`/api/news/${id}`);
        return response.data?.success;
      } catch (error) {
        console.error("删除资讯失败:", error);
        throw error;
      }
    },

    /**
     * 切换资讯发布状态
     * @param {string} id - 资讯ID
     */
    async toggleNewsPublishStatus(id) {
      try {
        const response = await axios.patch(`/api/news/${id}/publish`);
        return response.data?.data;
      } catch (error) {
        console.error("切换资讯发布状态失败:", error);
        throw error;
      }
    },

    /**
     * 加载资源列表
     * @param {Object} params - 查询参数
     * @param {boolean} resetPage - 是否重置页码
     */
    async fetchResourcesList(params = {}, resetPage = false) {
      try {
        this.resources.loading = true;

        // 合并查询参数
        const queryParams = {
          page: resetPage ? 1 : this.resources.page,
          limit: this.resources.limit,
          ...this.resources.filters,
          ...params,
        };

        // 更新当前页码
        if (resetPage) {
          this.resources.page = 1;
        }

        // 保存过滤条件
        if (params.category !== undefined)
          this.resources.filters.category = params.category;
        if (params.fileType !== undefined)
          this.resources.filters.fileType = params.fileType;
        if (params.search !== undefined)
          this.resources.filters.search = params.search;

        // 发起请求
        const response = await axios.get("/api/resources", {
          params: queryParams,
        });

        // 更新状态
        this.resources.items = response.data.data || [];
        this.resources.total = response.data.pagination?.total || 0;

        return response.data;
      } catch (error) {
        console.error("加载资源列表失败:", error);
        throw error;
      } finally {
        this.resources.loading = false;
      }
    },

    /**
     * 加载活动列表
     * @param {Object} params - 查询参数
     * @param {boolean} resetPage - 是否重置页码
     */
    async fetchActivitiesList(params = {}, resetPage = false) {
      try {
        this.activities.loading = true;

        // 合并查询参数
        const queryParams = {
          page: resetPage ? 1 : this.activities.page,
          limit: this.activities.limit,
          ...this.activities.filters,
          ...params,
        };

        // 更新当前页码
        if (resetPage) {
          this.activities.page = 1;
        }

        // 保存过滤条件
        if (params.category !== undefined)
          this.activities.filters.category = params.category;
        if (params.status !== undefined)
          this.activities.filters.status = params.status;
        if (params.search !== undefined)
          this.activities.filters.search = params.search;

        // 发起请求
        const response = await axios.get("/api/activities", {
          params: queryParams,
        });

        // 更新状态
        this.activities.items = response.data.data || [];
        this.activities.total = response.data.pagination?.total || 0;

        return response.data;
      } catch (error) {
        console.error("加载活动列表失败:", error);
        throw error;
      } finally {
        this.activities.loading = false;
      }
    },

    /**
     * 加载资讯分类
     */
    async fetchNewsCategories() {
      try {
        // 判断是否已经加载过
        if (this.categories.news.length > 0) {
          return this.categories.news;
        }

        // 加载分类
        const response = await axios.get("/api/news/categories");
        this.categories.news = response.data?.data || [];

        return this.categories.news;
      } catch (error) {
        console.error("加载资讯分类失败:", error);
        throw error;
      }
    },

    /**
     * 加载资源分类
     */
    async fetchResourceCategories() {
      try {
        // 判断是否已经加载过
        if (this.categories.resources.length > 0) {
          return this.categories.resources;
        }

        // 加载分类
        const response = await axios.get("/api/resources/categories");
        this.categories.resources = response.data?.data || [];

        return this.categories.resources;
      } catch (error) {
        console.error("加载资源分类失败:", error);
        throw error;
      }
    },

    /**
     * 加载活动分类
     */
    async fetchActivityCategories() {
      try {
        // 判断是否已经加载过
        if (this.categories.activities.length > 0) {
          return this.categories.activities;
        }

        // 活动可能没有单独的分类API，使用静态分类
        this.categories.activities = [
          { id: "academic", name: "学术讲座" },
          { id: "training", name: "教师培训" },
          { id: "conference", name: "会议论坛" },
          { id: "competition", name: "比赛活动" },
          { id: "other", name: "其他活动" },
        ];

        return this.categories.activities;
      } catch (error) {
        console.error("加载活动分类失败:", error);
        throw error;
      }
    },

    /**
     * 加载系统设置
     * @param {string} group - 设置组名
     */
    async fetchSettings(group = null) {
      try {
        let url = "/api/settings";
        if (group) {
          url = `/api/settings/group/${group}`;
        }

        const response = await axios.get(url);
        if (group) {
          this.settings[group] = response.data?.data || {};
        } else {
          this.settings = response.data?.data || {};
        }

        return response.data?.data;
      } catch (error) {
        console.error("加载系统设置失败:", error);
        throw error;
      }
    },

    /**
     * 加载公开设置
     */
    async fetchPublicSettings() {
      try {
        const response = await axios.get("/api/settings/public");
        return response.data?.data;
      } catch (error) {
        console.error("加载公开设置失败:", error);
        throw error;
      }
    },
  },
});
