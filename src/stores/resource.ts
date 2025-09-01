// resource.ts - 资源管理状态存储
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Resource,
  ResourceQueryParams,
} from "@/services/resource.service";
import { useRecentlyViewed } from "@/composables/useRecentlyViewed";

// 定义资源类型
import type { ResourceCategory } from "@/api/modules/resourceCategory/index";
type ResourceStatus = "draft" | "published";

// 筛选器类型
interface ResourceFilters {
  category: ResourceCategory["_id"] | "";
  type: Resource["type"] | "";
  keyword: string;
  status: ResourceStatus | "";
  tags: string[];
}

// 定义查询类型
interface ResourceQuery extends ResourceQueryParams {
  page?: number;
  limit?: number;
}

import type { Resource as ResourceType } from "@/api/modules/resources/index";
import { ResourceService } from "@/services/resource.service";

export const useResourceStore = defineStore("resource", () => {
  const resourceService = new ResourceService();
  // 状态
  const loading = ref(false);
  const items = ref<Resource[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(10);
  const currentResource = ref<Resource | null>(null);
  const selectedResources = ref<Resource[]>([]);

  // 最近下载的资源
  const { items: recentlyDownloaded, addItem: addToRecentlyDownloaded } =
    useRecentlyViewed<Resource>("recently-downloaded-resources");

  // 筛选条件
  const filters = ref<ResourceFilters>({
    category: "",
    type: "",
    keyword: "",
    status: "",
    tags: [],
  });

  // 计算属性
  const pagination = computed(() => ({
    current: page.value,
    pageSize: limit.value,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
  }));

  const hasSelected = computed(() => selectedResources.value.length > 0);

  // 新增的计算属性
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const hasMore = computed(() => page.value * limit.value < total.value);
  const isEmpty = computed(() => items.value.length === 0);

  // 方法
  const fetchList = async (query?: Partial<ResourceQuery>) => {
    try {
      loading.value = true;
      const { data, pagination: pager } = await resourceService.getList({
        page: page.value,
        limit: limit.value,
        ...filters.value,
        ...query,
      });
      items.value = data;
      if (pager) {
        total.value = pager.total;
        page.value = pager.page;
        limit.value = pager.limit;
      }
    } catch (error) {
      console.error("获取资源列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchById = async (id: string) => {
    try {
      loading.value = true;
      const { data } = await resourceService.getDetail(id);
      currentResource.value = data;
      return data;
    } catch (error) {
      console.error("获取资源详情失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const upload = async (
    file: File,
    data: Partial<Resource>,
    onProgress?: (percent: number) => void,
  ) => {
    const response = await resourceService.upload(file, data, (event) => {
      if (event.total && onProgress) {
        onProgress((event.loaded * 100) / event.total);
      }
    });
    await fetchList();
    return response;
  };

  const download = async (id: string) => {
    const response = await resourceService.download(id);

    // 更新下载历史
    const resource = items.value.find((item) => item.id === id);
    if (resource) {
      addToRecentlyDownloaded(resource);
    }

    return response;
  };

  const update = async (id: string, data: Partial<Resource>) => {
    const response = await resourceService.update(id, data);
    await fetchList();
    return response;
  };

  const remove = async (id: string) => {
    await resourceService.delete(id);
    await fetchList();
  };

  const batchDelete = async (ids: string[]) => {
    await resourceService.batchDelete(ids);
    selectedResources.value = [];
    await fetchList();
  };

  const batchUpdateStatus = async (ids: string[], status: ResourceStatus) => {
    await resourceService.batchUpdateStatus(ids, status);
    await fetchList();
  };

  const updateTags = async (id: string, tags: string[]) => {
    await resourceService.updateTags(id, tags);
    await fetchList();
  };

  const setPage = async (newPage: number) => {
    page.value = newPage;
    await fetchList();
  };

  const setLimit = async (newLimit: number) => {
    limit.value = newLimit;
    page.value = 1;
    await fetchList();
  };

  const setFilters = async (newFilters: typeof filters.value) => {
    filters.value = { ...newFilters };
    page.value = 1;
    await fetchList();
  };

  const resetFilters = async () => {
    filters.value = {
      category: "",
      type: "",
      keyword: "",
      status: "",
      tags: [],
    };
    page.value = 1;
    await fetchList();
  };

  const toggleSelection = (resource: Resource) => {
    const index = selectedResources.value.findIndex(
      (item) => item.id === resource.id,
    );
    if (index > -1) {
      selectedResources.value.splice(index, 1);
    } else {
      selectedResources.value.push(resource);
    }
  };

  const clearSelection = () => {
    selectedResources.value = [];
  };

  // 评论相关方法
  const getComments = async (
    id: string,
    params?: { page?: number; limit?: number },
  ) => {
    return await resourceService.getComments(id, params);
  };

  const addComment = async (
    id: string,
    data: { content: string; parentId?: string },
  ) => {
    return await resourceService.addComment(id, data);
  };

  const deleteComment = async (resourceId: string, commentId: string) => {
    return await resourceService.deleteComment(resourceId, commentId);
  };

  // 分享相关方法
  const share = async (
    id: string,
    data: {
      shareType: "email" | "link" | "wechat";
      recipientEmail?: string;
      message?: string;
    },
  ) => {
    return await resourceService.share(id, data);
  };

  return {
    // 状态
    loading,
    items,
    total,
    page,
    limit,
    filters,
    currentResource,
    selectedResources,
    recentlyDownloaded,
    pagination,
    hasSelected,
    totalPages,
    hasMore,
    isEmpty,

    // 方法
    fetchList,
    fetchById,
    upload,
    download,
    update,
    remove,
    batchDelete,
    batchUpdateStatus,
    updateTags,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
    toggleSelection,
    clearSelection,

    // 评论相关
    getComments,
    addComment,
    deleteComment,

    // 分享相关
    share,
  };
});
