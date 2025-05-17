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
        <a-input v-model:value="formState.color" type="color" style="width: 100px" />
      </a-form-item>

      <!-- 图标 -->
      <a-form-item label="图标" name="icon">
        <a-select
          v-model:value="formState.icon"
          placeholder="选择图标（选填）"
          style="width: 200px"
          allow-clear
        >
          <a-select-option value="folder-outlined">文件夹</a-select-option>
          <a-select-option value="notification-outlined">通知</a-select-option>
          <a-select-option value="file-text-outlined">文档</a-select-option>
          <a-select-option value="book-outlined">书籍</a-select-option>
          <a-select-option value="sound-outlined">声音</a-select-option>
          <a-select-option value="video-camera-outlined">视频</a-select-option>
          <a-select-option value="picture-outlined">图片</a-select-option>
        </a-select>
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
import type { NewsCategory } from '@/api/modules/newsCategory'
import { useNewsCategoryStore } from '@/stores/newsCategory'

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
</style>
