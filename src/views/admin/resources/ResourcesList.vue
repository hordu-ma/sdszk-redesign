<template>
  <div class="resources-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>资源管理</h2>
        <p>管理教学资源、文档资料等内容</p>
      </div>
      <div class="header-right">
        <a-button
          type="primary"
          @click="$router.push('/admin/resources/create')"
        >
          <template #icon>
            <plus-outlined />
          </template>
          新建资源
        </a-button>
      </div>
    </div>

    <!-- 搜索过滤器 -->
    <div class="filters-container">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input
            v-model:value="filters.keyword"
            placeholder="搜索资源标题或内容"
            allow-clear
            @change="handleSearch"
          >
            <template #prefix>
              <search-outlined />
            </template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.categoryId"
            placeholder="选择分类"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.status"
            placeholder="状态"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="published"> 已发布 </a-select-option>
            <a-select-option value="draft"> 草稿 </a-select-option>
            <a-select-option value="archived"> 归档 </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.type"
            placeholder="资源类型"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="document"> 文档 </a-select-option>
            <a-select-option value="video"> 视频 </a-select-option>
            <a-select-option value="image"> 图片 </a-select-option>
            <a-select-option value="audio"> 音频 </a-select-option>
            <a-select-option value="other"> 其他 </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-range-picker
            v-model:value="filters.dateRange"
            style="width: 100%"
            @change="handleSearch"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRowKeys.length > 0" class="batch-actions">
      <a-space>
        <span>已选择 {{ selectedRowKeys.length }} 项</span>
        <a-button size="small" @click="handleBatchPublish"> 批量发布 </a-button>
        <a-button size="small" @click="handleBatchArchive"> 批量归档 </a-button>
        <a-popconfirm
          title="确定要删除选中的资源吗？"
          @confirm="handleBatchDelete"
        >
          <a-button size="small" danger> 批量删除 </a-button>
        </a-popconfirm>
      </a-space>
    </div>

    <!-- 资源列表 -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="resources"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="resource-title">
              <a @click="handlePreview(record)">{{ record.title }}</a>
              <div class="resource-meta">
                <a-tag size="small" :color="getTypeColor(record.type)">
                  {{ getTypeText(record.type) }}
                </a-tag>
                <span class="author">{{ record.author?.name }}</span>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'category'">
            <a-tag v-if="record.category" :color="record.category.color">
              {{ record.category.name }}
            </a-tag>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'stats'">
            <div class="stats-cell">
              <span class="stat-item">
                <eye-outlined />
                {{ record.viewCount || 0 }}
              </span>
              <span class="stat-item">
                <download-outlined />
                {{ record.downloadCount || 0 }}
              </span>
            </div>
          </template>

          <template v-if="column.key === 'publishDate'">
            {{ formatDate(record.publishDate) }}
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-dropdown>
                <a-button type="link" size="small">
                  更多
                  <down-outlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="handleMenuClick($event, record)">
                    <a-menu-item key="preview">
                      <eye-outlined />
                      预览
                    </a-menu-item>
                    <a-menu-item key="download">
                      <download-outlined />
                      下载
                    </a-menu-item>
                    <a-menu-item
                      v-if="record.status !== 'published'"
                      key="publish"
                    >
                      <check-outlined />
                      发布
                    </a-menu-item>
                    <a-menu-item
                      v-if="record.status === 'published'"
                      key="archive"
                    >
                      <inbox-outlined />
                      归档
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" class="danger-action">
                      <delete-outlined />
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewResource?.title"
      :footer="null"
      width="800px"
    >
      <div v-if="previewResource" class="resource-preview">
        <div class="preview-meta">
          <a-space>
            <a-tag :color="getTypeColor(previewResource.type || 'other')">
              {{ getTypeText(previewResource.type || "other") }}
            </a-tag>
            <span>作者：{{ previewResource.author?.name }}</span>
            <span>发布时间：{{
              formatDate(previewResource.publishDate || "")
            }}</span>
          </a-space>
        </div>
        <div class="preview-content" v-html="previewResource.description" />
        <div v-if="previewResource.tags?.length" class="preview-tags">
          <a-tag v-for="tag in previewResource.tags" :key="tag">
            {{ tag }}
          </a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DownOutlined,
  CheckOutlined,
  InboxOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import {
  adminResourceApi,
  type ResourceItem,
} from "@/api/modules/adminResource";
import {
  ResourceCategoryApi,
  type ResourceCategory,
} from "@/api/modules/resourceCategory";
import dayjs from "dayjs";

