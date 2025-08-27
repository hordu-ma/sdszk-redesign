import api from "@/utils/api";
import { apiCache } from "@/utils/apiCache";
import type { QueryParams, ApiResponse } from "./api.types";

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export abstract class BaseService<T> {
  constructor(
    protected endpoint: string,
    protected useCache = true,
    protected defaultCacheOptions: CacheOptions = {},
  ) {}

  protected getCacheKey(key: string, params?: Record<string, any>): string {
    const base = `${this.endpoint}:${key}`;
    return params ? `${base}:${JSON.stringify(params)}` : base;
  }

  protected getCached<R>(key: string, params?: Record<string, any>): R | null {
    if (!this.useCache) return null;
    return apiCache.get<R>(this.getCacheKey(key, params));
  }

  protected cacheResponse<R>(
    key: string,
    response: ApiResponse<R>,
    params?: Record<string, any>,
  ) {
    if (!this.useCache) return;
    const cacheKey = this.getCacheKey(key, params);
    apiCache.set(cacheKey, response, {
      params,
      tags: [this.endpoint, key],
      ...this.defaultCacheOptions,
    });
  }

  protected deleteCached(key: string, params?: Record<string, any>) {
    if (!this.useCache) return;
    apiCache.delete(this.getCacheKey(key, params));
  }

  async getAll(params?: QueryParams): Promise<ApiResponse<T[]>> {
    const cacheKey = "list";
    const cached = this.getCached<ApiResponse<T[]>>(cacheKey, params);
    if (cached) return cached;

    const response = await api.get(this.endpoint, { params });
    const apiResponse: ApiResponse<T[]> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    };

    this.cacheResponse(cacheKey, apiResponse, params);
    return apiResponse;
  }

  async get(id: string | number): Promise<ApiResponse<T>> {
    const cacheKey = `${id}`;
    const cached = this.getCached<ApiResponse<T>>(cacheKey);
    if (cached) return cached;

    const response = await api.get(`${this.endpoint}/${id}`);
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    };

    this.cacheResponse(cacheKey, apiResponse);
    return apiResponse;
  }

  async create(
    data: Partial<T> | FormData,
    options = {},
  ): Promise<ApiResponse<T>> {
    const response = await api.post(this.endpoint, data, options);
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    };

    if (this.useCache) {
      apiCache.deleteByTag(this.endpoint);
    }

    return apiResponse;
  }

  async update(id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    const response = await api.put(`${this.endpoint}/${id}`, data);
    const apiResponse: ApiResponse<T> = {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
    };

    if (this.useCache) {
      this.deleteCached(`${id}`);
      apiCache.deleteByTag(this.endpoint);
    }

    return apiResponse;
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.endpoint}/${id}`);
    const apiResponse: ApiResponse<void> = {
      success: response.status >= 200 && response.status < 300,
      data: void 0,
      message: response.statusText,
    };

    if (this.useCache) {
      this.deleteCached(`${id}`);
      apiCache.deleteByTag(this.endpoint);
    }

    return apiResponse;
  }

  clearCache(): void {
    if (this.useCache) {
      apiCache.deleteByPattern(`^${this.endpoint}:`);
    }
  }

  toggleCache(enabled: boolean): void {
    this.useCache = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  updateCacheOptions(options: CacheOptions): void {
    this.defaultCacheOptions = {
      ...this.defaultCacheOptions,
      ...options,
    };
  }
}
