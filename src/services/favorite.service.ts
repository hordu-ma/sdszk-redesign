// 收藏功能业务逻辑包装器
import { favoriteApi } from "@/api/modules/favorite";
import type {
  FavoriteItem,
  FavoriteQueryParams,
  FavoriteStats,
} from "@/api/modules/favorite";

// 获取收藏列表
export const getFavorites = async (
  params: FavoriteQueryParams & { keyword?: string },
) => {
  const { keyword, ...apiParams } = params;
  const response = await favoriteApi.instance.getFavorites(apiParams);

  if (response.success && response.data.favorites && keyword) {
    // 客户端实现关键词过滤，因为服务端API没有提供关键字搜索功能
    response.data.favorites = response.data.favorites.filter(
      (item) =>
        item.itemId.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (item.itemId.description &&
          item.itemId.description
            .toLowerCase()
            .includes(keyword.toLowerCase())) ||
        (item.notes &&
          item.notes.toLowerCase().includes(keyword.toLowerCase())) ||
        (item.tags &&
          item.tags.some((tag) =>
            tag.toLowerCase().includes(keyword.toLowerCase()),
          )),
    );
    response.data.total = response.data.favorites.length;
  }

  return {
    data: response.data.favorites,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: response.data.totalPages,
  };
};

// 删除收藏
export const deleteFavorite = async (itemId: string) => {
  // 此处简化处理，实际可能需要先获取itemType
  const response = await favoriteApi.instance.removeFavorite("news", itemId);
  return response;
};

// 批量删除收藏
export const batchDeleteFavorites = async (favoriteIds: string[]) => {
  const response = await favoriteApi.instance.batchDeleteFavorites(favoriteIds);
  return response;
};

// 更新收藏信息
export const updateFavorite = async (
  id: string,
  data: { category?: string; tags?: string[]; notes?: string },
) => {
  let response = { success: true, data: {} };

  // 更新分类
  if (data.category !== undefined) {
    response = await favoriteApi.instance.updateFavoriteCategory(
      id,
      data.category,
    );
  }

  // 标签和备注更新需要额外实现，这里简化处理
  return response;
};

// 获取收藏统计
export const getFavoriteStats = async () => {
  const response = await favoriteApi.instance.getFavoriteStats();
  return {
    success: response.success,
    data: {
      total: response.data.total,
      news: response.data.byType.find((t: any) => t._id === "news")?.count || 0,
      resources:
        response.data.byType.find((t: any) => t._id === "resource")?.count || 0,
      activities: 0, // 活动类型可能不存在，先设为0
    },
  };
};

// 获取用户收藏分类
export const getCategories = async () => {
  const response = await favoriteApi.instance.getFavoriteStats();
  const categories = response.data.byCategory.map((c: any) => c._id);
  return {
    success: true,
    data: categories,
  };
};

// 创建分类（这需要后端API支持，这里模拟实现）
export const createCategory = async (name: string) => {
  // 模拟实现，实际应该调用API
  return {
    success: true,
    data: name,
  };
};

// 删除分类（这需要后端API支持，这里模拟实现）
export const deleteCategory = async (name: string) => {
  // 模拟实现，实际应该调用API
  return {
    success: true,
  };
};
