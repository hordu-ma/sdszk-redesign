import { api } from "../base";
import type { ApiResponse, PaginatedResponse } from "../types";

// 分页参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 新闻表单数据接口
export interface NewsFormData {
  title: string;
  content: string;
  summary?: string;
  category: string; // ✅ 修复：改为string类型以匹配ObjectId
  featuredImage?: string;
  tags?: string[];
  status: "draft" | "published" | "archived";
  isTop?: boolean;
  isFeatured?: boolean;
  publishTime?: string;
}

// 新闻列表项接口
export interface NewsItem {
  _id: string;
  id: string; // 兼容性：保留id字段
  title: string;
  summary: string;
  content: string;
  category: string | { _id: string; name: string }; // ✅ 修复：支持ObjectId和populate结果
  categoryName: string;
  featuredImage?: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  isTop: boolean;
  isFeatured: boolean;
  views: number;
  viewCount: number;
  author: {
    _id: string; // ✅ 修复：使用ObjectId格式
    username: string;
  };
  publishTime: string;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
}

// 新闻查询参数接口
export interface NewsQueryParams extends PaginationParams {
  keyword?: string;
  category?: string; // ✅ 修复：改为string类型以匹配ObjectId
  status?: "draft" | "published" | "archived";
  isTop?: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
}

export const adminNewsApi = {
  // 获取新闻列表
  getList(
    params?: NewsQueryParams
  ): Promise<ApiResponse<PaginatedResponse<NewsItem>>> {
    // 确保参数始终是有效的对象
    const validParams = params || {};
    // 确保分页参数正确传递
    return api.get("/api/admin/news", {
      params: {
        page: validParams.page || 1,
        limit: validParams.limit || 20,
        keyword: validParams.keyword,
        category: validParams.category,
        status: validParams.status,
        startDate: validParams.startDate,
        endDate: validParams.endDate,
        isTop: validParams.isTop,
        isFeatured: validParams.isFeatured,
      },
    });
  },

  // 获取新闻详情
  getDetail(id: string): Promise<ApiResponse<NewsItem>> {
    return api.get(`/api/admin/news/${id}`);
  },

  // 创建新闻
  create(data: NewsFormData): Promise<ApiResponse<NewsItem>> {
    return api.post("/api/admin/news", data);
  },

  // 更新新闻
  update(
    id: string,
    data: Partial<NewsFormData>
  ): Promise<ApiResponse<NewsItem>> {
    return api.put(`/api/admin/news/${id}`, data);
  },

  // 删除新闻
  delete(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/api/admin/news/${id}`);
  },

  // 批量删除新闻
  batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return api.post("/api/admin/news/batch-delete", { ids });
  },

  // 发布/取消发布新闻
  togglePublish(id: string): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/api/admin/news/${id}/toggle-publish`);
  },

  // 置顶/取消置顶新闻
  toggleTop(id: string): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/api/admin/news/${id}/toggle-top`);
  },

  // 设置/取消精选新闻
  toggleFeatured(id: string): Promise<ApiResponse<NewsItem>> {
    return api.patch(`/api/admin/news/${id}/toggle-featured`);
  },
};
