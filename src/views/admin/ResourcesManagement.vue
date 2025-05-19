<template>
  <div class="resources-management">
    <!-- 头部操作区 -->
    <div class="page-header">
      <h1>资源管理</h1>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          添加资源
        </a-button>
        <a-button v-if="selectedRowKeys.length > 0" @click="handleBatchDelete" danger>
          <template #icon><DeleteOutlined /></template>
          批量删除 ({{ selectedRowKeys.length }})
        </a-button>
        <a-button v-if="selectedRowKeys.length > 0" @click="handleBatchPublish">
          <template #icon><CloudUploadOutlined /></template>
          批量发布
        </a-button>
      </a-space>
    </div>

    <!-- 搜索和筛选 -->
    <a-card class="filter-card">
      <a-form layout="inline">
        <a-form-item label="关键词">
          <a-input
            v-model:value="query.keyword"
            placeholder="搜索标题或描述"
            allowClear
            @pressEnter="handleSearch"
          >
            <template #suffix>
              <SearchOutlined style="color: rgba(0, 0, 0, 0.45)" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="query.type"
            style="width: 120px"
            allowClear
            placeholder="资源类型"
          >
            <a-select-option value="document">文档资料</a-select-option>
            <a-select-option value="video">视频资源</a-select-option>
            <a-select-option value="image">图片资源</a-select-option>
            <a-select-option value="audio">音频资源</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分类">
          <a-select
            v-model:value="query.category"
            style="width: 120px"
            allowClear
            placeholder="资源分类"
          >
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="query.status"
            style="width: 120px"
            allowClear
            placeholder="资源状态"
          >
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="draft">草稿</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="handleReset"> 重置 </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 资源列表 -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="resources"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys, onChange: onSelectionChange }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 标题列 -->
          <template v-if="column.key === 'title'">
            <div class="resource-title">
              <component
                :is="getFileIcon(record.type)"
                :style="{ color: getTypeColor(record.type) }"
              />
              <span class="title-text">{{ record.title }}</span>
              <a-tag v-if="record.featured" color="gold">推荐</a-tag>
            </div>
          </template>

          <!-- 类型列 -->
          <template v-else-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeText(record.type) }}
            </a-tag>
          </template>

          <!-- 大小列 -->
          <template v-else-if="column.key === 'size'">
            {{ formatFileSize(record.size) }}
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'published' ? 'success' : 'default'">
              {{ record.status === 'published' ? '已发布' : '草稿' }}
            </a-tag>
          </template>

          <!-- 统计列 -->
          <template v-else-if="column.key === 'stats'">
            <a-space>
              <span title="下载次数"> <DownloadOutlined /> {{ record.downloadCount || 0 }} </span>
              <span title="浏览次数"> <EyeOutlined /> {{ record.viewCount || 0 }} </span>
            </a-space>
          </template>

          <!-- 创建时间列 -->
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-tooltip title="预览">
                <a @click="handlePreview(record)">
                  <EyeOutlined />
                </a>
              </a-tooltip>
              <a-tooltip title="下载">
                <a @click="handleDownload(record)">
                  <DownloadOutlined />
                </a>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a @click="handleEdit(record)">
                  <EditOutlined />
                </a>
              </a-tooltip>
              <a-tooltip :title="record.featured ? '取消推荐' : '设为推荐'">
                <a @click="handleToggleFeatured(record)">
                  <StarOutlined :class="{ featured: record.featured }" />
                </a>
              </a-tooltip>
              <a-divider type="vertical" />
              <a-dropdown>
                <a class="ant-dropdown-link" @click.prevent> 更多 <DownOutlined /> </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="publish" v-if="record.status !== 'published'">
                      <CloudUploadOutlined />
                      <span>发布</span>
                    </a-menu-item>
                    <a-menu-item key="unpublish" v-else>
                      <CloudDownloadOutlined />
                      <span>取消发布</span>
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete">
                      <DeleteOutlined />
                      <span>删除</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewData?.title"
      :width="800"
      :footer="null"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <div v-if="previewData?.type === 'image'" class="preview-image">
          <img :src="previewData.url" alt="预览图片" />
        </div>
        <!-- 视频预览 -->
        <div v-else-if="previewData?.type === 'video'" class="preview-video">
          <video :src="previewData.url" controls />
        </div>
        <!-- 音频预览 -->
        <div v-else-if="previewData?.type === 'audio'" class="preview-audio">
          <audio :src="previewData.url" controls />
        </div>
        <!-- 文档预览 -->
        <div v-else class="preview-document">
          <p>文件名：{{ previewData?.title }}</p>
          <p>类型：{{ getTypeText(previewData?.type) }}</p>
          <p>大小：{{ formatFileSize(previewData?.size) }}</p>
        </div>

        <a-divider />

        <!-- 资源详情 -->
        <div class="preview-details">
          <p>上传时间：{{ formatDate(previewData?.createdAt) }}</p>
          <p>下载次数：{{ previewData?.downloadCount || 0 }}</p>
          <p v-if="previewData?.description">描述：{{ previewData.description }}</p>
          <div v-if="previewData?.tags?.length" class="preview-tags">
            <span>标签：</span>
            <a-tag v-for="tag in previewData.tags" :key="tag">{{ tag }}</a-tag>
          </div>
        </div>

        <div class="preview-actions">
          <a-button type="primary" @click="handleDownload(previewData)"> 立即下载 </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 批量操作确认框 -->
    <a-modal
      v-model:visible="batchActionVisible"
      :title="batchActionTitle"
      :confirm-loading="batchActionLoading"
      @ok="confirmBatchAction"
      @cancel="cancelBatchAction"
    >
      <p>{{ batchActionMessage }}</p>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DownOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  AudioOutlined,
  FileOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useResourceStore } from '@/stores/resource'
