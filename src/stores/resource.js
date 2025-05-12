// resource.js - 资源管理状态存储
import { defineStore } from "pinia";
import axios from "axios";

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
    },
  }),

  actions: {
    // 获取资源列表
    async fetchResources(params = {}) {
      try {
        this.loading = true;
        const { data } = await axios.get("/api/resources", {
          params: {
            page: this.pagination.current,
            limit: this.pagination.pageSize,
            ...this.filters,
            ...params,
          },
        });

        this.resources = data.data;
        this.pagination.total = data.pagination.total;
        return data;
      } catch (error) {
        console.error("获取资源列表失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取单个资源
    async fetchResourceById(id) {
      try {
        const { data } = await axios.get(`/api/resources/${id}`);
        this.currentResource = data;
        return data;
      } catch (error) {
        console.error("获取资源详情失败:", error);
        throw error;
      }
    },

    // 创建资源
    async createResource(resourceData) {
      try {
        const { data } = await axios.post("/api/resources", resourceData);
        return data;
      } catch (error) {
        console.error("创建资源失败:", error);
        throw error;
      }
    },

    // 更新资源
    async updateResource(id, resourceData) {
      try {
        const { data } = await axios.put(`/api/resources/${id}`, resourceData);
        return data;
      } catch (error) {
        console.error("更新资源失败:", error);
        throw error;
      }
    },

    // 删除资源
    async deleteResource(id) {
      try {
        await axios.delete(`/api/resources/${id}`);
        // 从列表中移除
        this.resources = this.resources.filter((item) => item._id !== id);
      } catch (error) {
        console.error("删除资源失败:", error);
        throw error;
      }
    },

    // 设置筛选条件
    setFilters(filters) {
      this.filters = {
        ...this.filters,
        ...filters,
      };
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        category: null,
        search: "",
        featured: false,
      };
      this.pagination.current = 1;
    },

    // 设置分页
    setPagination(pagination) {
      this.pagination = {
        ...this.pagination,
        ...pagination,
      };
    },

    // 清空状态
    clearState() {
      this.resources = [];
      this.currentResource = null;
      this.loading = false;
      this.resetFilters();
    },
  },
});
