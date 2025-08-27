import { BaseApi } from "../base";
import type { ApiResponse, PaginatedResponse } from "../types";

// 分页参数接口
interface PaginationParams {
  page?: number;
  limit?: number;
}

// 仪表板统计数据接口
export interface DashboardStats {
  newsCount: number;
  resourceCount: number;
  userCount: number;
  totalViews: number;
  newsGrowth: number;
  resourceGrowth: number;
  userGrowth: number;
  viewsGrowth: number;
}

// 访问量趋势数据接口
export interface VisitTrend {
  date: string;
  visits: number;
}

// 内容分布数据接口
export interface ContentDistribution {
  name: string;
  value: number;
  percentage: number;
}

// 最新动态接口
export interface RecentActivity {
  id: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  action: string;
  target: string;
  targetType: "news" | "resource" | "user" | "system";
  createdAt: string;
}

// 系统状态接口
export interface SystemStatus {
  overall: "healthy" | "warning" | "error";
  items: Array<{
    key: string;
    label: string;
    value: string;
    status: "healthy" | "warning" | "error";
  }>;
}

// 性能指标接口
export interface PerformanceMetric {
  key: string;
  label: string;
  value: string;
  percent: number;
  status: "normal" | "exception" | "success";
  color: string;
}

// 系统信息接口
export interface SystemInfo {
  version: string;
  serverStatus: "online" | "offline" | "maintenance";
  databaseStatus: "connected" | "disconnected" | "error";
  storageUsed: number;
  storageTotal: number;
  storagePercent: number;
}

// 导出报告参数接口
export interface ExportReportParams {
  type: "daily" | "weekly" | "monthly";
  content: string[];
  format: "pdf" | "excel";
}

// Create a concrete subclass of BaseApi for instantiation and expose public API methods
class DashboardApi extends BaseApi {
  constructor() {
    super(""); // 调用父类构造函数，不需要前缀因为我们在方法中指定完整路径
  }

  // 获取仪表板统计数据
  public getStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get("/admin/dashboard/stats");
  }

  // 获取访问量趋势
  public getVisitTrends(
    period: number = 7,
  ): Promise<ApiResponse<VisitTrend[]>> {
    return this.get("/admin/dashboard/visit-trends", {
      params: { period },
    });
  }

  // 获取内容分布
  public getContentDistribution(
    type: "category" | "status",
  ): Promise<ApiResponse<ContentDistribution[]>> {
    return this.get("/admin/dashboard/content-distribution", {
      params: { type },
    });
  }

  // 获取最新动态
  public getRecentActivities(
    params?: PaginationParams,
  ): Promise<ApiResponse<{ items: RecentActivity[] }>> {
    return this.get("/admin/dashboard/activities", { params });
  }

  // 获取系统状态
  public getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return this.get("/admin/dashboard/system-status");
  }

  // 获取性能指标
  public getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetric[]>> {
    return this.get("/admin/dashboard/performance-metrics");
  }

  // 获取系统信息
  public getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    return this.get("/admin/dashboard/system-info");
  }

  // 导出报告
  public exportReport(
    params: ExportReportParams,
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.post("/admin/dashboard/export-report", params);
  }
}

export const dashboardApi = new DashboardApi();
