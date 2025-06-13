<template>
  <div class="resources-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>资源管理</h2>
        <p>管理教学资源、文档资料等内容</p>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="$router.push('/admin/resources/create')">
          <template #icon>
            <PlusOutlined />
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
              <SearchOutlined />
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
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
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
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="archived">归档</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="filters.type"
            placeholder="资源类型"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="document">文档</a-select-option>
            <a-select-option value="video">视频</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-range-picker
            v-model:value="filters.dateRange"
            @change="handleSearch"
            style="width: 100%"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRowKeys.length > 0" class="batch-actions">
      <a-space>
        <span>已选择 {{ selectedRowKeys.length }} 项</span>
        <a-button size="small" @click="handleBatchPublish">批量发布</a-button>
        <a-button size="small" @click="handleBatchArchive">批量归档</a-button>
        <a-popconfirm title="确定要删除选中的资源吗？" @confirm="handleBatchDelete">
          <a-button size="small" danger>批量删除</a-button>
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
                <EyeOutlined />
                {{ record.viewCount || 0 }}
              </span>
              <span class="stat-item">
                <DownloadOutlined />
                {{ record.downloadCount || 0 }}
              </span>
            </div>
          </template>

          <template v-if="column.key === 'publishDate'">
            {{ formatDate(record.publishDate) }}
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
              <a-dropdown>
                <a-button type="link" size="small">
                  更多
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="onMenuClick(record)">
                    <a-menu-item key="preview">
                      <EyeOutlined />
                      预览
                    </a-menu-item>
                    <a-menu-item key="download">
                      <DownloadOutlined />
                      下载
                    </a-menu-item>
                    <a-menu-item key="publish" v-if="record.status !== 'published'">
                      <CheckOutlined />
                      发布
                    </a-menu-item>
                    <a-menu-item key="archive" v-if="record.status === 'published'">
                      <InboxOutlined />
                      归档
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" class="danger-action">
                      <DeleteOutlined />
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
              {{ getTypeText(previewResource.type || 'other') }}
            </a-tag>
            <span>作者：{{ previewResource.author?.name }}</span>
            <span>发布时间：{{ formatDate(previewResource.publishDate || '') }}</span>
          </a-space>
        </div>
        <div class="preview-content" v-html="previewResource.description"></div>
        <div v-if="previewResource.tags?.length" class="preview-tags">
          <a-tag v-for="tag in previewResource.tags" :key="tag">{{ tag }}</a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DownOutlined,
  CheckOutlined,
  InboxOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { adminResourceApi, type ResourceItem } from '@/api/modules/adminResource'
import { ResourceCategoryApi, type ResourceCategory } from '@/api/modules/resourceCategory'

// 创建分类API实例
const resourceCategoryApi = new ResourceCategoryApi()
import dayjs from 'dayjs'

// 状态管理
const loading = ref(false)
const resources = ref<ResourceItem[]>([])
const categories = ref<ResourceCategory[]>([])
const selectedRowKeys = ref<string[]>([])
const previewVisible = ref(false)
const previewResource = ref<ResourceItem | null>(null)

// 搜索过滤器
const filters = reactive({
  keyword: '',
  categoryId: undefined as any,
  status: undefined as any,
  type: undefined as any,
  dateRange: [] as any,
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
})

// 表格列配置
const columns = [
  {
    title: '资源标题',
    key: 'title',
    dataIndex: 'title',
    width: 300,
  },
  {
    title: '分类',
    key: 'category',
    dataIndex: 'category',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '统计',
    key: 'stats',
    width: 120,
  },
  {
    title: '发布时间',
    key: 'publishDate',
    dataIndex: 'publishDate',
    width: 180,
    sorter: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
  },
]

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys
  },
}))

// 获取资源列表
const fetchResources = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...filters,
    }

    const { data } = await adminResourceApi.getList(params)
    resources.value = data.data
    pagination.total = data.pagination.total
  } catch (error: any) {
    message.error(error.message || '获取资源列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const { data } = await resourceCategoryApi.getList()
    categories.value = data
  } catch (error: any) {
    message.error(error.message || '获取分类列表失败')
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.current = 1
  fetchResources()
}

// 表格变化处理
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchResources()
}

// 编辑资源
const handleEdit = (record: ResourceItem) => {
  // 路由跳转到编辑页面
  console.log('编辑资源:', record)
}

// 预览资源
const handlePreview = (record: ResourceItem) => {
  previewResource.value = record
  previewVisible.value = true
}

// 操作处理
const handleAction = async (action: string, record: ResourceItem) => {
  switch (action) {
    case 'preview':
      handlePreview(record)
      break
    case 'download':
      // 下载逻辑
      message.info('下载功能待实现')
      break
    case 'publish':
      await handleStatusChange(record.id, 'published')
      break
    case 'archive':
      await handleStatusChange(record.id, 'archived')
      break
    case 'delete':
      await handleDelete(record.id)
      break
  }
}

// Wrapper function for menu click to fix TypeScript type inference
const onMenuClick = (record: ResourceItem) => (event: { key: string }) => {
  handleAction(event.key, record)
}

// 状态变更
const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
  try {
    await adminResourceApi.updateStatus(id, status)
    message.success('状态更新成功')
    fetchResources()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  }
}

// 删除资源
const handleDelete = async (id: string) => {
  try {
    await adminResourceApi.deleteResource(id)
    message.success('删除成功')
    fetchResources()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

// 批量操作
const handleBatchPublish = async () => {
  try {
    await adminResourceApi.batchUpdateStatus(selectedRowKeys.value, 'published')
    message.success('批量发布成功')
    selectedRowKeys.value = []
    fetchResources()
  } catch (error: any) {
    message.error(error.message || '批量发布失败')
  }
}

const handleBatchArchive = async () => {
  try {
    await adminResourceApi.batchUpdateStatus(selectedRowKeys.value, 'archived')
    message.success('批量归档成功')
    selectedRowKeys.value = []
    fetchResources()
  } catch (error: any) {
    message.error(error.message || '批量归档失败')
  }
}

const handleBatchDelete = async () => {
  try {
    await adminResourceApi.batchDelete(selectedRowKeys.value)
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchResources()
  } catch (error: any) {
    message.error(error.message || '批量删除失败')
  }
}

// 辅助函数
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    document: 'blue',
    video: 'purple',
    image: 'green',
    audio: 'orange',
    other: 'default',
  }
  return colors[type] || 'default'
}

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    document: '文档',
    video: '视频',
    image: '图片',
    audio: '音频',
    other: '其他',
  }
  return texts[type] || type
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    published: 'success',
    draft: 'default',
    archived: 'warning',
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '归档',
  }
  return texts[status] || status
}

onMounted(() => {
  fetchCategories()
  fetchResources()
})
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
