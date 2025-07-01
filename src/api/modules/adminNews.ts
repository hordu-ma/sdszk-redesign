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

// 新闻查询参数接口（增强版）
export interface NewsQueryParams extends PaginationParams {
  keyword?: string;
  category?: string; // ✅ 修复：改为string类型以匹配ObjectId
  status?: "draft" | "published" | "archived";
  author?: string;
  tags?: string[];
  viewRange?: string;
  createDateRange?: [string, string];
  publishDateRange?: [string, string];
  sortBy?: "createdAt" | "publishDate" | "viewCount" | "title";
  features?: string[];
  contentTypes?: string[];
  isTop?: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
}

// 批量操作参数接口
export interface BatchUpdateStatusParams {
  ids: string[];
  status: "draft" | "published" | "archived";
}

export interface BatchUpdateCategoryParams {
  ids: string[];
  category: string;
}

export interface BatchAddTagsParams {
  ids: string[];
  tags: string[];
}

// 新闻统计信息接口
export interface NewsStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  avgViews: number;
}

export const adminNewsApi = {
  // 获取新闻列表（增强版）
  getList(
    params?: NewsQueryParams
  ): Promise<ApiResponse<PaginatedResponse<NewsItem>>> {
    // 确保参数始终是有效的对象
    const validParams = params || {};

    // 构建查询参数
    const queryParams: any = {
      page: validParams.page || 1,
      limit: validParams.limit || 20,
      keyword: validParams.keyword,
      category: validParams.category,
      status: validParams.status,
      author: validParams.author,
      viewRange: validParams.viewRange,
      sortBy: validParams.sortBy || "publishDate",
    };

    // 处理数组参数
    if (validParams.tags && validParams.tags.length > 0) {
      queryParams.tags = validParams.tags.join(",");
    }
    if (validParams.features && validParams.features.length > 0) {
      queryParams.features = validParams.features.join(",");
    }
    if (validParams.contentTypes && validParams.contentTypes.length > 0) {
      queryParams.contentTypes = validParams.contentTypes.join(",");
    }

    // 处理日期范围
    if (
      validParams.createDateRange &&
      validParams.createDateRange.length === 2
    ) {
      queryParams.createDateRange = validParams.createDateRange.join(",");
    }
    if (
      validParams.publishDateRange &&
      validParams.publishDateRange.length === 2
    ) {
      queryParams.publishDateRange = validParams.publishDateRange.join(",");
    }

    // 兼容旧参数
    if (validParams.startDate) queryParams.startDate = validParams.startDate;
    if (validParams.endDate) queryParams.endDate = validParams.endDate;
    if (validParams.isTop !== undefined) queryParams.isTop = validParams.isTop;
    if (validParams.isFeatured !== undefined)
      queryParams.isFeatured = validParams.isFeatured;

    return api.get("/admin/news", { params: queryParams });
  },

  // 获取新闻详情
  getDetail(id: string): Promise<ApiResponse<NewsItem>> {
    return api.get(`/admin/news/${id}`);
  },

  // 创建新闻
  create(data: NewsFormData): Promise<ApiResponse<NewsItem>> {
    return api.post("/admin/news", data);
  },

  // 更新新闻
  update(
    id: string,
    data: Partial<NewsFormData>
  ): Promise<ApiResponse<NewsItem>> {
    return api.put(`/admin/news/${id}`, data);
  },

  // 删除新闻
  delete(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/admin/news/${id}`);
  },

  // 批量删除新闻
  batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return api.post("/admin/news/batch-delete", { ids });
  },

  // 批量更新新闻状态
  batchUpdateStatus(
    params: BatchUpdateStatusParams
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return api.post("/admin/news/batch-update-status", params);
  },

  // 批量更新新闻分类
  batchUpdateCategory(
    params: BatchUpdateCategoryParams
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return api.post("/admin/news/batch-update-category", params);
  },

  // 批量添加标签
  batchAddTags(
    params: BatchAddTagsParams
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return api.post("/admin/news/batch-add-tags", params);
  },

  // 发布/取消发布新闻
  togglePublish(id: string): Promise<ApiResponse<{ status: string }>> {
    return api.patch(`/admin/news/${id}/toggle-publish`);
  },

  // 置顶/取消置顶新闻
  toggleTop(id: string): Promise<ApiResponse<{ isTop: boolean }>> {
    return api.patch(`/admin/news/${id}/toggle-top`);
  },

  // 设置/取消精选新闻
  toggleFeatured(id: string): Promise<ApiResponse<{ isFeatured: boolean }>> {
    return api.patch(`/admin/news/${id}/toggle-featured`);
  },

  // 获取新闻统计信息
  getStats(): Promise<ApiResponse<NewsStats>> {
    return api.get("/admin/news/stats/overview");
  },
};
