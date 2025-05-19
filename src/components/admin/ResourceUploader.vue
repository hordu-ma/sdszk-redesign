<!-- ResourceUploader.vue - 资源上传组件 -->
<template>
  <div class="resource-uploader">
    <!-- 上传区域 -->
    <a-upload-dragger
      :fileList="fileList"
      :multiple="multiple"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :before-upload="beforeUpload"
      :remove="handleRemove"
      @change="handleChange"
      @drop="handleDrop"
      class="uploader-area"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">点击或将文件拖拽到此区域上传</p>
      <p class="ant-upload-hint">
        支持单个或批量上传，单个文件大小不超过{{ maxSize }}MB
        <br />
        支持类型: {{ acceptedTypesText }}
      </p>
    </a-upload-dragger>

    <!-- 文件列表 -->
    <div class="file-list" v-if="fileList.length > 0">
      <div v-for="file in fileList" :key="file.uid" class="file-item">
        <!-- 文件图标 -->
        <div class="file-icon">
          <component :is="getFileIcon(file)" />
        </div>

        <!-- 文件信息 -->
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span class="file-type">{{ getFileTypeText(file) }}</span>
          </div>
          <!-- 上传进度 -->
          <a-progress
            v-if="file.status === 'uploading'"
            :percent="file.percent"
            size="small"
            status="active"
          />
        </div>

        <!-- 文件操作 -->
        <div class="file-actions">
          <a-space>
            <!-- 预览按钮 -->
            <a-button
              v-if="file.status === 'done' && isPreviewable(file)"
              type="link"
              size="small"
              @click="handlePreview(file)"
            >
              <template #icon><EyeOutlined /></template>
            </a-button>
            <!-- 下载按钮 -->
            <a-button
              v-if="file.status === 'done'"
              type="link"
              size="small"
              @click="handleDownload(file)"
            >
              <template #icon><DownloadOutlined /></template>
            </a-button>
            <!-- 删除按钮 -->
            <a-button type="link" size="small" danger @click="handleRemove(file)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </a-space>
        </div>

        <!-- 状态指示器 -->
        <div class="file-status">
          <LoadingOutlined v-if="file.status === 'uploading'" spin />
          <CheckCircleFilled v-else-if="file.status === 'done'" class="success" />
          <CloseCircleFilled v-else-if="file.status === 'error'" class="error" />
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewFile?.name"
      :footer="null"
      :width="800"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <img
          v-if="isImageFile(previewFile)"
          :src="previewFile?.url"
          class="preview-image"
          alt="预览图片"
        />
        <!-- 视频预览 -->
        <video
          v-else-if="isVideoFile(previewFile)"
          :src="previewFile?.url"
          controls
          class="preview-video"
        />
        <!-- 音频预览 -->
        <audio
          v-else-if="isAudioFile(previewFile)"
          :src="previewFile?.url"
          controls
          class="preview-audio"
        />
        <!-- PDF预览 -->
        <iframe v-else-if="isPdfFile(previewFile)" :src="previewFile?.url" class="preview-pdf" />
        <!-- 不支持预览的文件类型 -->
        <div v-else class="preview-unsupported">
          <FileOutlined />
          <p>该文件类型暂不支持预览，请下载后查看</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import {
  InboxOutlined,
  FileOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  AudioOutlined,
  FilePdfOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  CloseCircleFilled,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'

export default {
  name: 'ResourceUploader',

  components: {
    InboxOutlined,
    FileOutlined,
    FileTextOutlined,
    PictureOutlined,
    PlaySquareOutlined,
    AudioOutlined,
    FilePdfOutlined,
    CheckCircleFilled,
    LoadingOutlined,
    CloseCircleFilled,
    EyeOutlined,
    DownloadOutlined,
    DeleteOutlined,
  },

  props: {
    // 最大文件大小(MB)
    maxSize: {
      type: Number,
      default: 500, // 默认500MB
    },
    acceptedTypes: {
      type: Array,
      default: () => ['*'],
    },
    // 是否自动上传
    autoUpload: {
      type: Boolean,
      default: true,
    },
    // 最大上传数量
    maxCount: {
      type: Number,
      default: 10,
    },
    // 是否支持多选
    multiple: {
      type: Boolean,
      default: true,
    },
    // 当前文件列表
    value: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['update:value', 'upload-success', 'upload-error', 'file-removed', 'exceed'],

  setup(props, { emit }) {
    const userStore = useUserStore()
    const fileList = ref([])
    const previewVisible = ref(false)
    const previewFile = ref(null)

    const uploadUrl = '/api/resources/upload'
    const uploadHeaders = computed(() => ({
      Authorization: `Bearer ${userStore.token}`,
    }))

    // 获取支持的文件类型文本
    const acceptedTypesText = computed(() => {
      if (props.acceptedTypes.includes('*')) {
        return '所有文件'
      }
      return props.acceptedTypes.map(type => type.replace('/*', '')).join('、')
    })

    // 上传前检查
    const beforeUpload = file => {
      // 检查文件类型
      if (!props.acceptedTypes.includes('*')) {
        const isAccepted = props.acceptedTypes.some(type =>
          file.type.includes(type.replace('/*', ''))
        )
        if (!isAccepted) {
          message.error('不支持的文件类型！')
          return false
        }
      }

      // 检查文件大小
      const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
      if (!isLtMaxSize) {
        message.error(`文件必须小于 ${props.maxSize}MB!`)
        return false
      }

      // 检查队列大小
      if (fileList.value.length >= props.maxCount) {
        message.error(`最多只能上传 ${props.maxCount} 个文件!`)
        emit('exceed', file)
        return false
      }

      return true
    }

    // 处理上传状态变化
    const handleChange = info => {
      let fileList = [...info.fileList]

      fileList = fileList.map(file => {
        if (file.response) {
          file.url = file.response.url
        }
        return file
      })

      // 处理上传完成
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
        emit('upload-success', info.file.response)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
        emit('upload-error', info.file)
      }

      fileList.value = fileList
      emit('update:value', fileList)
    }

    // 处理文件删除
    const handleRemove = file => {
      emit('file-removed', file)
      return true
    }

    // 处理文件预览
    const handlePreview = file => {
      previewFile.value = file
      previewVisible.value = true
    }

    // 处理文件下载
    const handleDownload = file => {
      if (file.url) {
        window.open(file.url)
      }
    }

    // 处理拖拽
    const handleDrop = e => {
      console.log('Dropped files', e.dataTransfer.files)
    }

    // 获取文件图标
    const getFileIcon = file => {
      if (isImageFile(file)) return PictureOutlined
      if (isVideoFile(file)) return PlaySquareOutlined
      if (isAudioFile(file)) return AudioOutlined
      if (isPdfFile(file)) return FilePdfOutlined
      if (isDocFile(file)) return FileTextOutlined
      return FileOutlined
    }

    // 获取文件类型文本
    const getFileTypeText = file => {
      if (isImageFile(file)) return '图片'
      if (isVideoFile(file)) return '视频'
      if (isAudioFile(file)) return '音频'
      if (isPdfFile(file)) return 'PDF文档'
      if (isDocFile(file)) return '文档'
      return '文件'
    }

    // 文件类型判断
    const isImageFile = file => file?.type?.startsWith('image/')
    const isVideoFile = file => file?.type?.startsWith('video/')
    const isAudioFile = file => file?.type?.startsWith('audio/')
    const isPdfFile = file => file?.type === 'application/pdf'
    const isDocFile = file => {
      const docTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      return docTypes.includes(file?.type)
    }

    // 检查文件是否可预览
    const isPreviewable = file => {
      return isImageFile(file) || isVideoFile(file) || isAudioFile(file) || isPdfFile(file)
    }

    // 格式化文件大小
    const formatFileSize = bytes => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    // 清空文件列表
    const clearFiles = () => {
      fileList.value = []
    }

    return {
      fileList,
      uploadUrl,
      uploadHeaders,
      previewVisible,
      previewFile,
      acceptedTypesText,
      beforeUpload,
      handleChange,
      handleRemove,
      handlePreview,
      handleDownload,
      handleDrop,
      getFileIcon,
      getFileTypeText,
      isPreviewable,
      isImageFile,
      isVideoFile,
      isAudioFile,
      isPdfFile,
      formatFileSize,
      clearFiles,
      multiple: props.multiple,
    }
  },
}
</script>

<style scoped>
.resource-uploader {
  width: 100%;
}

.uploader-area {
  margin-bottom: 16px;
}

.file-list {
  border: 1px solid #f0f0f0;
  border-radius: 2px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #fafafa;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
  width: 32px;
  text-align: center;
}

.file-info {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.file-name {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.file-meta span {
  margin-right: 12px;
}

.file-actions {
  margin-right: 12px;
}

.file-status {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.success {
  color: #52c41a;
}

.error {
  color: #ff4d4f;
}

/* 预览样式 */
.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #fafafa;
  border-radius: 4px;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
}

.preview-video,
.preview-audio {
  width: 100%;
}

.preview-pdf {
  width: 100%;
  height: 600px;
  border: none;
}

.preview-unsupported {
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
}

.preview-unsupported .anticon {
  font-size: 48px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .file-item {
    padding: 8px;
  }

  .file-actions {
    display: flex;
    margin-top: 8px;
  }

  .preview-content {
    min-height: 150px;
  }

  .preview-image {
    max-height: 400px;
  }

  .preview-pdf {
    height: 400px;
  }
}
</style>
