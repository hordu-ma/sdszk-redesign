// api.d.ts - API 类型声明文件
import { AxiosInstance } from "axios";

// 定义API响应的通用接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
  [key: string]: any;
}

// 扩展axios实例类型，确保返回的是ApiResponse
interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = ApiResponse<T>>(url: string, config?: any): Promise<R>;
  post<T = any, R = ApiResponse<T>>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<R>;
  put<T = any, R = ApiResponse<T>>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<R>;
  delete<T = any, R = ApiResponse<T>>(url: string, config?: any): Promise<R>;
  patch<T = any, R = ApiResponse<T>>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<R>;
}

declare const api: CustomAxiosInstance;

export interface UploadConfig {
  uploadUrl: string;
  assetsUrl: string;
}

export const uploadConfig: UploadConfig;

export default api;
