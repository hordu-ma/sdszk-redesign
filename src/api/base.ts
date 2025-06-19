import type { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import type { ApiModuleConfig, ApiResponse, QueryParams } from "./types";
import api from "@/utils/conditionalApi"; // 使用条件API，自动适应GitHub Pages环境
import type { ApiErrorResponse } from "@/types/error.types";
import { handleApiError } from "@/utils/apiErrorHandler";

export abstract class BaseApi {
  protected api: AxiosInstance;
  protected baseURL: string;
  protected prefix: string;

  constructor(config: ApiModuleConfig | string = {}) {
    this.api = api;
    if (typeof config === "string") {
      this.baseURL = "";
      this.prefix = config;
    } else {
      this.baseURL = config.baseURL || "";
      this.prefix = config.prefix || "";
    }
  }

  protected getUrl(path: string): string {
    // 不再自动添加/api前缀，因为Nginx已配置将/api转发到后端，且后端路由已包含/api
    return `${this.prefix}${path}`;
  }

  protected async request<T>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = config.url?.startsWith("/api")
        ? config.url
        : this.getUrl(config.url || "");

      console.log("🌐 API 请求:", {
        method: config.method,
        url: fullUrl,
        params: config.params,
        data: config.data,
      });

      const response = await this.api.request<any, any>({
        ...config,
        url: fullUrl,
      });

      console.log("📡 API 响应:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });

      // 返回response.data，这才是真正的API响应数据
      return response.data;
    } catch (error) {
      console.error("❌ API 请求失败:", {
        url: config.url,
        error: error,
        response: (error as any)?.response,
      });

      if (error instanceof Error) {
        return handleApiError(error as AxiosError<ApiErrorResponse>);
      }
      throw error;
    }
  }

  protected async get<T>(
    path: string,
    params?: QueryParams
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "GET",
      url: path,
      params,
    });
  }

  protected async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "POST",
      url: path,
      data,
    });
  }

  protected async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PUT",
      url: path,
      data,
    });
  }

  protected async delete(path: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: "DELETE",
      url: path,
    });
  }

  protected async patch<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PATCH",
      url: path,
      data,
    });
  }
}

export { api };
