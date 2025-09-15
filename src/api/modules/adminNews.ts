import { BaseApi } from "../base";
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
  category: string; // 修复：改为string类型以匹配ObjectId
  featuredImage?: string;
  tags?: string[];
  status: "draft" | "published" | "archived";
  isTop?: boolean;
  isFeatured?: boolean;
  publishTime?: any; // 支持dayjs对象或字符串
}

// 新闻列表项接口
export interface NewsItem {
  _id: string;
  id: string; // 兼容性：保留id字段
  title: string;
  summary: string;
  content: string;
  category: string | { _id: string; name: string }; // 修复：支持ObjectId和populate结果
  categoryName: string;
  featuredImage?: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  isTop: boolean;
  isFeatured: boolean;
  views: number;
  viewCount: number;
  author: {
    _id: string; // 修复：使用ObjectId格式
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
  category?: string; // 修复：改为string类型以匹配ObjectId
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

// 新闻 API 类
export class AdminNewsApi extends BaseApi {
  constructor() {
    super("/admin/news"); // 匹配后端路由路径
  }

  // 获取新闻列表
  getList(
    params?: NewsQueryParams,
  ): Promise<ApiResponse<PaginatedResponse<NewsItem>>> {
    return this.get("", { params });
  }

  // 获取新闻详情
  getDetail(id: string): Promise<ApiResponse<NewsItem>> {
    return this.get(`/${id}`);
  }

  // 创建新闻
  create(data: NewsFormData): Promise<ApiResponse<NewsItem>> {
    return this.post("", data);
  }

  // 更新新闻
  update(
    id: string,
    data: Partial<NewsFormData>,
  ): Promise<ApiResponse<NewsItem>> {
    // 处理字段名映射
    const updateData: any = { ...data };
    if (updateData.publishTime) {
      // 如果是dayjs对象，转换为ISO字符串
      updateData.publishDate = updateData.publishTime.toISOString
        ? updateData.publishTime.toISOString()
        : updateData.publishTime;
      delete updateData.publishTime;
    }
    return this.put(`/${id}`, updateData);
  }

  // 删除新闻
  deleteNews(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/${id}`);
  }

  // 批量删除新闻
  batchDelete(ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.post("/batch-delete", { ids });
  }

  // 批量更新状态
  batchUpdateStatus(
    params: BatchUpdateStatusParams,
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return this.post("/batch-update-status", params);
  }

  // 批量更新分类
  batchUpdateCategory(
    params: BatchUpdateCategoryParams,
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return this.post("/batch-update-category", params);
  }

  // 批量添加标签
  batchAddTags(
    params: BatchAddTagsParams,
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return this.post("/batch-add-tags", params);
  }

  // 发布/取消发布新闻
  togglePublish(id: string): Promise<ApiResponse<{ status: string }>> {
    return this.patch(`/${id}/toggle-publish`);
  }

  // 置顶/取消置顶新闻
  toggleTop(id: string): Promise<ApiResponse<{ isTop: boolean }>> {
    return this.patch(`/${id}/toggle-top`);
  }

  // 设置/取消精选新闻
  toggleFeatured(id: string): Promise<ApiResponse<{ isFeatured: boolean }>> {
    return this.patch(`/${id}/toggle-featured`);
  }

  // 获取新闻统计信息
  getStats(): Promise<ApiResponse<NewsStats>> {
    return this.get("/stats/overview");
  }
}

// 导出实例（保持向后兼容）
export const adminNewsApi = new AdminNewsApi();
