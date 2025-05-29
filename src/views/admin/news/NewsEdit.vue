<template>
  <div class="news-edit">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="$router.back()" class="back-btn">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          返回
        </a-button>
        <div class="title-section">
          <h2>编辑新闻</h2>
          <p>编辑现有的新闻内容</p>
        </div>
      </div>
      <div class="header-right">
        <a-button @click="handleSave" :loading="saving"> 保存修改 </a-button>
        <a-button type="primary" @click="handlePublish" :loading="publishing">
          {{ formData.status === 'published' ? '更新发布' : '发布新闻' }}
        </a-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <!-- 新闻表单 -->
    <div v-else class="form-container">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <!-- 左侧主要内容 -->
          <a-col :span="16">
            <div class="main-content">
              <!-- 标题 -->
              <a-form-item label="新闻标题" name="title">
                <a-input
                  v-model:value="formData.title"
                  placeholder="请输入新闻标题"
                  size="large"
                  show-count
                  :maxlength="100"
                />
              </a-form-item>

              <!-- 摘要 -->
              <a-form-item label="新闻摘要" name="summary">
                <a-textarea
                  v-model:value="formData.summary"
                  placeholder="请输入新闻摘要（可选）"
                  :rows="3"
                  show-count
                  :maxlength="200"
                />
              </a-form-item>

              <!-- 内容编辑器 -->
              <a-form-item label="新闻内容" name="content">
                <div class="editor-container">
                  <div ref="editorRef" class="editor"></div>
                </div>
              </a-form-item>
            </div>
          </a-col>

          <!-- 右侧设置面板 -->
          <a-col :span="8">
            <div class="settings-panel">
              <!-- 发布设置 -->
              <a-card title="发布设置" size="small" class="setting-card">
                <a-form-item label="新闻分类" name="categoryId">
                  <a-select
                    v-model:value="formData.categoryId"
                    placeholder="请选择分类"
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

                <a-form-item label="发布状态">
                  <a-tag :color="getStatusColor(formData.status)">
                    {{ getStatusText(formData.status) }}
                  </a-tag>
                </a-form-item>

                <a-form-item label="发布时间" name="publishTime">
                  <a-date-picker
                    v-model:value="formData.publishTime"
                    show-time
                    format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </a-form-item>

                <a-form-item label="标签" name="tags">
                  <a-select
                    v-model:value="formData.tags"
                    mode="tags"
                    placeholder="请输入标签"
                    :max-tag-count="5"
                  />
                </a-form-item>
              </a-card>

              <!-- 特色图片 -->
              <a-card title="特色图片" size="small" class="setting-card">
                <div class="image-upload">
                  <div v-if="formData.featuredImage" class="image-preview">
                    <img :src="formData.featuredImage" alt="特色图片" />
                    <div class="image-actions">
                      <a-button type="text" size="small" @click="handleRemoveImage">
                        <template #icon>
                          <DeleteOutlined />
                        </template>
                      </a-button>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <PlusOutlined />
                    <div class="upload-text">上传图片</div>
                  </div>
                  <div class="upload-tip">建议尺寸：800x600px</div>
                </div>
              </a-card>

              <!-- 高级设置 -->
              <a-card title="高级设置" size="small" class="setting-card">
                <a-form-item>
                  <a-checkbox v-model:checked="formData.isTop"> 置顶新闻 </a-checkbox>
                </a-form-item>
                <a-form-item>
                  <a-checkbox v-model:checked="formData.isFeatured"> 精选新闻 </a-checkbox>
                </a-form-item>
              </a-card>

              <!-- 统计信息 -->
              <a-card title="统计信息" size="small" class="setting-card">
                <div class="stats-info">
                  <div class="stat-item">
                    <span class="label">浏览量：</span>
                    <span class="value">{{ newsData?.views || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">创建时间：</span>
                    <span class="value">{{ formatDate(newsData?.createdAt) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">更新时间：</span>
                    <span class="value">{{ formatDate(newsData?.updatedAt) }}</span>
                  </div>
                </div>
              </a-card>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { adminNewsApi, type NewsFormData, type NewsItem } from '@/api/modules/adminNews'
import { NewsCategoryApi, type NewsCategory } from '@/api/modules/newsCategory'

// 创建分类API实例
const newsCategoryApi = new NewsCategoryApi()
import type { Rule } from 'ant-design-vue/es/form'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const formRef = ref()
const editorRef = ref<HTMLElement>()

// 状态管理
const loading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const categories = ref<NewsCategory[]>([])
const newsData = ref<NewsItem>()

let editor: any = null

// 表单数据
const formData = reactive<NewsFormData>({
  title: '',
  content: '',
  summary: '',
  categoryId: undefined as any,
  featuredImage: '',
  tags: [],
  status: 'draft',
  isTop: false,
  isFeatured: false,
  publishTime: undefined,
})

// 表单验证规则
const rules: Record<string, Rule[]> = {
  title: [
    { required: true, message: '请输入新闻标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度应在5-100个字符之间', trigger: 'blur' },
  ],
  categoryId: [{ required: true, message: '请选择新闻分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入新闻内容', trigger: 'blur' }],
}

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

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取新闻详情
const fetchNewsDetail = async () => {
  try {
    loading.value = true
    const { data } = await adminNewsApi.getDetail(Number(props.id))
    newsData.value = data

    // 填充表单数据
    Object.assign(formData, {
      title: data.title,
      content: data.content,
      summary: data.summary,
      categoryId: data.categoryId,
      featuredImage: data.featuredImage,
      tags: data.tags,
      status: data.status,
      isTop: data.isTop,
      isFeatured: data.isFeatured,
      publishTime: data.publishTime ? new Date(data.publishTime) : undefined,
    })

    // 设置编辑器内容
    if (editor) {
      editor.value = data.content
    }
  } catch (error: any) {
    message.error(error.message || '获取新闻详情失败')
    router.push('/admin/news/list')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const { data } = await newsCategoryApi.getList()
    categories.value = data
  } catch (error: any) {
    message.error(error.message || '获取分类列表失败')
  }
}

// 初始化富文本编辑器
const initEditor = () => {
  if (!editorRef.value) return

  const textarea = document.createElement('textarea')
  textarea.className = 'editor-textarea'
  textarea.rows = 20
  textarea.placeholder = '请输入新闻内容...'
  textarea.addEventListener('input', e => {
    formData.content = (e.target as HTMLTextAreaElement).value
  })

  editorRef.value.appendChild(textarea)
  editor = textarea
}

// 移除图片
const handleRemoveImage = () => {
  formData.featuredImage = ''
}

// 保存修改
const handleSave = async () => {
  try {
    saving.value = true

    await formRef.value.validate()
    await adminNewsApi.update(Number(props.id), formData)

    message.success('保存成功')
    router.push('/admin/news/list')
  } catch (error: any) {
    if (error.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(error.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 发布新闻
const handlePublish = async () => {
  try {
    publishing.value = true
    formData.status = 'published'

    await formRef.value.validate()
    await adminNewsApi.update(Number(props.id), formData)

    message.success('发布成功')
    router.push('/admin/news/list')
  } catch (error: any) {
    if (error.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(error.message || '发布失败')
    }
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  initEditor()
  await fetchCategories()
  await fetchNewsDetail()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.remove()
  }
})
</script>

<style scoped lang="scss">
// 复用 NewsCreate 的样式
.news-edit {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;

      .back-btn {
        margin-top: 4px;
        color: #666;

        &:hover {
          color: #1890ff;
        }
      }

      .title-section {
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

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .form-container {
    .main-content {
      background: #fff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .settings-panel {
      .setting-card {
        margin-bottom: 16px;

        :deep(.ant-card-head) {
          padding: 12px 16px;
          min-height: auto;

          .ant-card-head-title {
            font-size: 14px;
            font-weight: 500;
          }
        }

        :deep(.ant-card-body) {
          padding: 16px;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.stats-info {
  .stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #666;
      font-size: 14px;
    }

    .value {
      color: #333;
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
