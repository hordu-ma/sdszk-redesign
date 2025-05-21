<!-- NewsCategoryList.vue - 新闻分类列表页面 -->
<template>
  <div class="category-management">
    <div class="page-header">
      <a-space>
        <h2>分类管理</h2>
        <a-tag v-if="isCoreMode" color="blue">核心分类</a-tag>
      </a-space>
      <a-button type="primary" @click="showCreateModal" v-if="!isCoreMode">
        <template #icon><plus-outlined /></template>
        添加分类
      </a-button>
    </div>

    <a-card class="main-card">
      <template #extra>
        <a-space>
          <a-switch
            v-model:checked="showInactive"
            checked-children="显示已禁用"
            un-checked-children="隐藏已禁用"
          />
          <a-button type="link" @click="handleReload">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>

      <!-- 搜索和过滤栏 -->
      <div class="filter-row">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索分类名称或标识符"
          style="width: 300px; margin-right: 16px"
          allow-clear
          @change="handleSearch"
        />
        <a-radio-group
          v-model:value="filterStatus"
          button-style="solid"
          @change="handleStatusFilter"
        >
          <a-radio-button :value="null">全部</a-radio-button>
          <a-radio-button value="active">已启用</a-radio-button>
          <a-radio-button value="inactive">已禁用</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 批量操作按钮 -->
      <div class="batch-actions" v-if="selectedRowKeys.length > 0 && !isCoreMode">
        <a-space>
          <span class="selected-count">已选择 {{ selectedRowKeys.length }} 项</span>
          <a-dropdown>
            <a-button type="primary">
              批量操作
              <down-outlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="enable" @click="handleBatchToggleStatus(true)">
                  <check-outlined /> 启用选中项
                </a-menu-item>
                <a-menu-item key="disable" @click="handleBatchToggleStatus(false)">
                  <stop-outlined /> 禁用选中项
                </a-menu-item>
                <a-menu-item key="delete" @click="showBatchDeleteConfirm">
                  <delete-outlined /> 删除选中项
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button @click="clearSelection"> 取消选择 </a-button>
        </a-space>
      </div>

      <!-- 分类列表 -->
      <a-table
        :columns="columns"
        :data-source="filteredCategoryList"
        :loading="loading"
        :row-class-name="getRowClassName"
        :pagination="pagination"
        :row-selection="rowSelection"
      >
        <!-- 名称列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'drag'">
            <menu-outlined
              v-if="!record.isCore && !isCoreMode"
              class="drag-handle"
              style="cursor: grab"
            />
          </template>

          <template v-else-if="column.key === 'name'">
            <a-space>
              <component :is="record.icon || 'folder-outlined'" />
              <span>{{ record.name }}</span>
              <a-tag v-if="record.isCore" color="blue">核心</a-tag>
            </a-space>
          </template>

          <!-- 颜色列 -->
          <template v-else-if="column.key === 'color'">
            <div class="color-preview" :style="{ backgroundColor: record.color }" />
            {{ record.color }}
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'isActive'">
            <a-tag :color="record.isActive ? 'success' : 'error'">
              {{ record.isActive ? '启用' : '禁用' }}
            </a-tag>
          </template>

          <!-- 排序列 -->
          <template v-else-if="column.key === 'order'">
            <a-space>
              <span>{{ record.order }}</span>
              <div class="order-buttons">
                <a-button
                  type="link"
                  size="small"
                  @click="handleMoveUp(record)"
                  :disabled="isFirstItem(record) || record.isCore"
                >
                  <template #icon><up-outlined /></template>
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  @click="handleMoveDown(record)"
                  :disabled="isLastItem(record) || record.isCore"
                >
                  <template #icon><down-outlined /></template>
                </a-button>
              </div>
            </a-space>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-tooltip title="编辑">
                <a-button type="link" @click="handleEdit(record)" :disabled="record.isCore">
                  <template #icon><edit-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="record.isActive ? '禁用' : '启用'">
                <a-button type="link" @click="handleToggleStatus(record)" :disabled="record.isCore">
                  <template #icon>
                    <component :is="record.isActive ? 'stop-outlined' : 'check-outlined'" />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-popconfirm
                  title="确定要删除这个分类吗？"
                  @confirm="handleDelete(record)"
                  v-if="!record.isCore"
                >
                  <a-button type="link" danger>
                    <template #icon><delete-outlined /></template>
                  </a-button>
                </a-popconfirm>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 拖拽排序提示信息 -->
      <div class="drag-tip" v-if="!isCoreMode">
        <a-alert
          type="info"
          show-icon
          message="提示：您可以使用上下按钮来调整分类顺序。"
          style="margin-top: 16px"
        />
      </div>
    </a-card>

    <!-- 分类表单弹窗 -->
    <news-category-form
      v-model:visible="modalVisible"
      :category="selectedCategory"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsCategoryStore } from '@/stores/newsCategory'
