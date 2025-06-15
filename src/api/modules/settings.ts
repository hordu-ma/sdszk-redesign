import { BaseApi } from "../base";
import type { ApiResponse } from "../types";

export interface SiteSetting {
  _id: string;
  key: string;
  value: any;
  description?: string;
  group: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  isProtected?: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SettingsGroup {
  [key: string]: SiteSetting[];
}

export interface BulkUpdateSetting {
  key: string;
  value: any;
  description?: string;
  group?: string;
  type?: string;
}

export interface BulkUpdateResult {
  key: string;
  success: boolean;
  message?: string;
  data?: SiteSetting;
}

export class SettingsApi extends BaseApi {
  constructor() {
    super("/settings");
  }

  // 获取所有设置
  async getAllSettings(): Promise<ApiResponse<SettingsGroup>> {
    return this.get("");
  }

  // 获取特定组的设置
  async getSettingsByGroup(group: string): Promise<ApiResponse<SiteSetting[]>> {
    return this.get(`/group/${group}`);
  }

  // 获取单个设置
  async getSettingByKey(key: string): Promise<ApiResponse<SiteSetting>> {
    return this.get(`/${key}`);
  }

  // 更新单个设置
  async updateSetting(
    key: string,
    data: Partial<SiteSetting>
  ): Promise<ApiResponse<SiteSetting>> {
    return this.put(`/${key}`, data);
  }

  // 批量更新设置
  async bulkUpdateSettings(
    settings: BulkUpdateSetting[]
  ): Promise<ApiResponse<{ results: BulkUpdateResult[] }>> {
    return this.put("", { settings });
  }

  // 删除设置
  async deleteSetting(key: string): Promise<ApiResponse<void>> {
    return this.delete(`/${key}`);
  }

  // 重置为默认设置
  async resetToDefault(): Promise<ApiResponse<void>> {
    return this.post("/reset");
  }

  // 获取公开设置
  async getPublicSettings(): Promise<ApiResponse<SettingsGroup>> {
    return this.get("/public");
  }
}

export default SettingsApi;
