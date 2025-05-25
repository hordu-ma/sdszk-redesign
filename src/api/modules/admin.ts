import { BaseApi } from '../base'
import type { ApiResponse, PaginatedResponse } from '../types'

// 分页参数接口
interface PaginationParams {
  page?: number
  limit?: number
}

// 仪表板统计数据接口
export interface DashboardStats {
  newsCount: number
  resourceCount: number
  userCount: number
  totalViews: number
  newsGrowth: number
  resourceGrowth: number
  userGrowth: number
  viewsGrowth: number
}

// 访问量趋势数据接口
export interface VisitTrend {
  date: string
  visits: number
}

// 最新动态接口
export interface RecentActivity {
  id: number
  user: {
    id: number
    username: string
    avatar?: string
  }
  action: string
  target: string
  targetType: 'news' | 'resource' | 'user' | 'system'
  createdAt: string
}

// 系统信息接口
export interface SystemInfo {
  version: string
  serverStatus: 'online' | 'offline' | 'maintenance'
  databaseStatus: 'connected' | 'disconnected' | 'error'
  storageUsed: number
  storageTotal: number
  storagePercent: number
}

// Create a concrete subclass of BaseApi for instantiation and expose public API methods
class DashboardApi extends BaseApi {
  // 获取仪表板统计数据
  public getStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get('/admin/dashboard/stats')
  }

  // 获取访问量趋势
  public getVisitTrends(period: number = 7): Promise<ApiResponse<VisitTrend[]>> {
    return this.get('/admin/dashboard/visit-trends', {
      params: { period },
    })
  }

  // 获取最新动态
  public getRecentActivities(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<RecentActivity>>> {
    return this.get('/admin/dashboard/activities', { params })
  }

  // 获取系统信息
  public getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    return this.get('/admin/dashboard/system-info')
  }
}

export const dashboardApi = new DashboardApi()
