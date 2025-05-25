<template>
  <div class="resources-categories">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>资源分类管理</h2>
        <p>管理资源分类，包括创建、编辑、删除等操作</p>
      </div>
      <div class="header-right">
        <a-button
          typconst
          showEditModal="(record:"
          Resoconst
          handleDelete="async"
          (record:
          ResourceCategory)=""
        >
          { try { const resourceCategoryApi = new ResourceCategoryApi() await
          resourceCategoryApi.delete(record._id) message.success('删除成功') await fetchCategories()
          } catch (error: any) { message.error(error.message || '删除失败') } }ory) => {
          editingCategory.value = record modalForm.name = record.name modalForm.description =
          record.description || '' modalForm.color = '#1890ff' // ResourceCategory 接口中没有 color
          属性，使用默认值 modalForm.sort = record.order || 0 modalForm.status = record.isActive
          modalVisible.value = true }y" @click="showCreateModal">
          <template #icon>
            <PlusOutlined />
          </template>
          新建分类
        </a-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-list">
      <a-table
        :columns="columns"
        :data-source="categories"
        :loading="loading"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="category-name">
              <span class="name-text">{{ record.name }}</span>
              <a-tag v-if="record.isDefault" color="gold" size="small">默认</a-tag>
            </div>
          </template>

          <template v-if="column.key === 'color'">
            <div class="color-preview">
              <div class="color-box" :style="{ backgroundColor: record.color || '#1890ff' }"></div>
              <span>{{ record.color || '#1890ff' }}</span>
            </div>
          </template>

          <template v-if="column.key === 'resourceCount'">
            <a-badge
              :count="record.resourceCount || 0"
              :number-style="{ backgroundColor: '#52c41a' }"
            />
          </template>

          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :loading="record.updating"
              @change="onStatusChange(record)"
            />
          </template>

          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="handleEdit(record)"
                :disabled="record.isDefault"
              >
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除此分类吗？删除后该分类下的资源将移至未分类。"
                @confirm="handleDelete(record)"
                :disabled="record.isDefault"
              >
                <a-button type="link" size="small" danger :disabled="record.isDefault">
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 创建/编辑分类模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingCategory ? '编辑分类' : '新建分类'"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form ref="modalFormRef" :model="modalForm" :rules="modalRules" layout="vertical">
        <a-form-item label="分类名称" name="name">
          <a-input
            v-model:value="modalForm.name"
            placeholder="请输入分类名称"
            :maxlength="50"
            show-count
          />
        </a-form-item>

        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="modalForm.description"
            placeholder="请输入分类描述（可选）"
            :maxlength="200"
            :rows="3"
            show-count
          />
        </a-form-item>

        <a-form-item label="分类颜色" name="color">
          <div class="color-picker">
            <a-input
              v-model:value="modalForm.color"
              placeholder="请选择或输入颜色值"
              style="flex: 1"
            />
            <input type="color" v-model="modalForm.color" class="color-input" />
          </div>
        </a-form-item>

        <a-form-item label="排序" name="sort">
          <a-input-number
            v-model:value="modalForm.sort"
            placeholder="数字越小排序越靠前"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item name="status">
          <a-checkbox v-model:checked="modalForm.status"> 启用分类 </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ResourceCategoryApi, type ResourceCategory } from '@/api/modules/resourceCategory'

// 创建API实例
const resourceCategoryApi = new ResourceCategoryApi()
import type { Rule } from 'ant-design-vue/es/form'
import dayjs from 'dayjs'

// 状态管理
const loading = ref(false)
const modalVisible = ref(false)
const modalLoading = ref(false)
const categories = ref<ResourceCategory[]>([])
const editingCategory = ref<ResourceCategory | null>(null)

// 表单引用
const modalFormRef = ref()

// 模态框表单数据
const modalForm = reactive({
  name: '',
  description: '',
  color: '#1890ff',
  sort: 0,
  status: true,
})

