// user.ts - 用户相关API
import { BaseApi } from "../base";
import type { ApiResponse } from "../types";

// 用户信息接口
export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  role: "admin" | "editor" | "user";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  status?: "active" | "inactive";
  bio?: string;
  location?: string;
  gender?: "male" | "female" | "secret";
  birthday?: string;
}

// 用户统计信息接口
export interface UserStats {
  favoriteStats: Array<{
    _id: string;
    count: number;
  }>;
  viewStats: Array<{
    _id: string;
    totalViews: number;
    uniqueItemCount: number;
  }>;
  recentViews: Array<{
    _id: string;
    itemType: string;
    itemId: {
      _id: string;
      title: string;
    };
    lastViewedAt: string;
  }>;
  recentFavorites: Array<{
    _id: string;
    itemType: string;
    itemId: {
      _id: string;
      title: string;
    };
    createdAt: string;
  }>;
}

// 活动日志接口
export interface ActivityLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: string;
}

// 更新个人信息请求接口
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
}

// 修改密码请求接口
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 用户API类
export class UserApi extends BaseApi {
  // 获取当前用户信息
  getMe(): Promise<ApiResponse<{ user: UserProfile }>> {
    return this.get("/users/me");
  }

  // 更新个人信息
  updateProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<{ user: UserProfile }>> {
    return this.patch("/users/me", data);
  }

  // 修改密码
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.patch("/users/update-password", data);
  }

  // 上传头像
  uploadAvatar(
    formData: FormData,
  ): Promise<ApiResponse<{ user: UserProfile; avatarUrl: string }>> {
    return this.request<{ user: UserProfile; avatarUrl: string }>({
      method: "POST",
      url: "/users/upload-avatar",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // 获取用户统计信息
  getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.get("/users/stats");
  }

  // 获取用户活动日志
  getActivityLog(params?: { page?: number; limit?: number }): Promise<
    ApiResponse<{
      activities: ActivityLog[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    return this.get("/users/activity-log", { params });
  }

  // 删除账号
  deleteAccount(password: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: "DELETE",
      url: "/users/delete-account",
      data: { password },
    });
  }
}

// 导出用户API实例
export const userApi = new UserApi();
