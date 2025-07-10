<template>
  <div class="news-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>新闻管理</h2>
        <p>管理平台的新闻内容，包括发布、编辑、删除等操作</p>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="$router.push('/admin/news/create')">
          <template #icon>
            <PlusOutlined />
          </template>
          发布新闻
        </a-button>
      </div>
    </div>

    <!-- 高级搜索和筛选 -->
    <div class="search-section">
      <a-card size="small" :bordered="false">
        <template #title>
          <div class="search-header">
            <span>高级搜索</span>
            <a-space>
              <a-button type="text" size="small" @click="toggleAdvancedSearch">
                {{ showAdvancedSearch ? "收起" : "展开" }}
                <template #icon>
                  <DownOutlined v-if="!showAdvancedSearch" />
                  <UpOutlined v-else />
                </template>
              </a-button>
              <a-button type="text" size="small" @click="clearSearchHistory">
                清空历史
              </a-button>
            </a-space>
          </div>
        </template>

        <!-- 基础搜索 -->
        <a-form layout="inline" :model="searchForm" @finish="handleSearch">
          <a-form-item label="关键词">
            <a-input
              v-model:value="searchForm.keyword"
              placeholder="请输入标题或内容关键词"
              style="width: 250px"
              allow-clear
              @press-enter="handleSearch"
            >
              <template #suffix>
                <SearchOutlined />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item label="分类">
            <a-select
              v-model:value="searchForm.category"
              placeholder="请选择分类"
              style="width: 150px"
              allow-clear
            >
              <a-select-option
                v-for="category in categories"
                :key="category._id"
                :value="category._id"
              >
                {{ category.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="状态">
            <a-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              style="width: 120px"
              allow-clear
            >
              <a-select-option value="draft">草稿</a-select-option>
              <a-select-option value="published">已发布</a-select-option>
              <a-select-option value="archived">已归档</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">
              <template #icon>
                <SearchOutlined />
              </template>
              搜索
            </a-button>
            <a-button @click="handleReset" style="margin-left: 8px">
              重置
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 高级搜索选项 -->
        <div v-show="showAdvancedSearch" class="advanced-search">
          <a-divider />
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="作者">
                <a-input
                  v-model:value="searchForm.author"
                  placeholder="请输入作者姓名"
                  allow-clear
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="标签">
                <a-select
                  v-model:value="searchForm.tags"
                  mode="multiple"
                  placeholder="请选择标签"
                  style="width: 100%"
                  allow-clear
                  :max-tag-count="3"
                >
                  <a-select-option
                    v-for="tag in availableTags"
                    :key="tag"
                    :value="tag"
                  >
                    {{ tag }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="阅读量">
                <a-select
                  v-model:value="searchForm.viewRange"
                  placeholder="阅读量范围"
                  style="width: 100%"
                  allow-clear
                >
                  <a-select-option value="0-100">0-100</a-select-option>
                  <a-select-option value="100-1000">100-1000</a-select-option>
                  <a-select-option value="1000-10000"
                    >1000-10000</a-select-option
                  >
                  <a-select-option value="10000+">10000+</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="创建时间">
                <a-range-picker
                  v-model:value="searchForm.createDateRange"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发布时间">
                <a-range-picker
                  v-model:value="searchForm.publishDateRange"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="排序方式">
                <a-select
                  v-model:value="searchForm.sortBy"
                  placeholder="请选择排序方式"
                  style="width: 100%"
                >
                  <a-select-option value="createdAt">创建时间</a-select-option>
                  <a-select-option value="publishDate"
                    >发布时间</a-select-option
                  >
                  <a-select-option value="viewCount">阅读量</a-select-option>
                  <a-select-option value="title">标题</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="特色设置">
                <a-checkbox-group v-model:value="searchForm.features">
                  <a-checkbox value="isTop">置顶</a-checkbox>
                  <a-checkbox value="isFeatured">精选</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="内容类型">
                <a-checkbox-group v-model:value="searchForm.contentTypes">
                  <a-checkbox value="hasImage">包含图片</a-checkbox>
                  <a-checkbox value="hasVideo">包含视频</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item>
                <a-space>
                  <a-button type="primary" @click="handleAdvancedSearch">
                    高级搜索
                  </a-button>
                  <a-button @click="handleSaveSearch"> 保存搜索 </a-button>
                </a-space>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0" class="search-history">
          <a-divider />
          <div class="history-header">
            <span>搜索历史</span>
            <a-button type="text" size="small" @click="clearSearchHistory">
              清空
            </a-button>
          </div>
          <div class="history-tags">
            <a-tag
              v-for="(history, index) in searchHistory"
              :key="index"
              closable
              @close="removeSearchHistory(index)"
              @click="loadSearchHistory(history)"
              style="cursor: pointer; margin-bottom: 8px"
            >
              {{ history.name }}
            </a-tag>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedRowKeys.length > 0">
      <a-card size="small" :bordered="false">
        <div class="batch-header">
          <span class="selected-info"
            >已选择 {{ selectedRowKeys.length }} 项</span
          >
          <a-space>
            <a-button @click="handleBatchPublish" :loading="batchLoading">
              <template #icon>
                <CheckOutlined />
              </template>
              批量发布
            </a-button>
            <a-button @click="handleBatchArchive" :loading="batchLoading">
              <template #icon>
                <InboxOutlined />
              </template>
              批量归档
            </a-button>
            <a-button @click="handleBatchMoveCategory" :loading="batchLoading">
              <template #icon>
                <FolderOutlined />
              </template>
              批量移动分类
            </a-button>
            <a-button @click="handleBatchAddTags" :loading="batchLoading">
              <template #icon>
                <TagOutlined />
              </template>
              批量添加标签
            </a-button>
            <a-popconfirm
              title="确定要删除选中的新闻吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <a-button danger :loading="batchLoading">
                <template #icon>
                  <DeleteOutlined />
                </template>
                批量删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 新闻列表表格 -->
    <div class="table-section">
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        row-key="_id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="news-title">
              <a-tooltip :title="record.title">
                <span class="title-text">{{ record.title }}</span>
              </a-tooltip>
              <div class="title-tags">
                <a-tag v-if="record.isTop" color="red" size="small">置顶</a-tag>
                <a-tag v-if="record.isFeatured" color="gold" size="small"
                  >精选</a-tag
                >
              </div>
            </div>
          </template>

          <template v-if="column.key === 'category'">
            <a-tag color="blue">{{ record.category?.name }}</a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'views'">
            <span>{{ formatNumber(record.viewCount) }}</span>
          </template>

          <template v-if="column.key === 'publishTime'">
            <span>{{ formatDate(record.publishDate) }}</span>
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                @click="handleToggleTop(record)"
              >
                {{ record.isTop ? "取消置顶" : "置顶" }}
              </a-button>
              <a-button
                type="link"
                size="small"
                @click="handleTogglePublish(record)"
              >
                {{ record.status === "published" ? "下线" : "发布" }}
              </a-button>
              <a-popconfirm
                title="确定要删除这条新闻吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger> 删除 </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 批量操作模态框 -->
    <a-modal
      v-model:open="batchModalVisible"
      :title="batchModalTitle"
      @ok="handleBatchModalOk"
      @cancel="batchModalVisible = false"
    >
      <div v-if="batchModalType === 'category'">
        <p>请选择要移动到的分类：</p>
        <a-select
          v-model:value="batchModalData.category"
          placeholder="请选择分类"
          style="width: 100%"
        >
          <a-select-option
            v-for="category in categories"
            :key="category._id"
            :value="category._id"
          >
            {{ category.name }}
          </a-select-option>
        </a-select>
      </div>
      <div v-else-if="batchModalType === 'tags'">
        <p>请选择要添加的标签：</p>
        <a-select
          v-model:value="batchModalData.tags"
          mode="multiple"
          placeholder="请选择标签"
          style="width: 100%"
        >
          <a-select-option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </a-select-option>
        </a-select>
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
  DownOutlined,
  UpOutlined,
  CheckOutlined,
  InboxOutlined,
  FolderOutlined,
  TagOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import {
  AdminNewsApi,
  type NewsItem,
  type NewsQueryParams,
} from "@/api/modules/adminNews";
import { NewsCategoryApi, type NewsCategory } from "@/api/modules/newsCategory";
import type { TableColumnsType, TableProps } from "ant-design-vue";

const router = useRouter();

// 创建API实例
const adminNewsApi = new AdminNewsApi();

// 数据状态
const loading = ref(false);
const tableData = ref<NewsItem[]>([]);
const categories = ref<NewsCategory[]>([]);
const selectedRowKeys = ref<(string | number)[]>([]);

// 高级搜索相关
const showAdvancedSearch = ref(false);
const availableTags = ref<string[]>([]);
const searchHistory = ref<{ name: string; query: NewsQueryParams }[]>([]);

// 批量操作相关
const batchLoading = ref(false);
const batchModalVisible = ref(false);
const batchModalType = ref<"category" | "tags">("category");
const batchModalTitle = ref("");
const batchModalData = reactive({
  category: "",
  tags: [] as string[],
});

// 搜索表单
const searchForm = reactive({
  keyword: "",
  category: undefined as string | undefined, // ✅ 修复：改为string类型
  status: undefined as string | undefined,
  dateRange: undefined as [string, string] | undefined,
  author: "",
  tags: [] as string[],
  viewRange: "",
  createDateRange: undefined as [string, string] | undefined,
  publishDateRange: undefined as [string, string] | undefined,
  sortBy: "",
  features: [] as string[],
  contentTypes: [] as string[],
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 表格列配置
const columns: TableColumnsType = [
  {
    title: "标题",
    key: "title",
    dataIndex: "title",
    ellipsis: true,
    width: 300,
  },
  {
    title: "分类",
    key: "category",
    dataIndex: ["category", "name"],
    width: 120,
  },
  {
    title: "状态",
    key: "status",
    dataIndex: "status",
    width: 100,
  },
  {
    title: "浏览量",
    key: "views",
    dataIndex: "viewCount",
    width: 100,
    sorter: true,
  },
  {
    title: "作者",
    key: "author",
    dataIndex: ["author", "username"],
    width: 120,
  },
  {
    title: "发布时间",
    key: "publishTime",
    dataIndex: "publishDate",
    width: 160,
    sorter: true,
  },
  {
    title: "操作",
    key: "actions",
    width: 250,
    fixed: "right",
  },
];

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    draft: "default",
    published: "success",
    archived: "warning",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    archived: "已归档",
  };
  return textMap[status] || status;
};

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w";
  }
  return num.toString();
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 获取新闻列表
const fetchNewsList = async () => {
  loading.value = true;
  try {
    const params: NewsQueryParams = {
      page: pagination.current,
      limit: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      category: searchForm.category,
      status: searchForm.status as
        | "draft"
        | "published"
        | "archived"
        | undefined,
    };

    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0];
      params.endDate = searchForm.dateRange[1];
    }

    console.log("发起新闻列表请求:", params);
    const response = await adminNewsApi.getList(params);
    console.log("新闻列表响应:", response);

    // 简化数据处理，与资源管理保持一致
    tableData.value = response.data.data || response.data || [];
    pagination.total = response.pagination?.total || 0;

    console.log("✅ 成功加载新闻数据:", tableData.value.length, "条记录");
  } catch (error: any) {
    console.error("获取新闻列表失败:", error);
    message.error(error.message || "获取新闻列表失败");
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const fetchCategories = async () => {
  // 如果已经有分类数据，跳过重复请求
  if (categories.value.length > 0) {
    console.log("分类数据已存在，跳过重复请求");
    return;
  }

  try {
    console.log("获取分类列表...");
    const newsCategoryApi = new NewsCategoryApi();
    const response = await newsCategoryApi.getList();
    console.log("分类响应:", response);

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

    console.log("成功获取分类:", categories.value.length, "个");
  } catch (error: any) {
    console.error("获取分类列表失败:", error);
    message.error(error.message || "获取分类列表失败");
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchNewsList();
};

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: "",
    category: undefined,
    status: undefined,
    dateRange: undefined,
    author: "",
    tags: [],
    viewRange: "",
    createDateRange: undefined,
    publishDateRange: undefined,
    sortBy: "",
    features: [],
    contentTypes: [],
  });
  pagination.current = 1;
  fetchNewsList();
};

