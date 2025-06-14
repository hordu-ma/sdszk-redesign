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

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="关键词">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="请输入标题或内容关键词"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="分类">
          <a-select
            v-model:value="searchForm.categoryId"
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
        <a-form-item label="日期范围">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            format="YYYY-MM-DD"
            style="width: 240px"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon>
              <SearchOutlined />
            </template>
            搜索
          </a-button>
          <a-button @click="handleReset" style="margin-left: 8px"> 重置 </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedRowKeys.length > 0">
      <span class="selected-info">已选择 {{ selectedRowKeys.length }} 项</span>
      <a-button-group>
        <a-button @click="handleBatchPublish">批量发布</a-button>
        <a-button @click="handleBatchArchive">批量归档</a-button>
        <a-popconfirm
          title="确定要删除选中的新闻吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <a-button danger>批量删除</a-button>
        </a-popconfirm>
      </a-button-group>
    </div>

    <!-- 新闻列表表格 -->
    <div class="table-section">
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        row-key="id"
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
                <a-tag v-if="record.isFeatured" color="gold" size="small">精选</a-tag>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'category'">
            <a-tag color="blue">{{ record.categoryName }}</a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'views'">
            <span>{{ formatNumber(record.views) }}</span>
          </template>

          <template v-if="column.key === 'publishTime'">
            <span>{{ formatDate(record.publishTime) }}</span>
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)"> 编辑 </a-button>
              <a-button type="link" size="small" @click="handleToggleTop(record)">
                {{ record.isTop ? '取消置顶' : '置顶' }}
              </a-button>
              <a-button type="link" size="small" @click="handleTogglePublish(record)">
                {{ record.status === 'published' ? '下线' : '发布' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { adminNewsApi, type NewsItem, type NewsQueryParams } from '@/api/modules/adminNews'
import { NewsCategoryApi, type NewsCategory } from '@/api/modules/newsCategory'
import type { TableColumnsType, TableProps } from 'ant-design-vue'

const router = useRouter()

// 数据状态
const loading = ref(false)
const tableData = ref<NewsItem[]>([])
const categories = ref<NewsCategory[]>([])
const selectedRowKeys = ref<number[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: undefined as number | undefined,
  status: undefined as string | undefined,
  dateRange: undefined as [string, string] | undefined,
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '标题',
    key: 'title',
    dataIndex: 'title',
    ellipsis: true,
    width: 300,
  },
  {
    title: '分类',
    key: 'category',
    dataIndex: 'categoryName',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '浏览量',
    key: 'views',
    dataIndex: 'views',
    width: 100,
    sorter: true,
  },
  {
    title: '作者',
    key: 'author',
    dataIndex: ['author', 'username'],
    width: 120,
  },
  {
    title: '发布时间',
    key: 'publishTime',
    dataIndex: 'publishTime',
    width: 160,
    sorter: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    fixed: 'right',
  },
]

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    draft: 'default',
    published: 'success',
    archived: 'warning',
  }
  return colorMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
  }
  return textMap[status] || status
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取新闻列表
const fetchNewsList = async () => {
  try {
    loading.value = true

    const params: NewsQueryParams = {
      page: pagination.current,
      limit: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      categoryId: searchForm.categoryId,
      status: searchForm.status as any,
    }

    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const { data } = await adminNewsApi.getList(params)

    tableData.value = data.data || []
    pagination.total = data.pagination?.total || 0
  } catch (error: any) {
    message.error(error.message || '获取新闻列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const newsCategoryApi = new NewsCategoryApi()
    const { data } = await newsCategoryApi.getList()
    categories.value = data
  } catch (error: any) {
    message.error(error.message || '获取分类列表失败')
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchNewsList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: undefined,
    status: undefined,
    dateRange: undefined,
  })
  pagination.current = 1
  fetchNewsList()
}

// 处理表格变化
const handleTableChange: TableProps['onChange'] = (pag, filters, sorter) => {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 20

  // 更新URL，但不刷新页面
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.set('page', pagination.current.toString())
  newUrl.searchParams.set('limit', pagination.pageSize.toString())
  window.history.pushState({}, '', newUrl.toString())

  fetchNewsList()
}

// 处理选择变化
const onSelectChange = (newSelectedRowKeys: number[]) => {
  selectedRowKeys.value = newSelectedRowKeys
}

// 处理编辑
const handleEdit = (record: NewsItem) => {
  router.push(`/admin/news/edit/${record.id}`)
}

// 处理删除
const handleDelete = async (record: NewsItem) => {
  try {
    await adminNewsApi.delete(record.id)
    message.success('删除成功')
    fetchNewsList()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

// 处理批量删除
const handleBatchDelete = async () => {
  try {
    await adminNewsApi.batchDelete(selectedRowKeys.value)
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchNewsList()
  } catch (error: any) {
    message.error(error.message || '批量删除失败')
  }
}

// 处理置顶切换
const handleToggleTop = async (record: NewsItem) => {
  try {
    await adminNewsApi.toggleTop(record.id)
    message.success(record.isTop ? '取消置顶成功' : '置顶成功')
    fetchNewsList()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  }
}

// 处理发布状态切换
const handleTogglePublish = async (record: NewsItem) => {
  try {
    await adminNewsApi.togglePublish(record.id)
    message.success(record.status === 'published' ? '下线成功' : '发布成功')
    fetchNewsList()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  }
}

// 处理批量发布
const handleBatchPublish = async () => {
  // 实现批量发布逻辑
  message.info('功能开发中...')
}

// 处理批量归档
const handleBatchArchive = async () => {
  // 实现批量归档逻辑
  message.info('功能开发中...')
}

onMounted(() => {
  // 获取URL查询参数
  const urlParams = new URLSearchParams(window.location.search)
  const pageParam = urlParams.get('page')
  const limitParam = urlParams.get('limit')

  // 如果存在URL参数，则使用它们
  if (pageParam) {
    pagination.current = parseInt(pageParam) || 1
  }
  if (limitParam) {
    pagination.pageSize = parseInt(limitParam) || 20
  }

  // 获取数据
  fetchNewsList()
  fetchCategories()
})
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
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;

    .selected-info {
      color: #1890ff;
      font-weight: 500;
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
