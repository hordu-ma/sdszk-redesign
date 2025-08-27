import type { ApiResponse, PaginatedResponse, QueryParams } from "../../types";
import { BaseApi } from "../../base";

export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  cover?: string;
  author?: string;
  category?: string;
  tags?: string[];
  publishDate?: string;
  status: "draft" | "published" | "archived";
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsDTO extends Partial<News> {
  title: string;
  content: string;
}

export interface UpdateNewsDTO extends Partial<News> {}

export interface NewsQueryParams extends QueryParams {
  category?: string;
  status?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
}

export class NewsApi extends BaseApi {
  constructor() {
    super({ prefix: "/news" });
  }

  // 获取新闻列表
  async getList(params?: NewsQueryParams): Promise<PaginatedResponse<News>> {
    console.log("📤 NewsApi.getList 调用参数:", params);
    const response = await this.get<News[]>("", { params });
    console.log("📥 NewsApi.getList 响应:", response);
    return {
      ...response,
      data: response.data,
      pagination: response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
      },
    };
  }

  // 获取新闻详情
  async getDetail(id: string): Promise<ApiResponse<News>> {
    return await this.get<News>(`/${id}`);
  }

  // 创建新闻
  async create(data: CreateNewsDTO): Promise<ApiResponse<News>> {
    return await this.post<News>("", data);
  }

  // 更新新闻
  async update(id: string, data: UpdateNewsDTO): Promise<ApiResponse<News>> {
    return await this.put<News>(`/${id}`, data);
  }

  // 删除新闻
  async delete(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`);
  }

  // 更改新闻状态
  async updateStatus(
    id: string,
    status: News["status"],
  ): Promise<ApiResponse<News>> {
    return await this.patch<News>(`/${id}/status`, { status });
  }

  // 获取新闻分类
  async getCategories(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>("/categories");
  }

  // 获取新闻标签
  async getTags(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>("/tags");
  }
}