// 处理表格变化
const handleTableChange: TableProps["onChange"] = (pag, filters, sorter) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 20;
  fetchNewsList();
};

// 处理选择变化
const onSelectChange = (newSelectedRowKeys: (string | number)[]) => {
  selectedRowKeys.value = newSelectedRowKeys;
};

// 处理编辑
const handleEdit = (record: NewsItem) => {
  router.push(`/admin/news/edit/${record._id}`);
};

// 处理删除
const handleDelete = async (record: NewsItem) => {
  try {
    await adminNewsApi.deleteNews(record._id as any);
    message.success("删除成功");
    fetchNewsList();
  } catch (error: any) {
    message.error(error.message || "删除失败");
  }
};

// 处理批量删除
const handleBatchDelete = async () => {
  try {
    await adminNewsApi.batchDelete(selectedRowKeys.value.map(String));
    message.success("批量删除成功");
    selectedRowKeys.value = [];
    fetchNewsList();
  } catch (error: any) {
    message.error(error.message || "批量删除失败");
  }
};

// 处理置顶切换
const handleToggleTop = async (record: NewsItem) => {
  try {
    await adminNewsApi.toggleTop(record._id);
    message.success(record.isTop ? "取消置顶成功" : "置顶成功");
    fetchNewsList();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
};

// 处理发布状态切换
const handleTogglePublish = async (record: NewsItem) => {
  try {
    await adminNewsApi.togglePublish(record._id);
    message.success(record.status === "published" ? "下线成功" : "发布成功");
    fetchNewsList();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
};

// 处理批量发布
const handleBatchPublish = async () => {
  // 实现批量发布逻辑
  message.info("功能开发中...");
};

// 处理批量归档
const handleBatchArchive = async () => {
  // 实现批量归档逻辑
  message.info("功能开发中...");
};

// 处理批量移动分类
const handleBatchMoveCategory = () => {
  batchModalType.value = "category";
  batchModalTitle.value = "批量移动分类";
  batchModalData.category = "";
  batchModalVisible.value = true;
};

// 处理批量添加标签
const handleBatchAddTags = () => {
  batchModalType.value = "tags";
  batchModalTitle.value = "批量添加标签";
  batchModalData.tags = [];
  batchModalVisible.value = true;
};

// 处理高级搜索
const handleAdvancedSearch = () => {
  // 实现高级搜索逻辑
  message.info("功能开发中...");
};

// 处理保存搜索
const handleSaveSearch = () => {
  // 实现保存搜索逻辑
  message.info("功能开发中...");
};

// 高级搜索相关函数
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

const clearSearchHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem("newsSearchHistory");
  message.success("搜索历史已清空");
};

const handleSearchHistory = (query: NewsQueryParams) => {
  // 实现保存搜索历史逻辑
  message.info("功能开发中...");
};

const removeSearchHistory = (index: number) => {
  searchHistory.value.splice(index, 1);
  localStorage.setItem(
    "newsSearchHistory",
    JSON.stringify(searchHistory.value)
  );
  message.success("搜索历史已删除");
};

const loadSearchHistory = (history: {
  name: string;
  query: NewsQueryParams;
}) => {
  // 加载搜索历史到表单
  Object.assign(searchForm, history.query);
  handleSearch();
  message.success(`已加载搜索条件：${history.name}`);
};

// 批量操作模态框相关函数
const handleBatchModalOk = async () => {
  try {
    batchLoading.value = true;

    if (batchModalType.value === "category") {
      // 使用现有的更新方法进行批量操作
      for (const id of selectedRowKeys.value) {
        await adminNewsApi.update(id as string, {
          category: batchModalData.category,
        });
      }
      message.success("批量移动分类成功");
    } else if (batchModalType.value === "tags") {
      // 使用现有的更新方法进行批量操作
      for (const id of selectedRowKeys.value) {
        await adminNewsApi.update(id as string, { tags: batchModalData.tags });
      }
      message.success("批量添加标签成功");
    }

    batchModalVisible.value = false;
    selectedRowKeys.value = [];
    fetchNewsList();
  } catch (error: any) {
    message.error(error.message || "批量操作失败");
  } finally {
    batchLoading.value = false;
  }
};

onMounted(() => {
  console.log("NewsList组件已挂载");

  // 检查认证状态
  const token = localStorage.getItem("token");
  if (!token) {
    message.error("请先登录");
    router.push("/admin/login");
    return;
  }

  // 简化URL参数读取
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page");
  const limitParam = urlParams.get("limit");

  if (pageParam) {
    pagination.current = parseInt(pageParam) || 1;
  }
  if (limitParam) {
    pagination.pageSize = parseInt(limitParam) || 20;
  }

  // 使用防抖版本获取数据，避免重复请求
  fetchCategories();

  // 延迟获取新闻列表，确保分类数据先加载
  setTimeout(() => {
    fetchNewsList();
  }, 100);
});
</script>

<style scoped lang="scss">
.news-list {
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

  .search-section {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .advanced-search {
      margin-top: 16px;
    }

    .search-history {
      margin-top: 16px;

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .history-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .batch-actions {
    margin-bottom: 16px;

    .batch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .selected-info {
        color: #1890ff;
        font-weight: 500;
      }
    }
  }

  .table-section {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.ant-table) {
      .news-title {
        .title-text {
          display: block;
          margin-bottom: 4px;
          color: #333;
          font-weight: 500;
        }

        .title-tags {
          display: flex;
          gap: 4px;
        }
      }
    }
  }
}
</style>
