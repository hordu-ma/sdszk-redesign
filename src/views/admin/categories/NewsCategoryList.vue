<!-- NewsCategoryList.vue - 新闻分类列表页面 -->
<template>
  <div class="category-management">
    <div class="page-header">
      <a-space>
        <h2>分类管理</h2>
        <a-tag v-if="route.query.mode === 'core'" color="blue">核心分类</a-tag>
      </a-space>
      <a-button type="primary" @click="showCreateModal" v-if="!isCoreMode">
        <template #icon><plus-outlined /></template>
        添加分类
      </a-button>
    </div>

    <a-card>
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

      <!-- 分类列表 -->
      <a-table
        :columns="columns"
        :data-source="categoryList"
        :loading="loading"
        :row-class-name="getRowClassName"
        :pagination="false"
      >
        <!-- 名称列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsCategoryStore } from '@/stores/newsCategory'
import { message } from 'ant-design-vue'
import type { NewsCategory } from '@/services/newsCategory.service'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  ReloadOutlined,
  FolderOutlined,
} from '@ant-design/icons-vue'
const NewsCategoryForm = defineAsyncComponent(() => import('./NewsCategoryForm.vue'))

const route = useRoute()
const store = useNewsCategoryStore()

// 状态
const modalVisible = ref(false)
const selectedCategory = ref<NewsCategory | null>(null)
const showInactive = ref(false)

// 计算属性
const loading = computed(() => store.loading)
const isCoreMode = computed(() => route.query.mode === 'core')
const categoryList = computed(() => store.sortedCategories)

// 表格列定义
const columns = [
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
  store.loadCategories(showInactive.value)
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
  } catch (error: any) {
    message.error(error.message)
  }
}

const handleToggleStatus = async (record: NewsCategory) => {
  try {
    await store.updateCategory(record._id, {
      isActive: !record.isActive,
    })
  } catch (error: any) {
    message.error(error.message)
  }
}

const handleFormSuccess = () => {
  modalVisible.value = false
  loadData()
}

const getRowClassName = (record: NewsCategory) => {
  if (!record.isActive) return 'inactive-row'
  if (record.isCore) return 'core-row'
  return ''
}

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

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 4px;
  vertical-align: middle;
}

:deep(.inactive-row) {
  background-color: #fafafa;
  opacity: 0.6;
}

:deep(.core-row) {
  background-color: #e6f7ff;
}
</style>
