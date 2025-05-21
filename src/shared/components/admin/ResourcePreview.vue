# ResourcePreview.vue - 资源预览组件
<template>
  <div class="resource-preview">
    <div class="preview-header">
      <h1 class="preview-title">{{ resource.title }}</h1>
      <div class="preview-meta">
        <span v-if="resource.category">
          <TagOutlined />
          {{ resource.category }}
        </span>
        <span>
          <CalendarOutlined />
          {{ formatDate(resource.createdAt) }}
        </span>
        <span v-if="resource.author">
          <UserOutlined />
          {{ resource.author }}
        </span>
        <span v-if="resource.affiliation">
          <TeamOutlined />
          {{ resource.affiliation }}
        </span>
      </div>
      <div v-if="resource.tags && resource.tags.length" class="preview-tags">
        <a-tag v-for="tag in resource.tags" :key="tag">{{ tag }}</a-tag>
      </div>
    </div>

    <div class="preview-content">
      <!-- 文件预览区域 -->
      <div class="file-preview">
        <!-- 图片预览 -->
        <div v-if="resource.type === 'image'" class="preview-image">
          <img :src="resource.url" :alt="resource.title" />
        </div>
        <!-- 视频预览 -->
        <div v-else-if="resource.type === 'video'" class="preview-video">
          <video :src="resource.url" controls>
            <source :src="resource.url" :type="resource.mimeType" />
            您的浏览器不支持视频播放
          </video>
        </div>
        <!-- 音频预览 -->
        <div v-else-if="resource.type === 'audio'" class="preview-audio">
          <audio :src="resource.url" controls>
            <source :src="resource.url" :type="resource.mimeType" />
            您的浏览器不支持音频播放
          </audio>
        </div>
        <!-- PDF预览 -->
        <div v-else-if="resource.type === 'pdf'" class="preview-pdf">
          <iframe :src="resource.url" frameborder="0"></iframe>
        </div>
        <!-- 其他文件类型 -->
        <div v-else class="preview-document">
          <div class="document-info">
            <FileOutlined class="document-icon" />
            <h3>{{ resource.title }}</h3>
            <p class="document-meta">
              <span>类型：{{ getFileTypeText(resource.type) }}</span>
              <span>大小：{{ formatFileSize(resource.fileSize) }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 文件信息 -->
      <div v-if="resource.description" class="preview-description">
        <div class="description-title">资源描述</div>
        <div class="description-content">{{ resource.description }}</div>
      </div>

      <!-- 统计信息 -->
      <div class="preview-stats">
        <div class="stats-item">
          <EyeOutlined />
          <span>{{ resource.viewCount || 0 }} 次浏览</span>
        </div>
        <div class="stats-item">
          <DownloadOutlined />
          <span>{{ resource.downloadCount || 0 }} 次下载</span>
        </div>
        <div class="stats-item">
          <ClockCircleOutlined />
          <span>{{ formatDate(resource.createdAt) }} 上传</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="preview-actions">
        <a-button-group>
          <a-button type="primary" icon="download" @click="handleDownload"> 下载文件 </a-button>
          <a-button v-if="editable" icon="edit" @click="handleEdit"> 编辑 </a-button>
          <a-button
            v-if="editable"
            :type="resource.featured ? 'default' : 'dashed'"
            :icon="resource.featured ? 'star' : 'star-outlined'"
            @click="handleToggleFeatured"
          >
            {{ resource.featured ? '取消推荐' : '设为推荐' }}
          </a-button>
        </a-button-group>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import dayjs from 'dayjs'
import {
  TagOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileOutlined,
  EyeOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ResourcePreview',

  components: {
    TagOutlined,
    UserOutlined,
    TeamOutlined,
    CalendarOutlined,
    FileOutlined,
    EyeOutlined,
    DownloadOutlined,
    ClockCircleOutlined,
  },

  props: {
    resource: {
      type: Object,
      required: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['download', 'edit', 'toggle-featured'],

  setup(props, { emit }) {
    // 格式化日期
    const formatDate = date => {
      if (!date) return ''
      return dayjs(date).format('YYYY-MM-DD')
    }

    // 格式化文件大小
    const formatFileSize = bytes => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    // 获取文件类型文本
    const getFileTypeText = type => {
      const typeMap = {
        document: '文档资料',
        video: '视频资源',
        image: '图片资源',
        audio: '音频资源',
        pdf: 'PDF文档',
      }
      return typeMap[type] || '其他'
    }

    // 处理下载
    const handleDownload = () => {
      emit('download', props.resource)
    }

    // 处理编辑
    const handleEdit = () => {
      emit('edit', props.resource)
    }

    // 处理推荐状态切换
    const handleToggleFeatured = () => {
      emit('toggle-featured', props.resource)
    }

    return {
      formatDate,
      formatFileSize,
      getFileTypeText,
      handleDownload,
      handleEdit,
      handleToggleFeatured,
    }
  },
})
</script>

<style scoped>
.resource-preview {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-header {
  margin-bottom: 24px;
  text-align: center;
}

.preview-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.preview-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.preview-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.file-preview {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
}

.preview-video,
.preview-audio {
  width: 100%;
  max-width: 800px;
}

.preview-pdf {
  width: 100%;
  height: 600px;
}

.preview-pdf iframe {
  width: 100%;
  height: 100%;
}

.preview-document {
  padding: 32px;
  text-align: center;
}

.document-icon {
  font-size: 48px;
  color: #6b7280;
  margin-bottom: 16px;
}

.document-info h3 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 8px;
}

.document-meta {
  color: #6b7280;
  font-size: 14px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.preview-description {
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
}

.description-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 12px;
}

.description-content {
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap;
}

.preview-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.preview-actions {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

@media (max-width: 640px) {
  .resource-preview {
    padding: 16px;
  }

  .preview-title {
    font-size: 20px;
  }

  .preview-meta {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .preview-stats {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}
</style>
