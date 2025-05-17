<!-- NewsList.vue - 资讯列表页面 -->
<template>
  <div class="news-list-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div class="title-section">
        <h1>资讯列表</h1>
        <p>管理资讯中心的内容，包括中心动态、通知公告、政策文件等</p>
      </div>

      <div class="action-section">
        <a-button type="primary" @click="handleAddNews" v-if="isEditor">
          <template #icon><PlusOutlined /></template>
          添加资讯
        </a-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="horizontal" :model="filters">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="分类">
              <a-select
                v-model:value="filters.category"
                placeholder="选择分类"
                style="width: 100%"
                allowClear
                @change="handleCategoryChange"
              >
                <a-select-option
                  v-for="category in categories"
                  :key="category.key"
                  :value="category.key"
                >
                  {{ category.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="状态">
              <a-select
                v-model:value="filters.status"
                placeholder="选择状态"
                style="width: 100%"
                allowClear
                @change="handleStatusChange"
              >
                <a-select-option value="published">已发布</a-select-option>
                <a-select-option value="draft">草稿</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :sm="24" :md="8" :lg="6">
            <a-form-item label="搜索">
              <a-input-search
                v-model:value="filters.search"
                placeholder="标题、内容关键字"
                enter-button
                @search="handleSearch"
              />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :sm="24" :md="24" :lg="6" class="filter-buttons">
            <a-button @click="handleResetFilters">重置筛选</a-button>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 内容表格 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="newsList"
        :pagination="pagination"
        :loading="loading"
        row-key="_id"
        @change="handleTableChange"
      >
        <!-- 标题列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="news-title-cell">
              <a-badge :status="record.isPublished ? 'success' : 'warning'" />
              <router-link :to="`/admin/news/edit/${record._id}`">
                {{ record.title }}
              </router-link>
            </div>
          </template>

          <!-- 分类列 -->
          <template v-if="column.key === 'category'">
            <a-tag :color="getCategoryColor(record.categoryKey)">
              {{ record.category }}
            </a-tag>
          </template>

          <!-- 创建日期列 -->
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <!-- 发布日期列 -->
          <template v-if="column.key === 'publishDate'">
            {{ formatDate(record.publishDate) }}
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="record.isPublished ? 'green' : 'orange'">
              {{ record.isPublished ? '已发布' : '草稿' }}
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-tooltip title="查看">
                <a href="javascript:;" @click="handleViewNews(record)">
                  <EyeOutlined />
                </a>
              </a-tooltip>

              <a-tooltip v-if="isEditor" title="编辑">
                <router-link :to="`/admin/news/edit/${record._id}`">
                  <EditOutlined />
                </router-link>
              </a-tooltip>

              <a-tooltip v-if="isEditor" :title="record.isPublished ? '取消发布' : '发布'">
                <a href="javascript:;" @click="handleTogglePublish(record)">
                  <component :is="record.isPublished ? 'StopOutlined' : 'CheckCircleOutlined'" />
                </a>
              </a-tooltip>

              <a-tooltip v-if="isAdmin" title="删除">
                <a href="javascript:;" @click="handleDeleteNews(record)" class="danger-action">
                  <DeleteOutlined />
                </a>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useContentStore } from '@/stores/content'
import dayjs from 'dayjs'

export default {
  name: 'NewsList',

  components: {
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    StopOutlined,
  },

  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const contentStore = useContentStore()

    // 表格数据和加载状态
    const newsList = ref([])
    const loading = ref(false)

    // 权限相关
    const isAdmin = computed(() => userStore.isAdmin)
    const isEditor = computed(() => userStore.isEditor)

    // 分类列表
    const categories = ref([])

    // 筛选条件
    const filters = reactive({
      category: '',
      status: '',
      search: '',
    })

    // 表格列配置
    const columns = [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        width: '35%',
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: '15%',
      },
      {
        title: '创建日期',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        width: '15%',
      },
      {
        title: '发布日期',
        dataIndex: 'publishDate',
        key: 'publishDate',
        sorter: true,
        width: '15%',
      },
      {
        title: '状态',
        dataIndex: 'isPublished',
        key: 'status',
        width: '10%',
      },
      {
        title: '操作',
        key: 'action',
        width: '10%',
      },
    ]

    // 分页配置
    const pagination = computed(() => contentStore.newsPagination)

    // 获取分类颜色
    const getCategoryColor = categoryKey => {
      const colorMap = {
        center: 'blue',
        notice: 'green',
        policy: 'orange',
        theory: 'purple',
        teaching: 'cyan',
      }
      return colorMap[categoryKey] || 'default'
    }

    // 格式化日期
    const formatDate = date => {
      return date ? dayjs(date).format('YYYY-MM-DD') : '-'
    }

    // 加载资讯列表
    const loadNewsList = async () => {
      try {
        loading.value = true
        await contentStore.fetchNewsList()
        newsList.value = contentStore.news.items
      } catch (error) {
        message.error('加载资讯列表失败')
      } finally {
        loading.value = false
      }
    }

    // 加载分类
    const loadCategories = async () => {
      try {
        await contentStore.fetchNewsCategories()
        categories.value = contentStore.newsCategories
      } catch (error) {
        message.error('加载资讯分类失败')
      }
    }

    // 处理表格变化（分页、排序、过滤）
    const handleTableChange = (pag, filters, sorter) => {
      const params = {
        page: pag.current,
        limit: pag.pageSize,
      }

      // 添加排序
      if (sorter && sorter.field) {
        params.sortBy = sorter.field
        params.sortOrder = sorter.order === 'ascend' ? 1 : -1
      }

      contentStore.fetchNewsList(params)
    }

    // 添加资讯
    const handleAddNews = () => {
      router.push('/admin/news/create')
    }

    // 查看资讯
    const handleViewNews = record => {
      window.open(`/news/${record._id}`, '_blank')
    }

    // 切换发布状态
    const handleTogglePublish = async record => {
      try {
        loading.value = true
        const action = record.isPublished ? '取消发布' : '发布'
        const updated = await contentStore.toggleNewsPublishStatus(record._id)

        // 更新本地数据
        const index = newsList.value.findIndex(item => item._id === record._id)
        if (index !== -1) {
          newsList.value[index].isPublished = updated.isPublished
        }

        message.success(`${action}成功`)
      } catch (error) {
        message.error(`操作失败: ${error.message}`)
      } finally {
        loading.value = false
      }
    }

    // 删除资讯
    const handleDeleteNews = record => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这条资讯吗？此操作不可恢复。',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
          try {
            loading.value = true
            await contentStore.deleteNews(record._id)
            message.success('删除成功')
            await loadNewsList() // 重新加载列表
          } catch (error) {
            message.error('删除失败: ' + error.message)
          } finally {
            loading.value = false
          }
        },
      })
    }

    // 处理分类变化
    const handleCategoryChange = value => {
      filters.category = value
    }

    // 处理状态变化
    const handleStatusChange = value => {
      filters.status = value
    }

    // 处理搜索
    const handleSearch = () => {
      const params = {}

      if (filters.category) {
        params.categoryKey = filters.category
      }

      if (filters.status) {
        params.isPublished = filters.status === 'published'
      }

      if (filters.search) {
        params.search = filters.search
      }

      contentStore.fetchNewsList(params, true)
    }

    // 重置筛选条件
    const handleResetFilters = () => {
      filters.category = ''
      filters.status = ''
      filters.search = ''

      contentStore.fetchNewsList({}, true)
    }

    // 初始化
    onMounted(() => {
      loadCategories()
      loadNewsList()
    })

    return {
      newsList,
      loading,
      columns,
      pagination,
      filters,
      categories,
      isAdmin,
      isEditor,
      getCategoryColor,
      formatDate,
      handleTableChange,
      handleAddNews,
      handleViewNews,
      handleTogglePublish,
      handleDeleteNews,
      handleCategoryChange,
      handleStatusChange,
      handleSearch,
      handleResetFilters,
    }
  },
}
</script>

<style scoped>
.news-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-section h1 {
  font-size: 24px;
  margin-bottom: 8px;
  margin-top: 0;
}

.title-section p {
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: flex-end;
}

.table-card {
  margin-bottom: 0;
}

.news-title-cell {
  display: flex;
  align-items: center;
}

.news-title-cell a {
  margin-left: 8px;
  color: #1890ff;
}

.danger-action {
  color: #ff4d4f;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-section {
    margin-top: 16px;
    width: 100%;
  }

  .action-section button {
    width: 100%;
  }
}
</style>
