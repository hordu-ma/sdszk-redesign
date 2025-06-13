<template>
  <div class="resources-create">
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
          <h2>创建资源</h2>
          <p>上传并发布新的教学资源</p>
        </div>
      </div>
      <div class="header-right">
        <a-button @click="handleSaveDraft" :loading="saving"> 保存草稿 </a-button>
        <a-button type="primary" @click="handlePublish" :loading="publishing"> 发布资源 </a-button>
      </div>
    </div>

    <!-- 资源表单 -->
    <div class="form-container">
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <!-- 左侧主要内容 -->
          <a-col :span="16">
            <div class="main-content">
              <!-- 基本信息 -->
              <a-card title="基本信息" class="section-card">
                <a-form-item label="资源标题" name="title">
                  <a-input
                    v-model:value="formData.title"
                    placeholder="请输入资源标题"
                    size="large"
                    show-count
                    :maxlength="100"
                  />
                </a-form-item>

                <a-form-item label="资源描述" name="description">
                  <QuillEditor
                    ref="quillEditorRef"
                    v-model="formData.description"
                    placeholder="请输入资源描述..."
                    height="300px"
                  />
                </a-form-item>

                <a-form-item label="资源摘要" name="summary">
                  <a-textarea
                    v-model:value="formData.summary"
                    placeholder="请输入资源摘要（可选）"
                    :rows="3"
                    show-count
                    :maxlength="300"
                  />
                </a-form-item>
              </a-card>

              <!-- 文件上传 -->
              <a-card title="文件上传" class="section-card">
                <div class="file-upload">
                  <a-upload-dragger
                    v-model:file-list="fileList"
                    name="file"
                    :multiple="false"
                    :before-upload="beforeUpload"
                    @change="handleFileChange"
                    class="resource-uploader"
                  >
                    <p class="ant-upload-drag-icon">
                      <InboxOutlined style="font-size: 48px; color: #1890ff" />
                    </p>
                    <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p class="ant-upload-hint">
                      支持单个文件上传。支持格式：PDF、DOC、DOCX、PPT、PPTX、XLS、XLSX、ZIP、RAR、MP4、MP3、JPG、PNG等
                    </p>
                  </a-upload-dragger>

                  <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                    <a-progress :percent="uploadProgress" />
                  </div>
                </div>
              </a-card>

              <!-- 多媒体预览 -->
              <a-card v-if="formData.fileUrl" title="文件预览" class="section-card">
                <div class="file-preview">
                  <!-- 图片预览 -->
                  <div v-if="isImageFile" class="image-preview">
                    <img :src="formData.fileUrl" alt="预览图片" />
                  </div>

                  <!-- 视频预览 -->
                  <div v-else-if="isVideoFile" class="video-preview">
                    <video :src="formData.fileUrl" controls width="100%"></video>
                  </div>

                  <!-- 音频预览 -->
                  <div v-else-if="isAudioFile" class="audio-preview">
                    <audio :src="formData.fileUrl" controls style="width: 100%"></audio>
                  </div>

                  <!-- 文档文件信息 -->
                  <div v-else class="file-info">
                    <div class="file-icon">
                      <FileOutlined style="font-size: 48px; color: #1890ff" />
                    </div>
                    <div class="file-details">
                      <h4>{{ formData.fileName }}</h4>
                      <p>文件大小: {{ formatFileSize(formData.fileSize) }}</p>
                      <p>文件类型: {{ formData.fileType }}</p>
                    </div>
                  </div>
                </div>
              </a-card>
            </div>
          </a-col>

          <!-- 右侧设置面板 -->
          <a-col :span="8">
            <div class="settings-panel">
              <!-- 发布设置 -->
              <a-card title="发布设置" size="small" class="setting-card">
                <a-form-item label="资源分类" name="categoryId">
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

                <a-form-item label="资源类型" name="type">
                  <a-select v-model:value="formData.type" placeholder="请选择类型">
                    <a-select-option value="document">文档</a-select-option>
                    <a-select-option value="video">视频</a-select-option>
                    <a-select-option value="image">图片</a-select-option>
                    <a-select-option value="audio">音频</a-select-option>
                    <a-select-option value="other">其他</a-select-option>
                  </a-select>
                </a-form-item>

                <a-form-item label="发布时间" name="publishDate">
                  <a-date-picker
                    v-model:value="formData.publishDate"
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

              <!-- 访问权限 -->
              <a-card title="访问权限" size="small" class="setting-card">
                <a-form-item name="accessLevel">
                  <a-radio-group v-model:value="formData.accessLevel">
                    <a-radio value="public">公开</a-radio>
                    <a-radio value="registered">注册用户</a-radio>
                    <a-radio value="vip">VIP用户</a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.allowDownload"> 允许下载 </a-checkbox>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.allowComment"> 允许评论 </a-checkbox>
                </a-form-item>
              </a-card>

              <!-- 高级设置 -->
              <a-card title="高级设置" size="small" class="setting-card">
                <a-form-item>
                  <a-checkbox v-model:checked="formData.isFeatured"> 推荐资源 </a-checkbox>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.isTop"> 置顶显示 </a-checkbox>
                </a-form-item>

                <a-form-item label="排序权重" name="sortOrder">
                  <a-input-number
                    v-model:value="formData.sortOrder"
                    placeholder="数字越大排序越靠前"
                    :min="0"
                    :max="999"
                    style="width: 100%"
                  />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, InboxOutlined, FileOutlined } from '@ant-design/icons-vue'
