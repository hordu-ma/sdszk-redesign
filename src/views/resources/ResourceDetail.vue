<template>
  <div class="resource-detail">
    <a-page-header :title="resource?.title" @back="() => router.push('/resources')">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleDownload" :loading="downloading">
            <template #icon><DownloadOutlined /></template>
            下载
          </a-button>
          <a-button @click="showShareModal">
            <template #icon><ShareAltOutlined /></template>
            分享
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[24, 24]" class="resource-content">
      <!-- 资源详情 -->
      <a-col :span="16">
        <a-card>
          <div class="resource-info">
            <div class="resource-meta">
              <span><UserOutlined /> {{ resource?.author?.name || 'Unknown' }}</span>
              <span><CalendarOutlined /> {{ formatDate(resource?.publishDate) }}</span>
              <span><EyeOutlined /> {{ resource?.viewCount || 0 }} 查看</span>
              <span><DownloadOutlined /> {{ resource?.downloadCount || 0 }} 下载</span>
            </div>
            <div class="content" v-if="resource?.content" v-html="resource.content"></div>
            <div class="tags" v-if="resource?.tags?.length">
              <a-tag v-for="tag in resource.tags" :key="tag">{{ tag }}</a-tag>
            </div>
          </div>
        </a-card>

        <!-- 评论系统 -->
        <a-card title="评论" class="comment-section">
          <!-- 评论输入框 -->
          <div class="comment-input">
            <a-textarea v-model:value="commentContent" :rows="4" placeholder="请输入您的评论..." />
            <div class="comment-actions">
              <a-button type="primary" @click="handleAddComment" :loading="submitting">
                发表评论
              </a-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <a-list
            class="comment-list"
            :data-source="comments"
            :loading="loadingComments"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-comment
                  :author="item.author.username"
                  :avatar="item.author.avatar"
                  :content="item.content"
                  :datetime="formatDate(item.createdAt)"
                >
                  <template #actions>
                    <span key="reply" @click="() => handleReply(item)">回复</span>
                    <span
                      key="delete"
                      v-if="canDeleteComment(item)"
                      @click="() => handleDeleteComment(item)"
                      >删除</span
                    >
                  </template>
                </a-comment>
              </a-list-item>
            </template>
          </a-list>

          <a-pagination
            v-if="total > pageSize"
            :current="currentPage"
            :total="total"
            :pageSize="pageSize"
            @change="handlePageChange"
          />
        </a-card>
      </a-col>

      <!-- 相关资源 -->
      <a-col :span="8">
        <a-card title="相关资源">
          <template v-if="relatedResources.length">
            <a-list :data-source="relatedResources" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a @click="() => router.push(`/resources/detail/${item.id}`)">
                    {{ item.title }}
                  </a>
                </a-list-item>
              </template>
            </a-list>
          </template>
          <template v-else>
            <a-empty description="暂无相关资源" />
          </template>
        </a-card>
      </a-col>
    </a-row>

    <!-- 回复模态框 -->
    <a-modal
      v-model:visible="replyModalVisible"
      title="回复评论"
      @ok="handleSubmitReply"
      :confirmLoading="submitting"
    >
      <a-textarea v-model:value="replyContent" :rows="4" placeholder="请输入回复内容..." />
    </a-modal>

    <!-- 分享模态框 -->
    <a-modal
      v-model:visible="shareModalVisible"
      title="分享资源"
      @ok="handleShare"
      :confirmLoading="sharing"
    >
      <a-form :model="shareForm" layout="vertical">
        <a-form-item label="分享方式">
          <a-radio-group v-model:value="shareForm.shareType">
            <a-radio value="email">邮件</a-radio>
            <a-radio value="link">链接</a-radio>
            <a-radio value="wechat">微信</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          v-if="shareForm.shareType === 'email'"
          label="收件人邮箱"
          name="recipientEmail"
        >
          <a-input v-model:value="shareForm.recipientEmail" placeholder="请输入邮箱地址" />
        </a-form-item>
        <a-form-item label="附言" name="message">
          <a-textarea v-model:value="shareForm.message" placeholder="请输入附言" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourceStore } from '@/stores/resource'
import { useUserStore } from '@/stores/user'
import type { Resource, Comment, ResourceAuthor } from '@/api/modules/resources/index'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  DownloadOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'

interface CommentWithAuthor extends Omit<Comment, 'parentComment'> {
  parentId?: string
}

const router = useRouter()
const route = useRoute()
const resourceStore = useResourceStore()
const userStore = useUserStore()

