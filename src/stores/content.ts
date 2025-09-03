// content.ts - 内容状态管理
import { defineStore } from "pinia";
import api, { ApiResponse } from "../utils/api";
import { NEWS_ENDPOINTS, RESOURCE_ENDPOINTS } from "../constants/api-endpoints";

interface NewsState {
  loading: boolean;
  items: any[];
  total: number;
  page: number;
  limit: number;
  filters: {
    category: string;
    status: string;
    search: string;
  };
}

interface ResourcesState {
  loading: boolean;
  items: any[];
  total: number;
  page: number;
  limit: number;
  filters: {
    category: string;
    fileType: string;
    search: string;
  };
}

interface ActivitiesState {
  loading: boolean;
  items: any[];
  total: number;
  page: number;
  limit: number;
  filters: {
    category: string;
    status: string;
    search: string;
  };
}

interface CategoriesState {
  news: any[];
  resources: any[];
  activities: any[];
}

interface ContentState {
  news: NewsState;
  resources: ResourcesState;
  activities: ActivitiesState;
  categories: CategoriesState;
  settings: Record<string, any>;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger: boolean;
  pageSizeOptions: string[];
}

export const useContentStore = defineStore("content", {
  state: (): ContentState => ({
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
    newsPagination: (state): PaginationState => ({
      current: state.news.page,
      pageSize: state.news.limit,
      total: state.news.total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),

    resourcesPagination: (state): PaginationState => ({
      current: state.resources.page,
      pageSize: state.resources.limit,
      total: state.resources.total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),

    activitiesPagination: (state): PaginationState => ({
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
    setLoading(
      module: "news" | "resources" | "activities",
      status: boolean,
    ): void {
      this[module].loading = status;
    },

    // 新闻相关操作
    async fetchNews(params: Record<string, any> = {}): Promise<void> {
      this.setLoading("news", true);
      try {
        const response = await api.get<any, ApiResponse<any[]>>("/news", {
          params,
        });
        this.news.items = response.data;
        this.news.total = response.total || 0;
      } catch (error) {
        console.error("获取新闻列表失败:", error);
      } finally {
        this.setLoading("news", false);
      }
    },

    async createNews(newsData: Record<string, any>): Promise<any> {
      try {
        const response = await api.post(NEWS_ENDPOINTS.CREATE, newsData);
        return response.data;
      } catch (error) {
        console.error("创建新闻失败:", error);
        throw error;
      }
    },

    async updateNews(
      id: string | number,
      newsData: Record<string, any>,
    ): Promise<any> {
      try {
        const response = await api.put(
          NEWS_ENDPOINTS.UPDATE(id.toString()),
          newsData,
        );
        return response.data;
      } catch (error) {
        console.error("更新新闻失败:", error);
        throw error;
      }
    },

    async deleteNews(id: string | number): Promise<boolean> {
      try {
        await api.delete(NEWS_ENDPOINTS.DELETE(id.toString()));
        return true;
      } catch (error) {
        console.error("删除新闻失败:", error);
        throw error;
      }
    },

    // 资源相关操作
    async fetchResources(params: Record<string, any> = {}): Promise<void> {
      this.setLoading("resources", true);
      try {
        const response = await api.get<any, ApiResponse<any[]>>(
          RESOURCE_ENDPOINTS.LIST,
          {
            params,
          },
        );
        this.resources.items = response.data;
        this.resources.total = response.total || 0;
      } catch (error) {
        console.error("获取资源列表失败:", error);
      } finally {
        this.setLoading("resources", false);
      }
    },

    async createResource(resourceData: Record<string, any>): Promise<any> {
      try {
        const response = await api.post(
          RESOURCE_ENDPOINTS.CREATE,
          resourceData,
        );
        return response.data;
      } catch (error) {
        console.error("创建资源失败:", error);
        throw error;
      }
    },

    async updateResource(
      id: string | number,
      resourceData: Record<string, any>,
    ): Promise<any> {
      try {
        const response = await api.put(
          RESOURCE_ENDPOINTS.UPDATE(id.toString()),
          resourceData,
        );
        return response.data;
      } catch (error) {
        console.error("更新资源失败:", error);
        throw error;
      }
    },

    async deleteResource(id: string | number): Promise<boolean> {
      try {
        await api.delete(RESOURCE_ENDPOINTS.DELETE(id.toString()));
        return true;
      } catch (error) {
        console.error("删除资源失败:", error);
        throw error;
      }
    },
  },
});
