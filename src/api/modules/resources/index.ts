import type { ApiResponse, PaginatedResponse, QueryParams } from "../../types";
import { BaseApi } from "../../base";

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  parentComment?: string;
}

export interface Share {
  id: string;
  shareType: "email" | "link" | "wechat";
  sharedBy: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  recipientEmail?: string;
  message?: string;
  shareDate: string;
  status: "pending" | "sent" | "failed";
  accessCount: number;
}

export interface ResourceAuthor {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  affiliation?: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type?: "document" | "video" | "image" | "audio" | "other";
  category?:
    | string
    | {
        id: string;
        key: string;
        name: string;
      };
  categoryId?: string;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  mimeType?: string;
  thumbnail?: string;
  downloadCount?: number;
  viewCount?: number;
  author?: ResourceAuthor | string;
  authorAffiliation?: string;
  publishDate?: string;
  comments?: Comment[];
  shares?: Share[];
  status?: "draft" | "published";
  isFeatured?: boolean;
  featured?: boolean;
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    username: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    username: string;
    name: string;
  };
  data?: any;
}

export interface CreateResourceDTO extends Partial<Resource> {
  title: string;
  type: Resource["type"];
  url: string;
}

export interface UpdateResourceDTO extends Partial<Resource> {}

export interface ResourceQueryParams extends QueryParams {
  type?: string;
  category?: string;
  status?: string;
  tag?: string;
}

export class ResourceApi extends BaseApi {
  constructor() {
    super({ prefix: "/resources" });
  }

  // 获取资源列表
  async getList(
    params?: ResourceQueryParams,
  ): Promise<ApiResponse<Resource[]>> {
    return await this.get<Resource[]>("", { params });
  }

  // 获取资源详情
  async getDetail(id: string): Promise<ApiResponse<Resource>> {
    return await this.get<Resource>(`/${id}`);
  }

  // 创建资源
  async create(
    data: CreateResourceDTO | FormData,
  ): Promise<ApiResponse<Resource>> {
    return await this.post<Resource>("", data);
  }

  // 更新资源
  async update(
    id: string,
    data: UpdateResourceDTO,
  ): Promise<ApiResponse<Resource>> {
    return await this.put<Resource>(`/${id}`, data);
  }

  // 删除资源
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/${id}`);
  }

  // 更新资源状态
  async updateStatus(
    id: string,
    status: Resource["status"],
  ): Promise<ApiResponse<Resource>> {
    return await this.patch<Resource>(`/${id}/status`, { status });
  }

  // 获取资源分类
  async getCategories(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>("/categories");
  }

  // 获取资源标签
  async getTags(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>("/tags");
  }

  // 批量删除资源
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return await this.post<void>("/batch-delete", { ids });
  }

  // 批量更新资源状态
  async batchUpdateStatus(
    ids: string[],
    status: Resource["status"],
  ): Promise<ApiResponse<Resource[]>> {
    return await this.post<Resource[]>("/batch-status", { ids, status });
  }

  // 更新资源标签
  async updateTags(id: string, tags: string[]): Promise<ApiResponse<Resource>> {
    return await this.patch<Resource>(`/${id}/tags`, { tags });
  }

  // 下载资源
  async download(id: string): Promise<Blob> {
    const response = await this.api.get(`${this.prefix}/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  // 分享资源
  async share(
    id: string,
    data: {
      shareType: "email" | "link" | "wechat";
      recipientEmail?: string;
      message?: string;
    },
  ): Promise<ApiResponse<any>> {
    return await this.post(`/${id}/share`, data);
  }

  // 获取评论列表
  async getComments(
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<
    ApiResponse<Comment[]> & {
      pagination?: { total: number; page: number; limit: number };
    }
  > {
    return await this.get(`/${id}/comments`, { params });
  }

  // 添加评论
  async addComment(
    id: string,
    data: { content: string; parentId?: string },
  ): Promise<ApiResponse<any>> {
    return await this.post(`/${id}/comments`, data);
  }

  // 删除评论
  async deleteComment(
    resourceId: string,
    commentId: string,
  ): Promise<ApiResponse<void>> {
    return await this.delete(`/${resourceId}/comments/${commentId}`);
  }
}
