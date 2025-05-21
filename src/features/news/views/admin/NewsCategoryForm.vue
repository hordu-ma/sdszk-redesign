<!-- NewsCategoryForm.vue - 新闻分类表单组件 -->
<template>
  <a-modal
    v-model:visible="visible"
    :title="category ? '编辑分类' : '添加分类'"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :confirmLoading="submitting"
    width="600px"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <!-- 分类名称 -->
      <a-form-item label="名称" name="name">
        <a-input
          v-model:value="formState.name"
          placeholder="请输入分类名称"
          :maxLength="50"
          show-count
        />
      </a-form-item>

      <!-- 分类标识符 -->
      <a-form-item label="标识符" name="key">
        <a-input
          v-model:value="formState.key"
          placeholder="请输入分类标识符，例如：news, notice"
          :maxLength="20"
          :disabled="category?.isCore"
        />
      </a-form-item>

      <!-- 描述 -->
      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="formState.description"
          placeholder="请输入分类描述（选填）"
          :maxLength="200"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          show-count
        />
      </a-form-item>

      <!-- 颜色选择器 -->
      <a-form-item label="颜色" name="color">
        <div class="color-picker-container">
          <a-input v-model:value="formState.color" type="color" style="width: 100px" />
          <div class="color-preview" :style="{ backgroundColor: formState.color }">
            <span :style="{ color: getContrastColor(formState.color) }">预览文本</span>
          </div>
        </div>
      </a-form-item>

      <!-- 图标 -->
      <a-form-item label="图标" name="icon">
        <div class="icon-selector-container">
          <a-select
            v-model:value="formState.icon"
            placeholder="选择图标（选填）"
            style="width: 200px"
            allow-clear
          >
            <a-select-option value="folder-outlined">
              <span class="icon-option">
                <folder-outlined />
                <span>文件夹</span>
              </span>
            </a-select-option>
            <a-select-option value="notification-outlined">
              <span class="icon-option">
                <notification-outlined />
                <span>通知</span>
              </span>
            </a-select-option>
            <a-select-option value="file-text-outlined">
              <span class="icon-option">
                <file-text-outlined />
                <span>文档</span>
              </span>
            </a-select-option>
            <a-select-option value="book-outlined">
              <span class="icon-option">
                <book-outlined />
                <span>书籍</span>
              </span>
            </a-select-option>
            <a-select-option value="sound-outlined">
              <span class="icon-option">
                <sound-outlined />
                <span>声音</span>
              </span>
            </a-select-option>
            <a-select-option value="video-camera-outlined">
              <span class="icon-option">
                <video-camera-outlined />
                <span>视频</span>
              </span>
            </a-select-option>
            <a-select-option value="picture-outlined">
              <span class="icon-option">
                <picture-outlined />
                <span>图片</span>
              </span>
            </a-select-option>
          </a-select>
          <div v-if="formState.icon" class="icon-preview">
            <component :is="formState.icon" />
          </div>
        </div>
      </a-form-item>

      <!-- 排序值 -->
      <a-form-item label="排序" name="order">
        <a-input-number v-model:value="formState.order" :min="0" :max="999" style="width: 100px" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
const __name = 'NewsCategoryForm'
export default { name: __name }
</script>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { Form, message } from 'ant-design-vue'
import type { NewsCategory } from '@/services/newsCategory.service'
import { useNewsCategoryStore } from '@/stores/newsCategory'
import {
  FolderOutlined,
  NotificationOutlined,
  FileTextOutlined,
  BookOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue'

interface Props {
  visible?: boolean
  category?: NewsCategory | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  category: null,
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  success: []
}>()

// 表单实例
const formRef = ref()

// 加载状态
const submitting = ref(false)

// 分类Store
const store = useNewsCategoryStore()

// 表单数据
const formState = reactive({
  name: '',
  key: '',
  description: '',
  color: '#1890ff',
  icon: '',
  order: computed(() => (props.category?.order ?? store.sortedCategories.length) as number),
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2-50个字符', trigger: 'blur' },
  ],
  key: [
    { required: true, message: '请输入分类标识符', trigger: 'blur' },
    { min: 2, max: 20, message: '长度应为2-20个字符', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9-]*$/,
      message: '标识符只能包含小写字母、数字和连字符，且必须以字母开头',
      trigger: 'blur',
    },
  ],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
  color: [{ required: true, message: '请选择颜色', trigger: 'change' }],
  order: [{ required: true, type: 'number', message: '请输入排序值', trigger: 'blur' }],
}

// 初始化表单数据
const resetForm = () => {
  Object.assign(formState, {
    name: props.category?.name ?? '',
    key: props.category?.key ?? '',
    description: props.category?.description ?? '',
    color: props.category?.color ?? '#1890ff',
    icon: props.category?.icon ?? '',
  })
}

// 获取对比颜色
const getContrastColor = (color: string): string => {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 125 ? '#000000' : '#FFFFFF'
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    const values = await formRef.value.validateFields()
    submitting.value = true

    if (props.category) {
      await store.updateCategory(props.category._id, values)
    } else {
      await store.createCategory(values)
    }

    emit('success')
    emit('update:visible', false)
    resetForm()
  } catch (error: any) {
    if (!error.errorFields) {
      message.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 处理取消
const handleCancel = () => {
  formRef.value?.resetFields()
  emit('update:visible', false)
}

// 监听Props变化
watchEffect(() => {
  if (props.visible) {
    resetForm()
  }
})
</script>

<style scoped>
.ant-form {
  padding: 24px 0;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview {
  width: 100px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.icon-selector-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}
</style>