// 路由
const router = useRouter();

// 创建分类API实例
const resourceCategoryApi = new ResourceCategoryApi();

// 状态管理
const loading = ref(false);
const resources = ref<ResourceItem[]>([]);
const categories = ref<ResourceCategory[]>([]);
const selectedRowKeys = ref<string[]>([]);
const previewVisible = ref(false);
const previewResource = ref<ResourceItem | null>(null);

// 搜索过滤器
const filters = reactive({
  keyword: "",
  categoryId: undefined as any,
  status: undefined as any,
  type: undefined as any,
  dateRange: [] as any,
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    console.log("📄 分页组件onChange:", { page, pageSize });
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchResources();
  },
  onShowSizeChange: (current: number, size: number) => {
    console.log("📄 分页组件onShowSizeChange:", { current, size });
    pagination.current = 1; // 改变页面大小时回到第一页
    pagination.pageSize = size;
    fetchResources();
  },
});

// 表格列配置
const columns = [
  {
    title: "资源标题",
    key: "title",
    dataIndex: "title",
    width: 300,
  },
  {
    title: "分类",
    key: "category",
    dataIndex: "category",
    width: 120,
  },
  {
    title: "状态",
    key: "status",
    dataIndex: "status",
    width: 100,
  },
  {
    title: "统计",
    key: "stats",
    width: 120,
  },
  {
    title: "发布时间",
    key: "publishDate",
    dataIndex: "publishDate",
    width: 180,
    sorter: true,
  },
  {
    title: "操作",
    key: "actions",
    width: 150,
    fixed: "right",
  },
];

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

// 获取资源列表
const fetchResources = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      limit: pagination.pageSize,
    };

    // 添加筛选条件（只添加有值的参数）
    if (filters.keyword) {
      params.keyword = filters.keyword;
    }
    if (filters.categoryId) {
      params.category = filters.categoryId;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.type) {
      params.type = filters.type;
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.dateRange = filters.dateRange;
    }

    console.log("📋 获取资源列表 - 请求参数:", params);

    const response = await adminResourceApi.getList(params);

    console.log("📋 获取资源列表 - 响应数据:", response);

    // 处理API响应数据
    if (response && response.success) {
      // 直接使用response.data作为资源列表
      resources.value = Array.isArray(response.data) ? response.data : [];

      // 处理分页信息
      if (response.pagination) {
        pagination.total = response.pagination.total || 0;
      } else {
        // 如果没有分页信息，保持当前total不变
        console.warn("⚠️ 响应中缺少分页信息");
      }

      console.log("📋 成功处理响应数据:", {
        resourcesCount: resources.value.length,
        paginationTotal: pagination.total,
        currentPage: pagination.current,
      });
    } else {
      // 处理失败响应
      resources.value = [];
      pagination.total = 0;
      const errorMsg = response?.message || "获取资源列表失败";
      console.error("❌ API响应失败:", errorMsg);
      message.error(errorMsg);
    }

    console.log("📋 处理后的数据:", {
      resourcesCount: resources.value.length,
      total: pagination.total,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  } catch (error: any) {
    console.error("❌ 获取资源列表失败:", error);
    message.error(error.message || "获取资源列表失败");
    resources.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await resourceCategoryApi.getList();
    console.log("列表页面资源分类响应数据:", response);

    // 处理不同的响应格式
    if ((response as any).status === "success") {
      // 处理 { status: 'success', data: [...] } 格式
      categories.value = (response as any).data || [];
    } else if ((response as any).data?.status === "success") {
      // 处理嵌套格式 { data: { status: 'success', data: [...] } }
      categories.value = (response as any).data.data || [];
    } else {
      // 处理标准 ApiResponse 格式 { success: true, data: [...] }
      categories.value = response.data || [];
    }

    console.log("列表页面解析后的资源分类数据:", categories.value);
  } catch (error: any) {
    console.error("获取资源分类列表失败:", error);
    message.error(error.message || "获取分类列表失败");
  }
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
  fetchResources();
};

// 表格变化处理
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  console.log("🔄 分页变化:", {
    current: pag.current,
    pageSize: pag.pageSize,
    total: pag.total,
    oldCurrent: pagination.current,
    oldPageSize: pagination.pageSize,
  });

  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchResources();
};