import dayjs from 'dayjs'

export default {
  name: 'ResourcesManagement',

  components: {
    PlusOutlined,
    SearchOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    DownloadOutlined,
    StarOutlined,
    CloudUploadOutlined,
    CloudDownloadOutlined,
    DownOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    PictureOutlined,
    AudioOutlined,
    FileOutlined,
  },

  setup() {
    const router = useRouter()
    const resourceStore = useResourceStore()

    // 状态
    const loading = ref(false)
    const previewVisible = ref(false)
    const previewData = ref(null)
    const selectedRowKeys = ref([])
    const batchActionVisible = ref(false)
    const batchActionLoading = ref(false)
    const batchActionType = ref('')

    const resources = computed(() => resourceStore.items)
    const categories = ref([])

    // 查询参数
    const query = reactive({
      keyword: '',
      type: undefined,
      category: undefined,
      status: undefined,
    })

    // 分页配置
    const pagination = computed(() => ({
      total: resourceStore.total,
      current: resourceStore.page,
      pageSize: resourceStore.limit,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: total => `共 ${total} 条记录`,
    }))

    // 表格列配置
    const columns = [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        width: '30%',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: '10%',
        filters: [
          { text: '文档资料', value: 'document' },
          { text: '视频资源', value: 'video' },
          { text: '图片资源', value: 'image' },
          { text: '音频资源', value: 'audio' },
        ],
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: '15%',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: '10%',
        filters: [
          { text: '已发布', value: 'published' },
          { text: '草稿', value: 'draft' },
        ],
      },
      {
        title: '大小',
        dataIndex: 'size',
        key: 'size',
        width: '10%',
        sorter: true,
      },
      {
        title: '统计',
        key: 'stats',
        width: '15%',
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: '15%',
        sorter: true,
      },
      {
        title: '操作',
        key: 'action',
        width: '20%',
        fixed: 'right',
      },
    ]

    // 获取类型颜色
    const getTypeColor = type => {
      const colors = {
        document: 'blue',
        video: 'green',
        image: 'purple',
        audio: 'orange',
        other: 'default',
      }
      return colors[type] || colors.other
    }

    // 获取文件图标
    const getFileIcon = type => {
      const icons = {
        document: FileTextOutlined,
        video: VideoCameraOutlined,
        image: PictureOutlined,
        audio: AudioOutlined,
      }
      return icons[type] || FileOutlined
    }

    // 获取类型文本
    const getTypeText = type => {
      const texts = {
        document: '文档资料',
        video: '视频资源',
        image: '图片资源',
        audio: '音频资源',
        other: '其他',
      }
      return texts[type] || texts.other
    }

    // 格式化文件大小
    const formatFileSize = bytes => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    // 格式化日期
    const formatDate = date => {
      return dayjs(date).format('YYYY-MM-DD HH:mm')
    }

    // 加载资源列表
    const loadResources = async () => {
      try {
        loading.value = true
        await resourceStore.fetchList({
          ...query,
          page: pagination.value.current,
          limit: pagination.value.pageSize,
        })
      } catch (error) {
        message.error('加载资源列表失败')
      } finally {
        loading.value = false
      }
    }

    // 加载分类列表
    const loadCategories = async () => {
      try {
        const response = await resourceStore.getCategories()
        categories.value = response.data
      } catch (error) {
        message.error('加载分类列表失败')
      }
    }

    // 处理搜索
    const handleSearch = () => {
      pagination.value.current = 1
      loadResources()
    }

    // 处理重置
    const handleReset = () => {
      Object.keys(query).forEach(key => {
        query[key] = undefined
      })
      pagination.value.current = 1
      loadResources()
    }

    // 处理表格变化
    const handleTableChange = (pag, filters, sorter) => {
      // 处理排序
      if (sorter.field) {
        query.sortBy = sorter.field
        query.sortOrder = sorter.order === 'ascend' ? 1 : -1
      } else {
        query.sortBy = undefined
        query.sortOrder = undefined
      }

      // 处理筛选
      if (filters.type?.length) {
        query.type = filters.type[0]
      }
      if (filters.status?.length) {
        query.status = filters.status[0]
      }

      // 更新分页
      pagination.value.current = pag.current
      pagination.value.pageSize = pag.pageSize

      loadResources()
    }

    // 处理选择变化
    const onSelectionChange = keys => {
      selectedRowKeys.value = keys
    }

    // 处理添加
    const handleAdd = () => {
      router.push('/admin/resources/add')
    }

    // 处理编辑
    const handleEdit = record => {
      router.push(`/admin/resources/edit/${record.id}`)
    }

    // 处理预览
    const handlePreview = record => {
      previewData.value = record
      previewVisible.value = true
    }

    // 处理下载
    const handleDownload = async record => {
      try {
        await resourceStore.download(record.id)
        message.success('开始下载')
      } catch (error) {
        message.error('下载失败')
      }
    }

    // 处理删除
    const handleDelete = record => {
      Modal.confirm({
        title: '确定要删除这个资源吗？',
        content: '此操作不可恢复',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
          try {
            await resourceStore.remove(record.id)
            message.success('删除成功')
            if (pagination.value.total === 1 && pagination.value.current > 1) {
              pagination.value.current--
            }
            loadResources()
          } catch (error) {
            message.error('删除失败')
          }
        },
      })
    }

    // 处理批量删除
    const handleBatchDelete = () => {
      batchActionType.value = 'delete'
      batchActionVisible.value = true
    }

    // 处理批量发布
    const handleBatchPublish = () => {
      batchActionType.value = 'publish'
      batchActionVisible.value = true
    }

    // 切换推荐状态
    const handleToggleFeatured = async record => {
      try {
        await resourceStore.updateStatus(record.id, {
          featured: !record.featured,
        })
        message.success(record.featured ? '已取消推荐' : '已设为推荐')
        loadResources()
      } catch (error) {
        message.error('操作失败')
      }
    }

    // 批量操作相关
    const batchActionTitle = computed(() => {
      const titles = {
        delete: '批量删除',
        publish: '批量发布',
      }
      return titles[batchActionType.value]
    })

    const batchActionMessage = computed(() => {
      const messages = {
        delete: `确定要删除选中的 ${selectedRowKeys.value.length} 个资源吗？此操作不可恢复。`,
        publish: `确定要发布选中的 ${selectedRowKeys.value.length} 个资源吗？`,
      }
      return messages[batchActionType.value]
    })

    // 确认批量操作
    const confirmBatchAction = async () => {
      batchActionLoading.value = true
      try {
        if (batchActionType.value === 'delete') {
          await resourceStore.batchDelete(selectedRowKeys.value)
          message.success('批量删除成功')
        } else if (batchActionType.value === 'publish') {
          await resourceStore.batchUpdateStatus(selectedRowKeys.value, 'published')
          message.success('批量发布成功')
        }
        selectedRowKeys.value = []
        batchActionVisible.value = false
        loadResources()
      } catch (error) {
        message.error('操作失败')
      } finally {
        batchActionLoading.value = false
      }
    }

    // 取消批量操作
    const cancelBatchAction = () => {
      batchActionVisible.value = false
      batchActionType.value = ''
    }

    onMounted(() => {
      loadCategories()
      loadResources()
    })

    return {
      loading,
      resources,
      categories,
      columns,
      pagination,
      query,
      selectedRowKeys,
      previewVisible,
      previewData,
      batchActionVisible,
      batchActionLoading,
      batchActionTitle,
      batchActionMessage,
      getTypeColor,
      getFileIcon,
      getTypeText,
      formatFileSize,
      formatDate,
      handleSearch,
      handleReset,
      handleTableChange,
      onSelectionChange,
      handleAdd,
      handleEdit,
      handlePreview,
      handleDownload,
      handleDelete,
      handleBatchDelete,
      handleBatchPublish,
      handleToggleFeatured,
      confirmBatchAction,
      cancelBatchAction,
    }
  },
}
</script>

<style scoped>
.resources-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.filter-card {
  margin-bottom: 16px;
}

.resource-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  color: #1890ff;
  cursor: pointer;
}

.title-text:hover {
  color: #40a9ff;
}

.preview-content {
  padding: 24px;
}

.preview-image img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.preview-video video,
.preview-audio audio {
  width: 100%;
}

.preview-document {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.preview-details {
  margin-top: 16px;
}

.preview-details p {
  margin-bottom: 8px;
}

.preview-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.preview-actions {
  margin-top: 24px;
  text-align: center;
}

.featured {
  color: #faad14;
}

@media (max-width: 768px) {
  .resources-management {
    padding: 16px;
  }

  :deep(.ant-form-inline) {
    flex-wrap: wrap;
  }

  :deep(.ant-form-inline .ant-form-item) {
    margin-bottom: 16px;
  }

  :deep(.ant-table) {
    overflow-x: auto;
  }

  .preview-image img {
    max-height: 300px;
  }
}
</style>
