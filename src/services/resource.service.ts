import { BaseService } from "./base.service";
import type { ApiResponse } from "./api.types";
import type {
  Resource,
  CreateResourceDTO,
  UpdateResourceDTO,
  ResourceQueryParams,
} from "@/api/modules/resources/index";
import { resourceApi } from "@/api";

export { Resource, CreateResourceDTO, UpdateResourceDTO, ResourceQueryParams };

export class ResourceService extends BaseService<Resource> {
  constructor() {
    super("resources");
  }

  // 获取资源列表
  async getList(params?: ResourceQueryParams) {
    const response = await resourceApi.instance.getList(params);
    if (this.useCache) {
      this.cacheResponse("list", response, params);
    }
    return response;
  }

  // 获取资源详情
  async getDetail(id: string): Promise<ApiResponse<Resource>> {
    const cacheKey = `detail:${id}`;
    if (this.useCache) {
      const cached = this.getCached<ApiResponse<Resource>>(cacheKey);
      if (cached) return cached;
    }

    const response = await resourceApi.instance.getDetail(id);
    if (this.useCache) {
      this.cacheResponse(cacheKey, response);
    }
    return response;
  }

  // 创建资源
  async create(data: CreateResourceDTO) {
    const response = await resourceApi.instance.create(data);
    if (this.useCache) {
      this.clearCache();
    }
    return response;
  }

  // 更新资源
  async update(id: string, data: UpdateResourceDTO) {
    const response = await resourceApi.instance.update(id, data);
    if (this.useCache) {
      this.clearCache();
      this.deleteCached(`detail:${id}`);
    }
    return response;
  }

  // 删除资源
  async delete(id: string) {
    const response = await resourceApi.instance.delete(id);
    if (this.useCache) {
      this.clearCache();
      this.deleteCached(`detail:${id}`);
    }
    return response;
  }

  // 更新资源状态
  async updateStatus(id: string, status: Resource["status"]) {
    const response = await resourceApi.instance.updateStatus(id, status);
    if (this.useCache) {
      this.clearCache();
      this.deleteCached(`detail:${id}`);
    }
    return response;
  }

  // 批量删除资源
  async batchDelete(ids: string[]) {
    const response = await resourceApi.instance.batchDelete(ids);
    if (this.useCache) {
      this.clearCache();
    }
    return response;
  }

  // 批量更新资源状态
  async batchUpdateStatus(ids: string[], status: Resource["status"]) {
    const response = await resourceApi.instance.batchUpdateStatus(ids, status);
    if (this.useCache) {
      this.clearCache();
    }
    return response;
  }

  // 更新资源标签
  async updateTags(id: string, tags: string[]) {
    const response = await resourceApi.instance.updateTags(id, tags);
    if (this.useCache) {
      this.clearCache();
    }
    return response;
  }

  // 上传资源
  async upload(
    file: File,
    data: Partial<Resource>,
    onProgress?: (event: any) => void,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await resourceApi.instance.create(formData);
    if (this.useCache) {
      this.clearCache();
    }
    return response;
  }

  // 下载资源
  async download(id: string) {
    return await resourceApi.instance.download(id);
  }

  // 获取分类列表
  async getCategories() {
    const cacheKey = "categories";
    if (this.useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return cached;
    }

    const response = await resourceApi.instance.getCategories();
    if (this.useCache) {
      this.cacheResponse(cacheKey, response);
    }
    return response;
  }

  // 获取标签列表
  async getTags() {
    const cacheKey = "tags";
    if (this.useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return cached;
    }

    const response = await resourceApi.instance.getTags();
    if (this.useCache) {
      this.cacheResponse(cacheKey, response);
    }
    return response;
  }

  // 按类型获取资源
  async getByType(type: Resource["type"]) {
    return this.getList({ type });
  }

  // 按分类获取资源
  async getByCategory(category: string) {
    return this.getList({ category });
  }

  // 评论相关方法
  async getComments(id: string, params?: { page?: number; limit?: number }) {
    return await resourceApi.instance.getComments(id, params);
  }

  async addComment(id: string, data: { content: string; parentId?: string }) {
    return await resourceApi.instance.addComment(id, data);
  }

  async deleteComment(resourceId: string, commentId: string) {
    return await resourceApi.instance.deleteComment(resourceId, commentId);
  }

  // 分享相关方法
  async share(
    id: string,
    data: {
      shareType: "email" | "link" | "wechat";
      recipientEmail?: string;
      message?: string;
    },
  ) {
    return await resourceApi.instance.share(id, data);
  }
}
