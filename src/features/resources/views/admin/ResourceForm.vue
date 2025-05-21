<template>
  <div class="resource-form-container">
    <div class="page-header">
      <div class="title-section">
        <h1>{{ isEdit ? '编辑资源' : '新增资源' }}</h1>
        <p>{{ isEdit ? '修改资源信息' : '创建一个新的资源' }}</p>
      </div>
      <div class="action-section">
        <a-space>
          <a-button @click="goBack">
            <template #icon><ArrowLeftOutlined /></template>
            返回列表
          </a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting">
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
          <a-button @click="handlePreview" type="link">
            <template #icon><EyeOutlined /></template>
            预览
          </a-button>
        </a-space>
      </div>
    </div>

    <a-card>
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="资源标题" name="title" required>
                <a-input
                  v-model:value="formData.title"
                  placeholder="请输入资源标题"
                  :maxLength="100"
                  show-count
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="资源类型" name="type" required>
                <a-select v-model:value="formData.type" placeholder="请选择资源类型">
                  <a-select-option value="document">文档资料</a-select-option>
                  <a-select-option value="video">视频资源</a-select-option>
                  <a-select-option value="image">图片资源</a-select-option>
                  <a-select-option value="audio">音频资源</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="作者" name="author">
                <a-input v-model:value="formData.author" placeholder="请输入作者姓名" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="所属单位" name="affiliation">
                <a-input v-model:value="formData.affiliation" placeholder="请输入所属单位" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="资源简介" name="description">
            <a-textarea
              v-model:value="formData.description"
              :rows="4"
              :maxLength="500"
              show-count
              placeholder="请输入资源简介"
            />
          </a-form-item>
        </div>

        <!-- 资源内容 -->
        <div class="form-section">
          <h3 class="section-title">资源内容</h3>
          <a-form-item label="资源上传" required>
            <ResourceUploader
              ref="uploaderRef"
              :maxSize="500"
              :acceptedTypes="acceptedFileTypes"
              @upload-success="handleUploadSuccess"
              @upload-error="handleUploadError"
            />
          </a-form-item>

          <a-form-item v-if="formData.type === 'video'" label="视频时长(秒)" name="duration">
            <a-input-number
              v-model:value="formData.duration"
              :min="0"
              placeholder="请输入视频时长"
            />
          </a-form-item>
        </div>

        <!-- 分类和标签 -->
        <div class="form-section">
          <h3 class="section-title">分类与标签</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="所属分类" name="categoryId" required>
                <a-select
                  v-model:value="formData.categoryId"
                  placeholder="请选择分类"
                  :loading="categoriesLoading"
                >
                  <a-select-option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="标签" name="tags">
                <a-select
                  v-model:value="formData.tags"
                  mode="tags"
                  :token-separators="[',']"
                  placeholder="请输入标签，按回车键确认"
                >
                  <a-select-option v-for="tag in commonTags" :key="tag" :value="tag">
                    {{ tag }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- 发布设置 -->
        <div class="form-section">
          <h3 class="section-title">发布设置</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="状态" name="status">
                <a-radio-group v-model:value="formData.status">
                  <a-radio value="draft">草稿</a-radio>
                  <a-radio value="published">发布</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="是否推荐" name="featured">
                <a-switch v-model:checked="formData.featured" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="发布时间" name="publishDate">
            <a-date-picker
              v-model:value="formData.publishDate"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :disabled="formData.status === 'draft'"
            />
          </a-form-item>
        </div>

        <!-- SEO设置 -->
        <div class="form-section">
          <h3 class="section-title">SEO设置</h3>
          <a-form-item label="SEO标题" name="seo.title">
            <a-input
              v-model:value="formData.seo.title"
              placeholder="请输入SEO标题，留空则使用资源标题"
              :maxLength="70"
              show-count
            />
          </a-form-item>
          <a-form-item label="SEO描述" name="seo.description">
            <a-textarea
              v-model:value="formData.seo.description"
              placeholder="请输入SEO描述，留空则使用资源简介"
              :maxLength="160"
              show-count
              :rows="3"
            />
          </a-form-item>
          <a-form-item label="SEO关键词" name="seo.keywords">
            <a-select
              v-model:value="formData.seo.keywords"
              mode="tags"
              :token-separators="[',']"
              placeholder="请输入SEO关键词"
            />
          </a-form-item>
        </div>
      </a-form>
    </a-card>

    <!-- 预览模态框 -->
    <a-modal v-model:visible="previewVisible" title="资源预览" :width="800" :footer="null">
      <div class="preview-content">
        <h2>{{ formData.title }}</h2>
        <div class="resource-meta">
          <span>作者：{{ formData.author }}</span>
          <span>单位：{{ formData.affiliation }}</span>
          <span>类型：{{ getTypeText(formData.type) }}</span>
        </div>
        <div class="resource-description">
          {{ formData.description }}
        </div>
        <div class="resource-tags" v-if="formData.tags?.length">
          <a-tag v-for="tag in formData.tags" :key="tag">{{ tag }}</a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useResourceStore } from '@/stores/resource'
