// resource.ts - 资源管理状态存储
import { defineStore } from "pinia";
import api, { ApiResponse } from "../utils/api";

interface ResourcePagination {
  total: number;
  current: number;
  pageSize: number;
}

interface ResourceFilters {
  category: string | null;
  search: string;
  featured: boolean;
  sortBy: string;
  sortOrder: string;
}

interface ResourceStatistics {
  totalCount: number;
  categoryCount: Record<string, number>;
  featuredCount: number;
}

interface ResourceState {
  resources: any[];
  currentResource: any | null;
  loading: boolean;
  pagination: ResourcePagination;
  filters: ResourceFilters;
  statistics: ResourceStatistics;
  selectedResources: any[];
}

export const useResourceStore = defineStore("resource", {
  state: (): ResourceState => ({
    resources: [],
    currentResource: null,
    loading: false,
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
    filters: {
      category: null,
      search: "",
      featured: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    statistics: {
      totalCount: 0,
      categoryCount: {},
      featuredCount: 0,
    },
    selectedResources: [],
  }),

  getters: {
    // 获取资源分类统计
    getCategoryStats: (state): Record<string, number> =>
      state.statistics.categoryCount,

    // 获取精选资源数量
    getFeaturedCount: (state): number => state.statistics.featuredCount,

    // 判断是否有选中的资源
    hasSelectedResources: (state): boolean =>
      state.selectedResources.length > 0,
  },

  actions: {
    // 设置加载状态
    setLoading(status: boolean): void {
      this.loading = status;
    },

    // 获取资源列表
    async fetchResources(params: Record<string, any> = {}): Promise<any> {
      this.setLoading(true);
      try {
        const queryParams = {
          page: this.pagination.current,
          limit: this.pagination.pageSize,
          ...this.filters,
          ...params,
        };

        const response = await api.get<any[], ApiResponse<any[]>>(
          "/api/resources",
          {
            params: queryParams,
          }
        );
        this.resources = response.data;
        this.pagination.total = response.total || 0;
        return response;
      } catch (error) {
        console.error("获取资源列表失败:", error);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取单个资源详情
    async fetchResourceById(id: string | number): Promise<any> {
      this.setLoading(true);
      try {
        const response = await api.get(`/api/resources/${id}`);
        this.currentResource = response.data;
        return response.data;
      } catch (error) {
        console.error("获取资源详情失败:", error);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 创建新资源
    async createResource(resourceData: Record<string, any>): Promise<any> {
      try {
        const response = await api.post("/api/resources", resourceData);
        return response.data;
      } catch (error) {
        console.error("创建资源失败:", error);
        throw error;
      }
    },

    // 更新资源
    async updateResource(
      id: string | number,
      resourceData: Record<string, any>
    ): Promise<any> {
      try {
        const response = await api.put(`/api/resources/${id}`, resourceData);
        return response.data;
      } catch (error) {
        console.error("更新资源失败:", error);
        throw error;
      }
    },

    // 删除资源
    async deleteResource(id: string | number): Promise<boolean> {
      try {
        await api.delete(`/api/resources/${id}`);
        return true;
      } catch (error) {
        console.error("删除资源失败:", error);
        throw error;
      }
    },

    // 批量删除资源
    async batchDeleteResources(ids: (string | number)[]): Promise<boolean> {
      try {
        await api.post("/api/resources/batch-delete", { ids });
        return true;
      } catch (error) {
        console.error("批量删除资源失败:", error);
        throw error;
      }
    },

    // 切换资源精选状态
    async toggleFeatured(id: string | number, featured: boolean): Promise<any> {
      try {
        const response = await api.patch(`/api/resources/${id}/featured`, {
          featured,
        });
        return response.data;
      } catch (error) {
        console.error("更改资源精选状态失败:", error);
        throw error;
      }
    },

    // 更新选中的资源列表
    setSelectedResources(resources: any[]): void {
      this.selectedResources = resources;
    },

    // 清除选中的资源
    clearSelectedResources(): void {
      this.selectedResources = [];
    },

    // 更新筛选条件
    setFilters(filters: Partial<ResourceFilters>): void {
      this.filters = { ...this.filters, ...filters };
    },

    // 重置筛选条件
    resetFilters(): void {
      this.filters = {
        category: null,
        search: "",
        featured: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    },

    // 更新分页信息
    setPagination(pagination: Partial<ResourcePagination>): void {
      this.pagination = { ...this.pagination, ...pagination };
    },
  },
});