import { adminResourceApi, type ResourceFormData } from '@/api/modules/adminResource'
import { ResourceCategoryApi, type ResourceCategory } from '@/api/modules/resourceCategory'
import QuillEditor from '@/components/common/QuillEditor.vue'

// 创建分类API实例
const resourceCategoryApi = new ResourceCategoryApi()
import type { Rule } from 'ant-design-vue/es/form'
import type { UploadProps } from 'ant-design-vue'

// 引入富文本编辑器

const router = useRouter()
const formRef = ref()
const quillEditorRef = ref()

// 状态管理
const saving = ref(false)
const publishing = ref(false)
const uploadProgress = ref(0)
const categories = ref<ResourceCategory[]>([])
const fileList = ref([])

// 表单数据
const formData = reactive<ResourceFormData>({
  title: '',
  description: '',
  categoryId: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  fileType: '',
  tags: [],
  status: 'draft',
  isTop: false,
  isFeatured: false,
  downloadPermission: 'public',
})

// 表单验证规则
const rules: Record<string, Rule[]> = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2-100个字符之间', trigger: 'blur' },
  ],
  description: [{ required: true, message: '请输入资源描述', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择资源分类', trigger: 'change' }],
  fileUrl: [{ required: true, message: '请上传资源文件', trigger: 'change' }],
}

// 文件类型判断
const isImageFile = computed(() => {
  return formData.fileType?.includes('image')
})

const isVideoFile = computed(() => {
  return formData.fileType?.includes('video')
})

const isAudioFile = computed(() => {
  return formData.fileType?.includes('audio')
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await resourceCategoryApi.getList()
    const data = (response as any)?.data?.data || []
    categories.value = data
  } catch (error: any) {
    message.error(error.message || '获取分类列表失败')
  }
}

// 文件上传前验证
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'audio/mp3',
    'audio/mpeg',
    'image/jpeg',
    'image/png',
    'image/gif',
  ]

  if (!allowedTypes.includes(file.type)) {
    message.error('不支持的文件格式!')
    return false
  }

  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    message.error('文件大小不能超过 100MB!')
    return false
  }

  return false // 阻止自动上传，手动处理
}

// 文件变化处理
const handleFileChange = async (info: any) => {
  if (info.file) {
    const file = info.file
    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    formData.fileName = file.name
    formData.fileSize = file.size
    formData.fileType = file.type

    // 实际文件上传
    try {
      uploadProgress.value = 10
      console.log('🚀 Starting file upload...')

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      uploadProgress.value = 30

      const response = await adminResourceApi.upload(formDataUpload, (progressEvent: any) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value = Math.min(30 + percent * 0.7, 100) // 30% + 70% for actual upload
        }
      })

      console.log('✅ Upload response:', response)

      // 兼容不同的响应格式
      const uploadData = (response as any).data?.data || response.data
      if (uploadData?.fileUrl) {
        formData.fileUrl = uploadData.fileUrl
        uploadProgress.value = 100
        message.success('文件上传成功')
        console.log('📎 File URL set:', formData.fileUrl)
      } else {
        throw new Error('上传响应格式错误: ' + JSON.stringify((response as any).data))
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)

      uploadProgress.value = 0
      message.error(error.message || error.response?.data?.message || '文件上传失败')

      // 清除文件信息
      formData.fileName = ''
      formData.fileSize = 0
      formData.fileType = ''
      formData.fileUrl = ''
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    saving.value = true
    formData.status = 'draft'

    console.log('💾 Saving draft with data:', formData)

    await formRef.value.validate()
    const response = await adminResourceApi.create(formData)

    console.log('✅ Draft saved:', response)
    message.success('草稿保存成功')
    router.push('/admin/resources/list')
  } catch (error: any) {
    console.error('❌ Save draft error:', error)
    if (error.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(error.message || error.response?.data?.message || '保存草稿失败')
    }
  } finally {
    saving.value = false
  }
}

// 发布资源
const handlePublish = async () => {
  try {
    publishing.value = true
    formData.status = 'published'

    console.log('📢 Publishing with data:', formData)

    await formRef.value.validate()
    const response = await adminResourceApi.create(formData)

    console.log('✅ Published:', response)
    message.success('资源发布成功')
    router.push('/admin/resources/list')
  } catch (error: any) {
    console.error('❌ Publish error:', error)
    if (error.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(error.message || error.response?.data?.message || '发布失败')
    }
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  // 检查认证状态
  const token = localStorage.getItem('token')
  console.log('🔐 Auth token:', token ? 'Present' : 'Missing')

  if (!token) {
    message.error('请先登录')
    router.push('/admin/login')
    return
  }

  fetchCategories()
})
</script>

<style scoped lang="scss">
.resources-create {
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
      .section-card {
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
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

  .file-upload {
    .resource-uploader {
      margin-bottom: 16px;
    }

    .upload-progress {
      margin-top: 16px;
    }
  }

  .file-preview {
    .image-preview {
      text-align: center;

      img {
        max-width: 100%;
        max-height: 400px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .video-preview,
    .audio-preview {
      text-align: center;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;

      .file-icon {
        flex-shrink: 0;
      }

      .file-details {
        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #333;
        }

        p {
          margin: 4px 0;
          color: #666;
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .resources-create {
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
