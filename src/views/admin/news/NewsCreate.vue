<template>
  <div class="news-create">
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
          <h2>发布新闻</h2>
          <p>创建并发布新的新闻内容</p>
        </div>
      </div>
      <div class="header-right">
        <a-button @click="handleSaveDraft" :loading="saving"> 保存草稿 </a-button>
        <a-button type="primary" @click="handlePublish" :loading="publishing"> 发布新闻 </a-button>
      </div>
    </div>

    <!-- 新闻表单 -->
    <div class="form-container">
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

                <a-form-item label="发布时间" name="publishTime">
                  <a-date-picker
                    v-model:value="formData.publishTime"
                    show-time
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder="立即发布"
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
                  <a-upload
                    v-model:file-list="imageFileList"
                    list-type="picture-card"
                    class="featured-image-uploader"
                    :before-upload="beforeUpload"
                    :custom-request="handleImageUpload"
                    :show-upload-list="false"
                  >
                    <div v-if="formData.featuredImage" class="image-preview">
                      <img :src="formData.featuredImage" alt="特色图片" />
                      <div class="image-actions">
                        <a-button type="text" size="small" @click.stop="handleRemoveImage">
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
                  </a-upload>
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
            </div>
          </a-col>
        </a-row>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { adminNewsApi, type NewsFormData } from '@/api/modules/adminNews'
import { NewsCategoryApi, type NewsCategory } from '@/api/modules/newsCategory'

// 创建分类API实例
const newsCategoryApi = new NewsCategoryApi()
import type { Rule } from 'ant-design-vue/es/form'
import type { UploadProps } from 'ant-design-vue'

// 引入富文本编辑器（这里使用一个简单的示例，实际项目中可以使用更完善的编辑器）
let editor: any = null

const router = useRouter()
const formRef = ref()
const editorRef = ref<HTMLElement>()

// 状态管理
const saving = ref(false)
const publishing = ref(false)
const categories = ref<NewsCategory[]>([])
const imageFileList = ref([])

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
  content: [
    { required: true, message: '请输入新闻内容', trigger: 'blur' },
    { min: 50, message: '内容长度不能少于50个字符', trigger: 'blur' },
  ],
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

  // 这里使用一个简单的文本编辑器示例
  // 实际项目中可以集成更完善的富文本编辑器，如 TinyMCE、Quill 等
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

// 图片上传前验证
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!')
    return false
  }
  const isLt2M = file.size! / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
    return false
  }
  return false // 阻止自动上传
}

// 处理图片上传
const handleImageUpload = async ({ file }: any) => {
  try {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    // 调用上传API
    // 注意：这里需要替换为实际的上传API
    // const { data } = await uploadApi.uploadImage(uploadFormData)
    // formData.featuredImage = data.url

    // 临时使用本地预览（在API实现前使用）
    const reader = new FileReader()
    reader.onload = e => {
      formData.featuredImage = e.target?.result as string
    }
    reader.readAsDataURL(file)

    message.success('图片上传成功')
  } catch (error: any) {
    message.error(error.message || '图片上传失败')
  }
}

// 移除图片
const handleRemoveImage = () => {
  formData.featuredImage = ''
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    saving.value = true
    formData.status = 'draft'

    await formRef.value.validate()
    await adminNewsApi.create(formData)

    message.success('草稿保存成功')
    router.push('/admin/news/list')
  } catch (error: any) {
    if (error.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(error.message || '保存草稿失败')
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
    await adminNewsApi.create(formData)

    message.success('新闻发布成功')
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

onMounted(() => {
  fetchCategories()
  initEditor()
})

onBeforeUnmount(() => {
  // 清理编辑器
  if (editor) {
    editor.remove()
  }
})
</script>

<style scoped lang="scss">
.news-create {
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

  .editor-container {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;

    .editor {
      min-height: 400px;

      :deep(.editor-textarea) {
        width: 100%;
        border: none;
        outline: none;
        padding: 16px;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        font-family: inherit;
      }
    }
  }

  .image-upload {
    .featured-image-uploader {
      :deep(.ant-upload-select) {
        width: 100%;
        height: 120px;
        margin: 0;
      }
    }

    .image-preview {
      position: relative;
      width: 100%;
      height: 120px;
      border-radius: 6px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-actions {
        position: absolute;
        top: 8px;
        right: 8px;

        .ant-btn {
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: none;

          &:hover {
            background: rgba(0, 0, 0, 0.7);
          }
        }
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 120px;
      color: #999;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }

      .upload-text {
        margin-top: 8px;
        font-size: 14px;
      }
    }

    .upload-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  }
}

@media (max-width: 1200px) {
  .news-create {
    .form-container {
      :deep(.ant-col) {
        &:first-child {
          margin-bottom: 24px;
        }
      }
    }
  }
}
</style>