import ResourceUploader from '@/components/admin/ResourceUploader.vue'
import dayjs from 'dayjs'

export default {
  name: 'ResourceForm',

  components: {
    ResourceUploader,
    ArrowLeftOutlined,
    SaveOutlined,
    EyeOutlined,
  },

  setup() {
    const router = useRouter()
    const route = useRoute()
    const resourceStore = useResourceStore()
    const formRef = ref()
    const uploaderRef = ref()

    const loading = ref(false)
    const submitting = ref(false)
    const previewVisible = ref(false)
    const categoriesLoading = ref(false)

    // 是否为编辑模式
    const isEdit = computed(() => !!route.params.id)

    // 允许上传的文件类型
    const acceptedFileTypes = computed(() => {
      const types = {
        document: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        video: ['video/*'],
        image: ['image/*'],
        audio: ['audio/*'],
      }
      return formData.value.type ? types[formData.value.type] : ['*']
    })

    // 表单数据
    const formData = ref({
      title: '',
      type: undefined,
      author: '',
      affiliation: '',
      description: '',
      categoryId: undefined,
      tags: [],
      status: 'draft',
      featured: false,
      publishDate: null,
      files: [],
      duration: 0,
      seo: {
        title: '',
        description: '',
        keywords: [],
      },
    })

    // 常用标签
    const commonTags = ref(['思政教育', '教学研究', '课程资源', '教学创新', '实践教学', '教材建设'])

    // 分类列表
    const categories = ref([])

    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入资源标题', trigger: 'blur' },
        { min: 2, max: 100, message: '标题长度在2-100个字符之间', trigger: 'blur' },
      ],
      type: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
      description: [
        { required: true, message: '请输入资源简介', trigger: 'blur' },
        { min: 10, max: 500, message: '简介长度在10-500个字符之间', trigger: 'blur' },
      ],
      categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
      status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    }

    // 加载分类列表
    const loadCategories = async () => {
      categoriesLoading.value = true
      try {
        const response = await resourceStore.getCategories()
        categories.value = response.data
      } catch (error) {
        message.error('加载分类列表失败')
        console.error(error)
      } finally {
        categoriesLoading.value = false
      }
    }

    // 处理文件上传成功
    const handleUploadSuccess = file => {
      formData.value.files.push({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
      })
      message.success(`${file.name} 上传成功`)
    }

    // 处理文件上传失败
    const handleUploadError = file => {
      message.error(`${file.name} 上传失败`)
    }

    // 获取资源类型文本
    const getTypeText = type => {
      const types = {
        document: '文档资料',
        video: '视频资源',
        image: '图片资源',
        audio: '音频资源',
      }
      return types[type] || '其他'
    }

    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        submitting.value = true

        const data = { ...formData.value }
        // 处理日期格式
        if (data.publishDate) {
          data.publishDate = dayjs(data.publishDate).format('YYYY-MM-DD HH:mm:ss')
        }

        if (isEdit.value) {
          await resourceStore.update(route.params.id, data)
          message.success('更新成功')
        } else {
          await resourceStore.create(data)
          message.success('创建成功')
        }

        router.push('/admin/resources')
      } catch (error) {
        console.error(error)
        message.error('保存失败')
      } finally {
        submitting.value = false
      }
    }

    // 加载资源数据
    const loadResource = async id => {
      loading.value = true
      try {
        const response = await resourceStore.getDetail(id)
        const resource = response.data
        formData.value = {
          ...resource,
          categoryId: resource.category?.id,
          publishDate: resource.publishDate ? dayjs(resource.publishDate) : null,
        }
      } catch (error) {
        message.error('加载资源数据失败')
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    // 返回列表页
    const goBack = () => {
      router.back()
    }

    // 显示预览
    const handlePreview = () => {
      previewVisible.value = true
    }

    // 监听类型变化，清空已上传的文件
    watch(
      () => formData.value.type,
      () => {
        formData.value.files = []
        if (uploaderRef.value) {
          uploaderRef.value.clearFiles()
        }
      }
    )

    onMounted(() => {
      loadCategories()
      if (isEdit.value) {
        loadResource(route.params.id)
      }
    })

    return {
      formRef,
      uploaderRef,
      loading,
      submitting,
      isEdit,
      formData,
      rules,
      categories,
      commonTags,
      categoriesLoading,
      acceptedFileTypes,
      previewVisible,
      handleSubmit,
      handleUploadSuccess,
      handleUploadError,
      handlePreview,
      getTypeText,
      goBack,
    }
  },
}
</script>

<style scoped>
.resource-form-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.title-section h1 {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  margin-bottom: 8px;
}

.title-section p {
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  margin: 0 0 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  background: #8b1d1c;
  border-radius: 2px;
}

.preview-content {
  padding: 24px;
}

.preview-content h2 {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.resource-meta {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.resource-meta span {
  margin-right: 24px;
}

.resource-description {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.65);
  white-space: pre-wrap;
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .resource-form-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .action-section {
    width: 100%;
  }

  .ant-form-item {
    margin-bottom: 16px;
  }
}
</style>
