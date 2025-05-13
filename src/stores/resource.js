// resource.js - 资源管理状态存储
import { defineStore } from "pinia";
import api, { uploadConfig } from "@/utils/api";

export const useResourceStore = defineStore("resource", {
  state: () => ({
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
    getCategoryStats: (state) => state.statistics.categoryCount,

    // 获取精选资源数量
    getFeaturedCount: (state) => state.statistics.featuredCount,

    // 判断是否有选中的资源
    hasSelectedResources: (state) => state.selectedResources.length > 0,
  },

  actions: {
    // 设置加载状态
    setLoading(status) {
      this.loading = status;
    },

    // 获取资源列表
    async fetchResources(params = {}) {
      this.setLoading(true);
      try {
        const queryParams = {
          page: this.pagination.current,
          limit: this.pagination.pageSize,
          ...this.filters,
          ...params,
        };

        const response = await api.get("/api/resources", {
          params: queryParams,
        });
        this.resources = response.data;
        this.pagination.total = response.total;
        return response;
      } catch (error) {
        console.error("获取资源列表失败:", error);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // 获取单个资源详情
    async fetchResourceById(id) {
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
    async createResource(resourceData) {
      try {
        const response = await api.post("/api/resources", resourceData);
        return response.data;
      } catch (error) {
        console.error("创建资源失败:", error);
        throw error;
      }
    },

    // 更新资源
    async updateResource(id, resourceData) {
      try {
        const response = await api.put(`/api/resources/${id}`, resourceData);
        return response.data;
      } catch (error) {
        console.error("更新资源失败:", error);
        throw error;
      }
    },

    // 删除资源
    async deleteResource(id) {
      try {
        await api.delete(`/api/resources/${id}`);
        return true;
      } catch (error) {
        console.error("删除资源失败:", error);
        throw error;
      }
    },

    // 上传资源文件
    async uploadFile(file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await api.post(uploadConfig.uploadUrl, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        console.error("文件上传失败:", error);
        throw error;
      }
    },

    // 更新筛选条件
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      this.pagination.current = 1; // 重置页码
      return this.fetchResources();
    },

    // 更新排序方式
    updateSort(sortBy, sortOrder = "desc") {
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = sortOrder;
      return this.fetchResources();
    },

    // 获取资源统计信息
    async fetchResourceStats() {
      try {
        const response = await api.get("/api/resources/stats");
        this.statistics = response.data;
        return response.data;
      } catch (error) {
        console.error("获取资源统计信息失败:", error);
        throw error;
      }
    },

    // 切换资源选择状态
    toggleResourceSelection(resourceId) {
      const index = this.selectedResources.indexOf(resourceId);
      if (index === -1) {
        this.selectedResources.push(resourceId);
      } else {
        this.selectedResources.splice(index, 1);
      }
    },

    // 清空选中的资源
    clearSelection() {
      this.selectedResources = [];
    },

    // 批量删除资源
    async batchDeleteResources() {
      if (!this.selectedResources.length) return;

      try {
        await api.post("/api/resources/batch-delete", {
          ids: this.selectedResources,
        });
        this.clearSelection();
        return this.fetchResources();
      } catch (error) {
        console.error("批量删除资源失败:", error);
        throw error;
      }
    },

    // 批量更新资源状态
    async batchUpdateResources(updateData) {
      if (!this.selectedResources.length) return;

      try {
        await api.post("/api/resources/batch-update", {
          ids: this.selectedResources,
          ...updateData,
        });
        this.clearSelection();
        return this.fetchResources();
      } catch (error) {
        console.error("批量更新资源失败:", error);
        throw error;
      }
    },

    // 重置所有筛选条件
    resetFilters() {
      this.filters = {
        category: null,
        search: "",
        featured: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      this.pagination.current = 1;
      return this.fetchResources();
    },

    // 异常处理方法
    handleError(error) {
      console.error("资源操作失败:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "操作失败";
      // 这里可以集成with 全局的通知系统
      console.error(errorMessage);
      throw error;
    },
  },
});
