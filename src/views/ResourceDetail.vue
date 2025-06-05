<template>
  <page-layout :title="resource?.title || '资源详情'">
    <div class="resource-detail" v-if="resource">
      <div class="resource-header">
        <h2>{{ resource.title }}</h2>
        <div class="meta">
          <span><UserOutlined /> {{ resource.author?.name || '未知作者' }}</span>
          <span><CalendarOutlined /> {{ formatDate(resource.publishDate) }}</span>
          <span><EyeOutlined /> {{ resource.viewCount || 0 }}</span>
          <span><DownloadOutlined /> {{ resource.downloadCount || 0 }}</span>
        </div>
      </div>
      <div class="resource-description">
        <p>{{ resource.description }}</p>
      </div>
      <div class="resource-preview">
        <component :is="previewComponent" :resource="resource" />
      </div>
      <div class="resource-actions">
        <a-button type="primary" @click="downloadResource" :loading="downloading">
          <DownloadOutlined /> 下载资源
        </a-button>
        <a-button @click="shareResource"> <ShareAltOutlined /> 分享 </a-button>
        <a-button @click="goBack"> 返回 </a-button>
      </div>
    </div>
    <a-spin v-else :spinning="loading" />
  </page-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import PageLayout from '../components/common/PageLayout.vue'
import { resourceApi } from '@/api'
import type { Resource } from '@/api'

// 资源预览子组件
import VideoPlayer from '@/components/common/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()
const resource = ref<Resource | null>(null)
const loading = ref(true)
const downloading = ref(false)

const fetchResource = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    const res = await resourceApi.getDetail(id)
    if (res.success) {
      resource.value = res.data
    } else {
      message.error('获取资源详情失败')
    }
  } catch (e) {
    message.error('获取资源详情失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (date?: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const goBack = () => {
  router.back()
}

const downloadResource = async () => {
  if (!resource.value) return
  downloading.value = true
  try {
    const blob = await resourceApi.download(resource.value.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = resource.value.title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    message.success('下载成功')
  } catch (e) {
    message.error('下载失败')
  } finally {
    downloading.value = false
  }
}

const shareResource = () => {
  Modal.info({
    title: '分享资源',
    content: `可将此链接分享给他人：${window.location.href}`,
  })
}

// 资源预览类型判断
const previewComponent = computed(() => {
  if (!resource.value) return null
  if (resource.value.type === 'video') return VideoPlayer
  if (resource.value.type === 'image') return 'img-preview'
  if (resource.value.type === 'audio') return 'audio-preview'
  if (resource.value.type === 'document' || resource.value.type === 'other') return 'file-preview'
  return null
})

onMounted(() => {
  fetchResource()
})
</script>

<!-- 资源预览子组件实现（可根据需要拆分到单独文件）-->
<template #img-preview="{ resource }">
  <div class="img-preview" v-if="resource">
    <img :src="resource.url" :alt="resource.title" style="max-width: 100%; max-height: 400px" />
  </div>
</template>
<template #audio-preview="{ resource }">
  <div class="audio-preview" v-if="resource">
    <audio :src="resource.url" controls style="width: 100%"></audio>
  </div>
</template>
<template #file-preview="{ resource }">
  <div class="file-preview" v-if="resource">
    <iframe :src="resource.url" style="width: 100%; height: 500px; border: none"></iframe>
    <div style="margin-top: 8px; color: #888">如无法在线预览，请点击下载。</div>
  </div>
</template>

<style scoped>
.resource-detail {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  padding: 32px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.resource-header {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}
.resource-header h2 {
  margin: 0 0 8px 0;
}
.meta {
  color: #888;
  font-size: 13px;
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}
.resource-description {
  margin-bottom: 24px;
  color: #555;
}
.resource-preview {
  margin-bottom: 24px;
}
.resource-actions {
  display: flex;
  gap: 16px;
}
</style>