// 编辑资源
const handleEdit = (record: ResourceItem) => {
  // 路由跳转到编辑页面
  router.push(`/admin/resources/edit/${record.id}`);
};

// 预览资源
const handlePreview = (record: ResourceItem) => {
  previewResource.value = record;
  previewVisible.value = true;
};

// 下载资源
const handleDownload = (record: ResourceItem) => {
  if (!record.fileUrl) {
    message.warning("该资源没有可下载的文件");
    return;
  }

  try {
    // 创建下载链接
    const link = document.createElement("a");
    link.href = record.fileUrl;
    link.download = record.fileName || record.title;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("下载开始");

    // 调用API记录下载统计
    adminResourceApi.incrementDownloadCount(record.id).catch(() => {
      // 下载统计失败不影响用户体验，只是静默处理
      console.warn("Failed to update download count");
    });
  } catch (error) {
    message.error("下载失败，请重试");
  }
};

// 菜单点击处理
const handleMenuClick = (e: { key: string }, record: ResourceItem) => {
  handleAction(e.key, record);
};

// 操作处理
const handleAction = async (action: string, record: ResourceItem) => {
  switch (action) {
    case "preview":
      handlePreview(record);
      break;
    case "download":
      handleDownload(record);
      break;
    case "publish":
      await handleStatusChange(record.id, "published");
      break;
    case "archive":
      await handleStatusChange(record.id, "archived");
      break;
    case "delete":
      await handleDelete(record.id);
      break;
  }
};

// 状态变更
const handleStatusChange = async (
  id: string,
  status: "draft" | "published" | "archived",
) => {
  try {
    await adminResourceApi.updateStatus(id, status);
    message.success("状态更新成功");
    fetchResources();
  } catch (error: any) {
    message.error(error.message || "状态更新失败");
  }
};

// 删除资源
const handleDelete = async (id: string) => {
  try {
    await adminResourceApi.deleteResource(id);
    message.success("删除成功");
    fetchResources();
  } catch (error: any) {
    message.error(error.message || "删除失败");
  }
};

// 批量操作
const handleBatchPublish = async () => {
  try {
    await adminResourceApi.batchUpdateStatus(
      selectedRowKeys.value,
      "published",
    );
    message.success("批量发布成功");
    selectedRowKeys.value = [];
    fetchResources();
  } catch (error: any) {
    message.error(error.message || "批量发布失败");
  }
};

const handleBatchArchive = async () => {
  try {
    await adminResourceApi.batchUpdateStatus(selectedRowKeys.value, "archived");
    message.success("批量归档成功");
    selectedRowKeys.value = [];
    fetchResources();
  } catch (error: any) {
    message.error(error.message || "批量归档失败");
  }
};

const handleBatchDelete = async () => {
  try {
    await adminResourceApi.batchDelete(selectedRowKeys.value);
    message.success("批量删除成功");
    selectedRowKeys.value = [];
    fetchResources();
  } catch (error: any) {
    message.error(error.message || "批量删除失败");
  }
};

// 辅助函数
const formatDate = (date: string) => {
  return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    document: "blue",
    video: "purple",
    image: "green",
    audio: "orange",
    other: "default",
  };
  return colors[type] || "default";
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    document: "文档",
    video: "视频",
    image: "图片",
    audio: "音频",
    other: "其他",
  };
  return texts[type] || type;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    published: "success",
    draft: "default",
    archived: "warning",
  };
  return colors[status] || "default";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    published: "已发布",
    draft: "草稿",
    archived: "归档",
  };
  return texts[status] || status;
};

onMounted(() => {
  fetchCategories();
  fetchResources();
});
</script>

<style scoped lang="scss">
.resources-list {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    }
  }

  .filters-container {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .batch-actions {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 16px;

    span {
      color: #1890ff;
      font-weight: 500;
    }
  }

  .table-container {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .resource-title {
      a {
        font-weight: 500;
        color: #1890ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .resource-meta {
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 8px;

        .author {
          color: #666;
          font-size: 12px;
        }
      }
    }

    .stats-cell {
      display: flex;
      gap: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666;
        font-size: 12px;

        .anticon {
          font-size: 12px;
        }
      }
    }

    .danger-action {
      color: #ff4d4f !important;
    }
  }

  .resource-preview {
    .preview-meta {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .preview-content {
      margin-bottom: 16px;
      line-height: 1.6;
      color: #333;
    }

    .preview-tags {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
  }
}
</style>
