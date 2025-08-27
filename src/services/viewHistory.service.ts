// 浏览历史业务逻辑包装器
import { viewHistoryApi } from "@/api/modules/viewHistory";
import type {
  ViewHistory,
  HistoryStats,
  PopularContent,
  RecommendedContent,
  ViewHistoryParams,
} from "@/api/modules/viewHistory";

// 记录浏览历史
export const recordView = async (data: {
  resourceType: "news" | "resource" | "activity";
  resourceId: string;
  resourceTitle: string;
  resourceUrl: string;
  viewDuration?: number;
}) => {
  const response = await viewHistoryApi.instance.recordView(data);
  return response;
};

// 更新浏览时长
export const updateViewDuration = async (
  historyId: string,
  duration: number,
) => {
  const response = await viewHistoryApi.instance.updateViewDuration(
    historyId,
    duration,
  );
  return response;
};

// 获取浏览历史列表
export const getViewHistory = async (
  params?: ViewHistoryParams & { keyword?: string },
) => {
  const { keyword, ...apiParams } = params || {};
  const response = await viewHistoryApi.instance.getViewHistory(apiParams);

  // 如果有关键词，在客户端进行筛选
  if (response.success && response.data.histories && keyword) {
    response.data.histories = response.data.histories.filter((item) =>
      item.resourceTitle.toLowerCase().includes(keyword.toLowerCase()),
    );
    response.data.total = response.data.histories.length;
  }

  return {
    data: response.data.histories,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: response.data.totalPages,
  };
};

// 获取浏览历史统计
export const getHistoryStats = async (days?: number) => {
  const response = await viewHistoryApi.instance.getHistoryStats({ days });
  return {
    success: response.success,
    data: response.data,
  };
};

// 获取热门内容
export const getPopularContent = async (params?: {
  limit?: number;
  days?: number;
  resourceType?: "news" | "resource" | "activity";
}) => {
  const response = await viewHistoryApi.instance.getPopularContent(params);
  return {
    success: response.success,
    data: response.data,
  };
};

// 获取推荐内容
export const getRecommendedContent = async (limit?: number) => {
  const response = await viewHistoryApi.instance.getRecommendedContent({
    limit,
  });
  return {
    success: response.success,
    data: response.data,
  };
};

// 删除浏览历史
export const deleteHistory = async (historyId: string) => {
  const response = await viewHistoryApi.instance.deleteViewHistory(historyId);
  return response;
};

// 批量删除浏览历史
export const batchDeleteHistory = async (historyIds: string[]) => {
  const response = await viewHistoryApi.instance.batchDeleteHistory(historyIds);
  return response;
};

// 清空浏览历史
export const clearAllHistory = async () => {
  const response = await viewHistoryApi.instance.clearAllHistory();
  return response;
};

// 导出浏览历史
export const exportHistory = async (params?: {
  format?: "json" | "csv" | "excel";
  startDate?: string;
  endDate?: string;
  resourceType?: "news" | "resource" | "activity";
}) => {
  return await viewHistoryApi.instance.exportHistory(params);
};