// 表格列配置
const columns = [
  {
    title: '分类名称',
    key: 'name',
    dataIndex: 'name',
    width: 200,
  },
  {
    title: '描述',
    key: 'description',
    dataIndex: 'description',
    ellipsis: true,
  },
  {
    title: '颜色',
    key: 'color',
    width: 120,
  },
  {
    title: '资源数量',
    key: 'resourceCount',
    width: 120,
  },
  {
    title: '排序',
    key: 'sort',
    dataIndex: 'sort',
    width: 100,
    sorter: (a: any, b: any) => a.sort - b.sort,
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    key: 'createdAt',
    dataIndex: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
  },
]

// 表单验证规则
const modalRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度应在2-50个字符之间', trigger: 'blur' },
  ],
  sort: [{ type: 'number', min: 0, max: 999, message: '排序值应在0-999之间', trigger: 'blur' }],
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const resourceCategoryApi = new ResourceCategoryApi()
    const { data } = await resourceCategoryApi.getList()
    categories.value = data.sort((a: any, b: any) => a.order - b.order)
  } catch (error: any) {
    message.error(error.message || '获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 显示创建模态框
const showCreateModal = () => {
  editingCategory.value = null
  resetModalForm()
  modalVisible.value = true
}

// 编辑分类
const handleEdit = (record: ResourceCategory) => {
  editingCategory.value = record
  modalForm.name = record.name
  modalForm.description = record.description || ''
  modalForm.color = record.color || '#1890ff'
  modalForm.sort = record.order || 0
  modalForm.status = record.isActive
  modalVisible.value = true
}

// 状态变更包装器（为了解决TypeScript类型推断问题）
const onStatusChange = (record: ResourceCategory) => (checked: boolean) => {
  handleStatusChange(record, checked)
}

// 状态变更
const handleStatusChange = async (
  record: ResourceCategory & { updating?: boolean },
  checked: boolean
) => {
  record.updating = true
  try {
    await resourceCategoryApi.update(record._id, { isActive: checked })
    record.isActive = checked
    message.success('状态更新成功')
  } catch (error: any) {
    record.isActive = !checked // 恢复原状态
    message.error(error.message || '状态更新失败')
  } finally {
    record.updating = false
  }
}

// 删除分类
const handleDelete = async (record: ResourceCategory) => {
  try {
    await resourceCategoryApi.delete(record._id)
    message.success('删除成功')
    fetchCategories()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

// 模态框确认
const handleModalOk = async () => {
  try {
    await modalFormRef.value.validate()
    modalLoading.value = true

    // Transform form data to API format
    const apiData = {
      name: modalForm.name,
      description: modalForm.description,
      order: modalForm.sort,
      isActive: modalForm.status,
    }

    if (editingCategory.value) {
      // 编辑
      await resourceCategoryApi.update(editingCategory.value._id, apiData)
      message.success('编辑成功')
    } else {
      // 创建
      await resourceCategoryApi.create(apiData)
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchCategories()
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return
    }
    message.error(error.message || '操作失败')
  } finally {
    modalLoading.value = false
  }
}

// 模态框取消
const handleModalCancel = () => {
  modalVisible.value = false
  resetModalForm()
}

// 重置模态框表单
const resetModalForm = () => {
  modalForm.name = ''
  modalForm.description = ''
  modalForm.color = '#1890ff'
  modalForm.sort = 0
  modalForm.status = true
  modalFormRef.value?.resetFields()
}

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped lang="scss">
.resources-categories {
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

  .categories-list {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .category-name {
      display: flex;
      align-items: center;
      gap: 8px;

      .name-text {
        font-weight: 500;
      }
    }

    .color-preview {
      display: flex;
      align-items: center;
      gap: 8px;

      .color-box {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid #d9d9d9;
      }
    }
  }

  .color-picker {
    display: flex;
    align-items: center;
    gap: 8px;

    .color-input {
      width: 40px;
      height: 32px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      cursor: pointer;

      &::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      &::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
      }
    }
  }
}
</style>
