<template>
  <div class="resource-categories">
    <div class="page-header">
      <h1>资源分类</h1>
      <a-space>
        <a-switch
          v-model:checked="showInactive"
          checked-children="显示已禁用"
          un-checked-children="隐藏已禁用"
          @change="loadData"
        />
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          添加分类
        </a-button>
      </a-space>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="categoryList"
        :loading="loading"
        rowKey="_id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <!-- 名称列 -->
          <template v-if="column.key === 'name'">
            <a-space>
              <FolderOutlined />
              <span>{{ record.name }}</span>
            </a-space>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'isActive'">
            <a-tag :color="record.isActive ? 'success' : 'error'">
              {{ record.isActive ? '启用' : '禁用' }}
            </a-tag>
          </template>

          <!-- 排序列 -->
          <template v-if="column.key === 'order'">
            <a-space>
              <span>{{ record.order }}</span>
              <div class="order-buttons">
                <a-button
                  type="link"
                  size="small"
                  @click="handleMoveUp(record)"
                  :disabled="isFirstItem(record)"
                >
                  <template #icon><UpOutlined /></template>
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  @click="handleMoveDown(record)"
                  :disabled="isLastItem(record)"
                >
                  <template #icon><DownOutlined /></template>
                </a-button>
              </div>
            </a-space>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="editCategory(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-button type="link" @click="handleToggleStatus(record)" :danger="record.isActive">
                <template #icon>
                  <component :is="record.isActive ? StopOutlined : CheckOutlined" />
                </template>
                {{ record.isActive ? '禁用' : '启用' }}
              </a-button>
              <a-popconfirm
                title="确定要删除这个分类吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteCategory(record._id)"
              >
                <a-button type="link" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑分类的模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEditing ? '编辑分类' : '添加分类'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
    >
      <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            placeholder="请输入分类描述"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="排序" name="order">
          <a-input-number v-model:value="formState.order" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  FolderOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import { useResourceCategoryStore } from '@/stores/resourceCategory'
import type { ResourceCategory } from '@/api/modules/resourceCategory'
import type { FormInstance } from 'ant-design-vue'

// 状态管理
const store = useResourceCategoryStore()

// 状态
const showInactive = ref(false)
const modalVisible = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formState = reactive({
  _id: '',
  name: '',
  description: '',
  order: 0,
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    {
      min: 2,
      max: 50,
      message: '分类名称长度应在2-50个字符之间',
      trigger: 'blur',
    },
  ],
  description: [{ max: 200, message: '描述不能超过200个字符', trigger: 'blur' }],
  order: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', message: '排序值必须为数字', trigger: 'blur' },
  ],
}

// 表格列定义
const columns = [
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
    width: '25%',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: '35%',
  },
  {
    title: '包含资源数',
    dataIndex: 'resourceCount',
    key: 'resourceCount',
    width: '10%',
  },
  {
    title: '排序',
    dataIndex: 'order',
    key: 'order',
    width: '10%',
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: '10%',
  },
  {
    title: '操作',
    key: 'action',
    align: 'center',
    width: '150px',
    fixed: 'right',
  },
]

// 计算属性
const loading = computed(() => store.loading)
const categoryList = computed(() => store.sortedCategories)

// 加载分类数据
const loadData = () => {
  store.loadCategories(showInactive.value)
}

// 显示添加模态框
const showAddModal = () => {
  isEditing.value = false
  formState._id = ''
  formState.name = ''
  formState.description = ''
  formState.order =
    categoryList.value.length > 0
      ? Math.max(...categoryList.value.map((c: ResourceCategory) => c.order)) + 1
      : 0
  modalVisible.value = true
}

// 编辑分类
const editCategory = (record: ResourceCategory) => {
  isEditing.value = true
  formState._id = record._id
  formState.name = record.name
  formState.description = record.description || ''
  formState.order = record.order
  modalVisible.value = true
}

// 处理模态框确认
const handleModalOk = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    modalLoading.value = true

    if (isEditing.value) {
      await store.updateCategory(formState._id, formState)
    } else {
      await store.createCategory(formState)
    }
    modalVisible.value = false
  } catch (error) {
    console.error('验证或保存失败:', error)
  } finally {
    modalLoading.value = false
  }
}

// 处理模态框取消
const handleModalCancel = () => {
  modalVisible.value = false
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 删除分类
const deleteCategory = async (id: string) => {
  try {
    await store.deleteCategory(id)
  } catch (error) {
    console.error(error)
  }
}

// 切换分类状态
const handleToggleStatus = async (record: ResourceCategory) => {
  try {
    await store.updateCategory(record._id, {
      isActive: !record.isActive,
    })
  } catch (error) {
    console.error(error)
  }
}

// 排序相关方法
const isFirstItem = (record: ResourceCategory) => {
  return categoryList.value.indexOf(record) === 0
}

const isLastItem = (record: ResourceCategory) => {
  return categoryList.value.indexOf(record) === categoryList.value.length - 1
}

const handleMoveUp = async (record: ResourceCategory) => {
  const index = categoryList.value.indexOf(record)
  if (index <= 0) return

  const prevItem = categoryList.value[index - 1]
  const newOrder = [
    { id: record._id, order: prevItem.order },
    { id: prevItem._id, order: record.order },
  ]

  try {
    await store.updateCategoryOrder(newOrder)
  } catch (error) {
    console.error(error)
  }
}

const handleMoveDown = async (record: ResourceCategory) => {
  const index = categoryList.value.indexOf(record)
  if (index === -1 || index === categoryList.value.length - 1) return

  const nextItem = categoryList.value[index + 1]
  const newOrder = [
    { id: record._id, order: nextItem.order },
    { id: nextItem._id, order: record.order },
  ]

  try {
    await store.updateCategoryOrder(newOrder)
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.resource-categories {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 24px;
  }
}

.order-buttons {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;

  .ant-btn {
    padding: 0 4px;
    height: 20px;
    line-height: 20px;
  }
}

:deep(.ant-table-row.inactive-row) {
  background-color: #fafafa;
  color: #999;
}
</style>
