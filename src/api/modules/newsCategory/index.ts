import { BaseApi } from "../../base";
import { ApiResponse } from "../../types";
import { withCache } from "@/utils/apiCache";

export interface NewsCategory {
  _id: string;
  name: string;
  key: string;
  description: string;
  order: number;
  color: string;
  icon?: string;
  isActive: boolean;
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsCategoryDTO {
  name: string;
  key: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface UpdateNewsCategoryDTO extends Partial<CreateNewsCategoryDTO> {
  isActive?: boolean;
}

export class NewsCategoryApi extends BaseApi {
  static list(): { data: any } | PromiseLike<{ data: any }> {
    throw new Error("Method not implemented.");
  }
  constructor() {
    super({ prefix: "/news-categories" });
  }

  // 获取所有分类
  async getList(params?: {
    includeInactive?: boolean;
  }): Promise<ApiResponse<NewsCategory[]>> {
    const response = await this.get<NewsCategory[]>("", params);
    return response;
  }

  // 获取核心分类
  async getCoreCategories(options?: {
    forceRefresh?: boolean;
  }): Promise<ApiResponse<NewsCategory[]>> {
    const forceRefresh = options?.forceRefresh || false;
    return await withCache<ApiResponse<NewsCategory[]>>(
      "/news-categories/cores",
      () => this.get<NewsCategory[]>("/core"),
      {
        ttl: 10 * 60 * 1000, // 10分钟缓存
        tags: ["news-categories", "core-categories"],
        forceRefresh,
      }
    );
  }

  // 获取单个分类
  async getById(id: string): Promise<ApiResponse<NewsCategory>> {
    return await this.get<NewsCategory>(`/${id}`);
  }

  // 创建分类
  async create(
    data: CreateNewsCategoryDTO
  ): Promise<ApiResponse<NewsCategory>> {
    return await this.post<NewsCategory>("", data);
  }

  // 更新分类
  async update(
    id: string,
    data: UpdateNewsCategoryDTO
  ): Promise<ApiResponse<NewsCategory>> {
    return await this.put<NewsCategory>(`/${id}`, data);
  }

  // 删除分类
  async delete(id: string): Promise<ApiResponse<void>> {
    return await this.delete(`/${id}`);
  }

  // 更新分类排序
  async updateOrder(
    categories: { id: string; order: number }[]
  ): Promise<ApiResponse<void>> {
    return await this.post<void>("/reorder", { categories });
  }
}