// 资源相关状态
const resource = ref<Resource | null>(null)
const relatedResources = ref<Resource[]>([])
const loading = ref(false)
const downloading = ref(false)
const sharing = ref(false)

// 评论相关状态
const commentContent = ref('')
const comments = ref<CommentWithAuthor[]>([])
const replyModalVisible = ref(false)
const replyContent = ref('')
const shareModalVisible = ref(false)
const currentReplyTo = ref<CommentWithAuthor | null>(null)
const loadingComments = ref(false)
const submitting = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const shareForm = ref<{
  shareType: 'email' | 'link' | 'wechat'
  recipientEmail?: string
  message?: string
}>({
  shareType: 'link',
})

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 初始化资源详情
const fetchResource = async () => {
  loading.value = true
  try {
    const { data } = await resourceStore.fetchById(route.params.id as string)
    resource.value = data
    await fetchComments()
  } catch (error) {
    message.error('获取资源详情失败')
  } finally {
    loading.value = false
  }
}

// 获取评论列表
const fetchComments = async () => {
  if (!route.params.id) return

  loadingComments.value = true
  try {
    const response = await resourceStore.getComments(route.params.id as string, {
      page: currentPage.value,
      limit: pageSize.value,
    })
    comments.value = response.data as CommentWithAuthor[]
    if (response.pagination) {
      total.value = response.pagination.total
    }
  } catch (error) {
    message.error('获取评论失败')
  } finally {
    loadingComments.value = false
  }
}

// 处理下载
const handleDownload = async () => {
  if (!route.params.id) return

  downloading.value = true
  try {
    await resourceStore.download(route.params.id as string)
    message.success('开始下载')
  } catch (error) {
    message.error('下载失败')
  } finally {
    downloading.value = false
  }
}

// 处理分享
const showShareModal = () => {
  shareModalVisible.value = true
}

const handleShare = async () => {
  if (!route.params.id) return

  sharing.value = true
  try {
    await resourceStore.share(route.params.id as string, shareForm.value)
    message.success('分享成功')
    shareModalVisible.value = false
  } catch (error) {
    message.error('分享失败')
  } finally {
    sharing.value = false
  }
}

// 处理评论
const handleAddComment = async () => {
  if (!commentContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }

  if (!route.params.id) return

  submitting.value = true
  try {
    await resourceStore.addComment(route.params.id as string, {
      content: commentContent.value,
    })
    message.success('评论成功')
    commentContent.value = ''
    fetchComments()
  } catch (error) {
    message.error('评论失败')
  } finally {
    submitting.value = false
  }
}

// 处理回复
const handleReply = (comment: CommentWithAuthor) => {
  currentReplyTo.value = comment
  replyModalVisible.value = true
}

const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  if (!currentReplyTo.value?.id || !route.params.id) {
    message.warning('无法完成回复操作')
    return
  }

  submitting.value = true
  try {
    await resourceStore.addComment(route.params.id as string, {
      content: replyContent.value,
      parentId: currentReplyTo.value.id,
    })
    message.success('回复成功')
    replyContent.value = ''
    replyModalVisible.value = false
    fetchComments()
  } catch (error) {
    message.error('回复失败')
  } finally {
    submitting.value = false
  }
}

// 处理删除评论
const handleDeleteComment = async (comment: CommentWithAuthor) => {
  if (!route.params.id) return

  try {
    await resourceStore.deleteComment(route.params.id as string, comment.id)
    message.success('删除成功')
    fetchComments()
  } catch (error) {
    message.error('删除失败')
  }
}

// 检查是否可以删除评论
const canDeleteComment = (comment: CommentWithAuthor) => {
  return userStore.isAdmin || (userStore.userInfo && comment.author.id === userStore.userInfo.id)
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchComments()
}

onMounted(() => {
  fetchResource()
})
</script>

<style lang="scss" scoped>
.resource-detail {
  padding: 24px;

  .resource-content {
    margin-top: 24px;
  }

  .resource-info {
    .resource-meta {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.45);

      span {
        margin-right: 16px;
      }
    }

    .content {
      margin: 16px 0;
    }

    .tags {
      margin-top: 16px;
    }
  }

  .comment-section {
    margin-top: 24px;

    .comment-input {
      margin-bottom: 24px;

      .comment-actions {
        margin-top: 16px;
        text-align: right;
      }
    }

    .comment-list {
      margin-top: 24px;
    }
  }
}
</style>
