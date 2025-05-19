<!-- NewsForm.vue - 资讯表单页面（创建/编辑） -->
<template>
  <div class="news-form-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-section">
        <h1>{{ isEditing ? '编辑资讯' : '添加资讯' }}</h1>
        <p>{{ isEditing ? '修改现有资讯内容' : '创建一条新的资讯' }}</p>
      </div>

      <div class="action-section">
        <a-space>
          <a-button @click="goBack">
            <template #icon><ArrowLeftOutlined /></template>
            返回列表
          </a-button>

          <a-button
            v-if="isEditing && news.isPublished"
            type="primary"
            ghost
            @click="handleTogglePublish"
          >
            <template #icon><PauseCircleOutlined /></template>
            取消发布
          </a-button>

          <a-button
            v-else-if="isEditing && !news.isPublished"
            type="primary"
            ghost
            @click="handleTogglePublish"
          >
            <template #icon><PlayCircleOutlined /></template>
            发布
          </a-button>

          <a-button type="primary" ghost @click="showPreview">
            <template #icon><EyeOutlined /></template>
            预览
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 表单卡片 -->
    <a-card>
      <a-spin :spinning="loading">
        <a-form
          ref="formRef"
          :model="newsForm"
          :rules="rules"
          layout="vertical"
          @finish="handleSubmit"
        >
          <!-- 标题 -->
          <a-form-item name="title" label="标题" required>
            <a-input
              v-model:value="newsForm.title"
              placeholder="请输入资讯标题"
              :maxlength="100"
              show-count
            />
          </a-form-item>

          <!-- 基本信息 -->
          <a-row :gutter="16">
            <!-- 分类 -->
            <a-col :xs="24" :sm="12">
              <a-form-item name="categoryKey" label="分类" required>
                <a-select
                  v-model:value="newsForm.categoryKey"
                  placeholder="选择资讯分类"
                  style="width: 100%"
                  @change="handleCategoryChange"
                >
                  <a-select-option
                    v-for="category in categories"
                    :key="category.key"
                    :value="category.key"
                  >
                    {{ category.name }}
                    <a-tag v-if="category.isCore" color="blue" size="small">核心</a-tag>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <!-- 发布日期 -->
            <a-col :xs="24" :sm="12">
              <a-form-item name="publishDate" label="发布日期">
                <a-date-picker
                  v-model:value="newsForm.publishDate"
                  style="width: 100%"
                  placeholder="选择发布日期"
                  format="YYYY-MM-DD"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 摘要 -->
          <a-form-item name="summary" label="摘要">
            <a-textarea
              v-model:value="newsForm.summary"
              placeholder="请输入资讯摘要，将显示在列表页"
              :maxlength="300"
              :auto-size="{ minRows: 3, maxRows: 6 }"
              show-count
            />
          </a-form-item>

          <!-- 封面图片 -->
          <a-form-item name="cover" label="封面图片">
            <div class="upload-wrapper">
              <a-upload
                v-model:file-list="fileList"
                name="file"
                list-type="picture-card"
                :show-upload-list="false"
                :action="`/api/uploads/image`"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                @change="handleUploadChange"
              >
                <template v-if="uploadingFile">
                  <div class="uploading-progress">
                    <a-progress type="circle" :percent="uploadProgress" :width="80" />
                  </div>
                </template>
                <div v-else-if="newsForm.cover" class="image-uploader-wrapper">
                  <img :src="newsForm.cover" class="image-preview" />
                  <div class="image-mask">
                    <DeleteOutlined />
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <div class="ant-upload-hint">
                    <PlusOutlined />
                    <div class="upload-text">上传封面</div>
                  </div>
                </div>
              </a-upload>
              <div class="upload-hint">推荐尺寸: 900x500px, 格式: JPG/PNG</div>
            </div>
          </a-form-item>

          <!-- 内容编辑器 -->
          <a-form-item name="content" label="内容" required>
            <div class="editor-container">
              <RichTextEditor
                v-model:value="newsForm.content"
                :placeholder="'请输入资讯内容...'"
                :uploadHeaders="uploadHeaders"
                :uploadUrl="'/api/uploads/image'"
                style="min-height: 400px"
              />
            </div>
          </a-form-item>

          <!-- 来源 -->
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item name="source" label="来源">
                <a-input
                  v-model:value="newsForm.source"
                  placeholder="请输入资讯来源，如：本站原创"
                />
              </a-form-item>
            </a-col>

            <!-- 作者 -->
            <a-col :xs="24" :sm="12">
              <a-form-item name="author" label="作者">
                <a-input v-model:value="newsForm.author" placeholder="请输入作者姓名" />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 标签 -->
          <a-form-item name="tags" label="标签">
            <a-select
              v-model:value="newsForm.tags"
              mode="tags"
              style="width: 100%"
              placeholder="输入标签按回车键添加"
              :token-separators="[',']"
            />
          </a-form-item>

          <!-- SEO 信息 -->
          <a-collapse>
            <a-collapse-panel key="1" header="SEO 设置">
              <a-form-item name="metaTitle" label="SEO 标题">
                <a-input
                  v-model:value="newsForm.metaTitle"
                  placeholder="SEO 标题，留空则使用普通标题"
                />
              </a-form-item>

              <a-form-item name="metaDescription" label="SEO 描述">
                <a-textarea
                  v-model:value="newsForm.metaDescription"
                  placeholder="SEO 描述，留空则使用摘要"
                  :auto-size="{ minRows: 2, maxRows: 4 }"
                />
              </a-form-item>

              <a-form-item name="metaKeywords" label="SEO 关键词">
                <a-select
                  v-model:value="newsForm.metaKeywords"
                  mode="tags"
                  style="width: 100%"
                  placeholder="输入关键词按回车键添加"
                  :token-separators="[',']"
                />
              </a-form-item>
            </a-collapse-panel>
          </a-collapse>

          <!-- 提交按钮 -->
          <a-form-item>
            <div class="form-actions">
              <a-space>
                <a-button @click="goBack">取消</a-button>
                <a-button type="primary" html-type="submit" :loading="submitting">
                  {{ isEditing ? '保存修改' : '创建资讯' }}
                </a-button>
                <a-button
                  v-if="!isEditing"
                  type="primary"
                  ghost
                  @click="handleSaveAndPublish"
                  :loading="submitting"
                >
                  保存并发布
                </a-button>
              </a-space>
            </div>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>

    <!-- 预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="新闻预览"
      width="900px"
      :footer="null"
      :bodyStyle="{ padding: '0' }"
    >
      <NewsPreview
        :news="{ ...newsForm, publishDate: formatDate(newsForm.publishDate) }"
        :categories="categories"
      />
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useNewsStore } from '@/stores/news'
import { useNewsCategoryStore } from '@/stores/newsCategory'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import NewsPreview from '@/components/admin/NewsPreview.vue'
import dayjs from 'dayjs'