import { message, Modal } from 'ant-design-vue'
import type { NewsCategory } from '@/services/newsCategory.service'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  ReloadOutlined,
  FolderOutlined,
  UpOutlined,
  DownOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue'
const NewsCategoryForm = defineAsyncComponent(() => import('./NewsCategoryForm.vue'))

const route = useRoute()
const store = useNewsCategoryStore()

// 状态
const modalVisible = ref(false)
const selectedCategory = ref<NewsCategory | null>(null)
const showInactive = ref(false)
const selectedRowKeys = ref<string[]>([])
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// 分页配置
const pagination = {
  pageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条记录`,
}

// 计算属性
const loading = computed(() => store.loading)
const isCoreMode = computed(() => route.query.mode === 'core')

// 过滤后的分类列表
const filteredCategoryList = computed(() => {
  let list = store.sortedCategories

  // 状态过滤
  if (filterStatus.value !== null) {
    const isActive = filterStatus.value === 'active'
    list = list.filter(item => item.isActive === isActive)
  }

  // 关键字搜索
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    list = list.filter(
      item =>
        item.name.toLowerCase().includes(keyword) ||
        item.key.toLowerCase().includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword))
    )
  }

  return list
})

// 表格行选择配置
const rowSelection = computed(() => {
  return {
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: string[]) => {
      selectedRowKeys.value = keys
    },
    getCheckboxProps: (record: NewsCategory) => ({
      disabled: record.isCore, // 核心分类不能选择
    }),
    columnWidth: 40,
  }
})

// 表格列定义
const columns = [
  {
    title: '',
    key: 'drag',
    width: 30,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
  },
  {
    title: '标识符',
    dataIndex: 'key',
    key: 'key',
  },
  {
    title: '颜色',
    dataIndex: 'color',
    key: 'color',
  },
  {
    title: '排序',
    dataIndex: 'order',
    key: 'order',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
]

// 方法
const loadData = () => {
  try {
    store.loadCategories(showInactive.value)
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '加载分类列表失败'
    message.error(errorMessage.value)
  }
}

const handleSearch = () => {
  // 实时搜索无需额外操作，由计算属性 filteredCategoryList 处理
}

const handleStatusFilter = () => {
  // 实时过滤无需额外操作，由计算属性 filteredCategoryList 处理
}

const handleReload = () => {
  loadData()
}

const showCreateModal = () => {
  selectedCategory.value = null
  modalVisible.value = true
}

const handleEdit = (record: NewsCategory) => {
  selectedCategory.value = record
  modalVisible.value = true
}

const handleDelete = async (record: NewsCategory) => {
  try {
    await store.deleteCategory(record._id)
    message.success('删除分类成功')
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '删除分类失败'
    message.error(errorMessage.value)
  }
}

const handleToggleStatus = async (record: NewsCategory) => {
  try {
    const action = record.isActive ? '禁用' : '启用'
    await store.updateCategory(record._id, {
      isActive: !record.isActive,
    })
    message.success(`${action}分类成功`)
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '更新分类状态失败'
    message.error(errorMessage.value)
  }
}

const handleFormSuccess = () => {
  modalVisible.value = false
  loadData()
}

const isFirstItem = (record: NewsCategory) => {
  const sortedList = store.sortedCategories
  return sortedList.length > 0 && sortedList[0]._id === record._id
}

const isLastItem = (record: NewsCategory) => {
  const sortedList = store.sortedCategories
  return sortedList.length > 0 && sortedList[sortedList.length - 1]._id === record._id
}

const handleMoveUp = async (record: NewsCategory) => {
  if (isFirstItem(record) || record.isCore) return

  const sortedList = store.sortedCategories
  const currentIndex = sortedList.findIndex(item => item._id === record._id)
  if (currentIndex <= 0) return

  const prevItem = sortedList[currentIndex - 1]
  const newOrder = [
    { id: record._id, order: prevItem.order },
    { id: prevItem._id, order: record.order },
  ]

  try {
    await store.updateCategoryOrder(newOrder)
    message.success('上移分类成功')
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '排序失败'
    message.error(errorMessage.value)
  }
}

const handleMoveDown = async (record: NewsCategory) => {
  if (isLastItem(record) || record.isCore) return

  const sortedList = store.sortedCategories
  const currentIndex = sortedList.findIndex(item => item._id === record._id)
  if (currentIndex < 0 || currentIndex >= sortedList.length - 1) return

  const nextItem = sortedList[currentIndex + 1]
  const newOrder = [
    { id: record._id, order: nextItem.order },
    { id: nextItem._id, order: record.order },
  ]

  try {
    await store.updateCategoryOrder(newOrder)
    message.success('下移分类成功')
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '排序失败'
    message.error(errorMessage.value)
  }
}

// 批量操作相关函数
const clearSelection = () => {
  selectedRowKeys.value = []
}

const showBatchDeleteConfirm = () => {
  if (!selectedRowKeys.value.length) return

  Modal.confirm({
    title: '批量删除分类',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个分类吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleBatchDelete(),
  })
}

const handleBatchDelete = async () => {
  try {
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const id of selectedRowKeys.value) {
      try {
        await store.deleteCategory(id)
        successCount++
      } catch (error: any) {
        failCount++
        errors.push(error.message || '未知错误')
      }
    }

    if (successCount > 0) {
      message.success(`成功删除 ${successCount} 个分类`)
    }

    if (failCount > 0) {
      message.warning(`${failCount} 个分类删除失败: ${errors.join(', ')}`)
    }

    selectedRowKeys.value = []
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = error.message || '批量删除失败'
    message.error(errorMessage.value)
  }
}

const handleBatchToggleStatus = async (isActive: boolean) => {
  try {
    let successCount = 0
    let failCount = 0
    const errors: string[] = []
    const action = isActive ? '启用' : '禁用'

    for (const id of selectedRowKeys.value) {
      try {
        await store.updateCategory(id, { isActive })
        successCount++
      } catch (error: any) {
        failCount++
        errors.push(error.message || '未知错误')
      }
    }

    if (successCount > 0) {
      message.success(`成功${action} ${successCount} 个分类`)
    }

    if (failCount > 0) {
      message.warning(`${failCount} 个分类${action}失败: ${errors.join(', ')}`)
    }

    selectedRowKeys.value = []
    errorMessage.value = null
  } catch (error: any) {
    errorMessage.value = `批量${isActive ? '启用' : '禁用'}失败: ${error.message}`
    message.error(errorMessage.value)
  }
}

const getRowClassName = (record: NewsCategory) => {
  if (!record.isActive) return 'inactive-row'
  if (record.isCore) return 'core-row'
  return ''
}

// 监听 showInactive 变化，重新加载数据
watch(showInactive, newValue => {
  loadData()
})

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.category-management {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
  }
}

.main-card {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.filter-row {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 4px;
  vertical-align: middle;
}

.batch-actions {
  margin-bottom: 16px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;

  .selected-count {
    font-weight: 500;
    margin-right: 8px;
  }
}

.order-buttons {
  display: inline-flex;
  flex-direction: column;
  margin-left: 4px;

  .ant-btn {
    padding: 0 4px;
    height: 14px;
    line-height: 1;
    font-size: 12px;
  }
}

:deep(.inactive-row) {
  background-color: #fafafa;
  opacity: 0.6;
}

:deep(.core-row) {
  background-color: #e6f7ff;
}

.drag-handle {
  cursor: grab;
  color: #aaa;
  font-size: 14px;
  &:hover {
    color: #666;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .category-management {
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .ant-input-search {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 8px;
  }

  .ant-radio-group {
    margin-bottom: 8px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  :deep(.ant-table) {
    overflow-x: auto;
  }

  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
    white-space: nowrap;
  }
}
</style>