export default {
  name: 'NewsForm',

  components: {
    RichTextEditor,
    NewsPreview,
    ArrowLeftOutlined,
    PlusOutlined,
    DeleteOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    EyeOutlined,
  },

  props: {
    id: {
      type: String,
      required: false,
    },
  },

  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const newsStore = useNewsStore()
    const categoryStore = useNewsCategoryStore()

    const formRef = ref(null)
    const loading = ref(false)
    const submitting = ref(false)
    const previewVisible = ref(false)
    const fileList = ref([])
    const uploadProgress = ref(0)
    const uploadingFile = ref(false)

    const AUTOSAVE_KEY = 'news_draft'
    const autoSaveInterval = ref(null)

    // 编辑状态判断
    const isEditing = computed(() => !!props.id)

    // 原始资讯数据
    const news = ref({})

    // 表单数据
    const newsForm = reactive({
      title: '',
      categoryKey: '',
      summary: '',
      content: '',
      cover: '',
      publishDate: null,
      source: '',
      author: '',
      tags: [],
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
    })

    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入资讯标题', trigger: 'blur' },
        { min: 3, max: 100, message: '标题长度应在3-100个字符之间', trigger: 'blur' },
      ],
      categoryKey: [{ required: true, message: '请选择资讯分类', trigger: 'change' }],
      content: [{ required: true, message: '请输入资讯内容', trigger: 'change' }],
      summary: [{ max: 300, message: '摘要最多300字符', trigger: 'blur' }],
      publishDate: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
      author: [{ max: 50, message: '作者名称最多50字符', trigger: 'blur' }],
      source: [{ max: 100, message: '来源最多100字符', trigger: 'blur' }],
      tags: [{ type: 'array', max: 10, message: '最多可添加10个标签', trigger: 'change' }],
    }

    // 表单提交前的数据处理
    const processFormData = data => {
      const processedData = { ...data }

      // 处理日期
      if (processedData.publishDate) {
        processedData.publishDate = dayjs(processedData.publishDate).format('YYYY-MM-DD')
      }

      // 处理标签
      if (processedData.tags) {
        processedData.tags = processedData.tags.map(tag => tag.trim()).filter(Boolean)
      }

      // 处理SEO信息
      processedData.seo = {
        metaTitle: processedData.metaTitle || processedData.title,
        metaDescription: processedData.metaDescription || processedData.summary,
        keywords: processedData.metaKeywords || processedData.tags,
      }

      return processedData
    }

    // 自动保存
    const autoSave = () => {
      if (!isEditing.value) {
        const draftData = {
          ...newsForm,
          timestamp: Date.now(),
        }
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData))
        message.info('草稿已自动保存', 1)
      }
    }

    // 加载草稿
    const loadDraft = () => {
      const draftJson = localStorage.getItem(AUTOSAVE_KEY)
      if (draftJson) {
        const draft = JSON.parse(draftJson)
        // 检查草稿是否在24小时内
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          Modal.confirm({
            title: '发现未发布的草稿',
            content: '是否要继续编辑上次保存的草稿？',
            okText: '继续编辑',
            cancelText: '放弃草稿',
            onOk() {
              Object.keys(draft).forEach(key => {
                if (key !== 'timestamp') {
                  newsForm[key] = draft[key]
                }
              })
            },
            onCancel() {
              localStorage.removeItem(AUTOSAVE_KEY)
            },
          })
        } else {
          localStorage.removeItem(AUTOSAVE_KEY)
        }
      }
    }

    // 加载分类
    const loadCategories = async () => {
      try {
        await categoryStore.fetchList()
        categories.value = categoryStore.items
      } catch (error) {
        console.error('加载资讯分类失败:', error)
        message.error('加载分类失败: ' + error.message)
      }
    }

    // 加载资讯数据
    const loadNewsData = async () => {
      if (!props.id) return

      try {
        loading.value = true
        await newsStore.fetchById(props.id)
        const data = newsStore.currentNews

        if (!data) {
          throw new Error('未找到该条资讯')
        }

        news.value = data

        // 填充表单数据
        Object.keys(newsForm).forEach(key => {
          if (data[key] !== undefined) {
            if (key === 'publishDate' && data[key]) {
              newsForm[key] = dayjs(data[key])
            } else {
              newsForm[key] = data[key]
            }
          }
        })

        // 确保分类ID转换为key
        if (data.category) {
          newsForm.categoryKey = data.category.key
        }

        // 设置封面图片预览
        if (data.cover || data.thumbnail) {
          const coverUrl = data.cover || data.thumbnail
          fileList.value = [
            {
              uid: '-1',
              name: 'cover.jpg',
              status: 'done',
              url: coverUrl,
            },
          ]
        }
      } catch (error) {
        message.error('加载资讯数据失败: ' + error.message)
        console.error('加载资讯数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 上传前校验
    const beforeUpload = file => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return false
      }

      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过5MB!')
        return false
      }

      return isImage && isLt5M
    }

    // 处理上传状态变化
    const handleUploadChange = info => {
      const { status, percent } = info.file

      if (status === 'uploading') {
        uploadingFile.value = true
        uploadProgress.value = percent
        return
      }

      uploadingFile.value = false
      uploadProgress.value = 0

      if (status === 'done') {
        if (info.file.response && info.file.response.success) {
          newsForm.cover = info.file.response.data.url
          message.success('封面上传成功')
        } else {
          message.error(info.file.response?.message || '封面上传失败')
        }
      } else if (status === 'error') {
        message.error('封面上传失败')
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        submitting.value = true

        const processedData = processFormData(newsForm)

        let result
        if (isEditing.value) {
          result = await newsStore.update(props.id, processedData)
          message.success('资讯更新成功')
        } else {
          result = await newsStore.create(processedData)
          message.success('资讯创建成功')
        }

        router.push('/admin/news')
      } catch (error) {
        if (error.errorFields) {
          message.error('请完善必填信息')
        } else {
          message.error(`操作失败: ${error.message}`)
        }
        console.error('表单提交错误:', error)
      } finally {
        submitting.value = false
      }
    }

    // 保存并发布
    const handleSaveAndPublish = async () => {
      // 验证表单
      try {
        await formRef.value.validate()
        submitting.value = true

        // 处理发布日期
        if (newsForm.publishDate) {
          newsForm.publishDate = dayjs(newsForm.publishDate).format('YYYY-MM-DD')
        } else {
          newsForm.publishDate = dayjs().format('YYYY-MM-DD')
        }

        // 准备提交数据
        const submitData = {
          title: newsForm.title,
          content: newsForm.content,
          summary: newsForm.summary,
          thumbnail: newsForm.cover,
          category: newsForm.categoryKey, // 使用分类Key作为category ID
          publishDate: newsForm.publishDate,
          author: newsForm.author || userStore.userInfo?.name || '管理员',
          source: newsForm.source ? { name: newsForm.source } : undefined,
          tags: newsForm.tags || [],
          isPublished: true,
          seo: {
            metaTitle: newsForm.metaTitle,
            metaDescription: newsForm.metaDescription,
            keywords: newsForm.metaKeywords,
          },
        }

        // 创建资讯
        await newsStore.create(submitData)
        message.success('资讯已创建并发布')

        // 返回列表页
        router.push('/admin/news')
      } catch (error) {
        if (error.errorFields) {
          message.error('请完善必填信息')
        } else {
          message.error(`操作失败: ${error.message}`)
        }
      } finally {
        submitting.value = false
      }
    }

    // 切换发布状态
    const handleTogglePublish = async () => {
      if (!props.id) return

      try {
        loading.value = true
        const action = news.value.isPublished ? '取消发布' : '发布'
        const newStatus = news.value.isPublished ? 'draft' : 'published'

        await newsStore.updateStatus(props.id, newStatus)
        news.value.isPublished = !news.value.isPublished

        message.success(`已${action}该资讯`)
      } catch (error) {
        message.error(`操作失败: ${error.message}`)
      } finally {
        loading.value = false
      }
    }

    // 返回列表
    const goBack = () => {
      router.push('/admin/news/list')
    }

    // 显示预览
    const showPreview = () => {
      previewVisible.value = true
    }

    // 设置自动保存定时器
    onMounted(() => {
      loadCategories()
      if (isEditing.value) {
        loadNewsData()
      } else {
        loadDraft()
        newsForm.author = userStore.userInfo?.name || ''
        // 每3分钟自动保存一次
        autoSaveInterval.value = setInterval(autoSave, 3 * 60 * 1000)
      }
    })

    // 清理定时器
    onBeforeUnmount(() => {
      if (autoSaveInterval.value) {
        clearInterval(autoSaveInterval.value)
      }
    })

    return {
      formRef,
      newsForm,
      rules,
      loading,
      submitting,
      isEditing,
      news,
      categories,
      fileList,
      uploadHeaders,
      previewVisible,
      formatDate,
      getCategoryName,
      handleCategoryChange,
      handleSubmit,
      handleSaveAndPublish,
      handleUploadChange,
      handleTogglePublish,
      beforeUpload,
      goBack,
      showPreview,
      uploadProgress,
      uploadingFile,
    }
  },
}
</script>

<style scoped>
.news-form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-section h1 {
  font-size: 24px;
  margin-bottom: 8px;
  margin-top: 0;
}

.title-section p {
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.upload-wrapper {
  display: flex;
  flex-direction: column;
}

.upload-hint {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.image-uploader-wrapper {
  position: relative;
  width: 104px;
  height: 104px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.image-uploader-wrapper:hover .image-mask {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 104px;
  width: 104px;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
}

.upload-text {
  font-size: 12px;
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
}

.editor-container {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  margin-top: 8px;
}

.editor-container :deep(.ql-container) {
  min-height: 400px;
}

.uploading-progress {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 104px;
  height: 104px;
  background: rgba(0, 0, 0, 0.02);
}

.preview-container :deep(.news-preview) {
  padding: 24px;
  background: #fff;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-section {
    margin-top: 16px;
    width: 100%;
  }

  .preview-container {
    padding: 16px;
  }

  .ant-modal {
    max-width: 95% !important;
    margin: 16px auto !important;
  }
}
</style>
