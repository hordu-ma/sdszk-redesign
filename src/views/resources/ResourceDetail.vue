<template>
  <div class="resource-detail">
    <a-page-header
      :title="resource?.title || '资源详情'"
      @back="() => router.push('/resources')"
    >
      <template #extra>
        <a-space>
          <a-button
            type="primary"
            @click="downloadResource"
            :loading="downloading"
            :disabled="!resource"
          >
            <template #icon><DownloadOutlined /></template>
            下载
          </a-button>
          <a-button
            @click="shareResource"
            :loading="sharing"
            :disabled="!resource"
          >
            <template #icon><ShareAltOutlined /></template>
            分享
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[24, 24]" class="resource-content">
      <!-- 资源详情 -->
      <a-col :span="16">
        <a-card v-if="loading">
          <a-skeleton active />
        </a-card>
        <a-card v-else-if="resource">
          <div class="resource-info">
            <div class="resource-meta">
              <span
                ><UserOutlined />
                {{
                  typeof resource?.author === "string"
                    ? resource.author
                    : resource?.author?.name ||
                      resource?.createdBy?.name ||
                      "未知作者"
                }}</span
              >
              <span
                ><CalendarOutlined />
                {{
                  formatDate(resource?.publishDate || resource?.createdAt)
                }}</span
              >
              <span><EyeOutlined /> {{ resource?.viewCount || 0 }} 查看</span>
              <span
                ><DownloadOutlined />
                {{ resource?.downloadCount || 0 }} 下载</span
              >
            </div>
            <div
              class="content"
              v-if="resource?.description"
              v-html="resource.description"
            ></div>
            <div class="tags" v-if="resource?.tags?.length">
              <a-tag v-for="tag in resource.tags" :key="tag">{{ tag }}</a-tag>
            </div>
          </div>
        </a-card>
        <a-card v-else>
          <a-result
            status="404"
            title="资源不存在"
            sub-title="请检查资源ID是否正确"
          >
            <template #extra>
              <a-button type="primary" @click="() => router.push('/resources')"
                >返回资源中心</a-button
              >
            </template>
          </a-result>
        </a-card>

        <!-- 暂时禁用评论系统 -->
        <a-card title="评论" class="comment-section" v-if="false">
          <a-empty description="评论功能开发中..." />
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
    <!-- 暂时禁用回复和分享模态框 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { resourceApi } from "@/api";
import type { Resource } from "@/api/modules/resources/index";
import { message, Modal } from "ant-design-vue";
import {
  DownloadOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();
const route = useRoute();

// 资源相关状态
const resource = ref<Resource | null>(null);
const relatedResources = ref<Resource[]>([]);
const loading = ref(false);
const downloading = ref(false);
const sharing = ref(false);

// 格式化日期
const formatDate = (date?: string): string => {
  if (!date) return "未知日期";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "无效日期";
    }
    return dateObj.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("日期格式化失败:", error);
    return "日期错误";
  }
};

// 初始化资源详情
const fetchResource = async () => {
  const resourceId = route.params.id as string;
  if (!resourceId) {
    message.error("资源ID不能为空");
    return;
  }

  loading.value = true;
  try {
    const response = await resourceApi.getDetail(resourceId);
    if (response.success && response.data) {
      resource.value = response.data;
      console.log("资源详情获取成功:", response.data);

      // 获取相关资源（同分类的其他资源）
      await fetchRelatedResources();
    } else {
      message.error("获取资源详情失败");
      console.error("API响应失败:", response);
    }
  } catch (error) {
    console.error("获取资源详情失败:", error);
    message.error("获取资源详情失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 获取相关资源
const fetchRelatedResources = async () => {
  if (!resource.value) return;

  try {
    const response = await resourceApi.getList({
      category: resource.value.categoryId,
      limit: 5,
    });
    if (response.success && response.data) {
      // 过滤掉当前资源，只显示其他资源
      relatedResources.value = response.data
        .filter((r) => r.id !== resource.value?.id)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("获取相关资源失败:", error);
  }
};

// 工具函数：复制到剪贴板
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error("复制失败:", error);
    return false;
  }
};

// 获取文件扩展名
const getFileExtension = (filename: string, mimeType?: string): string => {
  const nameExt = filename.split(".").pop()?.toLowerCase();
  if (nameExt && nameExt !== filename) {
    return `.${nameExt}`;
  }

  if (mimeType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "video/mp4": ".mp4",
      "audio/mp3": ".mp3",
      "text/plain": ".txt",
    };
    return mimeMap[mimeType] || "";
  }
  return "";
};

// 下载资源
const downloadResource = async () => {
  if (!resource.value) {
    message.warning("资源不可用");
    return;
  }

  downloading.value = true;
  try {
    // 尝试多种可能的URL字段
    const resourceData = resource.value as any;
    const downloadUrl =
      resourceData.url || resourceData.fileUrl || resourceData.downloadUrl;

    if (!downloadUrl) {
      message.warning("该资源暂无下载链接");
      return;
    }

    const filename =
      resource.value.title +
      getFileExtension(resource.value.title, resource.value.mimeType);

    // 创建下载链接
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("下载已开始");

    // 更新下载次数
    if (resource.value.downloadCount !== undefined) {
      resource.value.downloadCount += 1;
    }
  } catch (error) {
    console.error("下载失败:", error);
    message.error("下载失败，请稍后重试");
  } finally {
    downloading.value = false;
  }
};

// 分享资源
const shareResource = async () => {
  if (!resource.value) {
    message.warning("资源不可用");
    return;
  }

  sharing.value = true;
  const shareUrl = window.location.href;
  const shareTitle = resource.value.title;
  const shareText = `${shareTitle} - 山东省大中小学思政课一体化指导中心`;

  try {
    // 检查是否支持 Web Share API
    if (
      navigator.share &&
      /mobile|android|iphone|ipad/i.test(navigator.userAgent)
    ) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      message.success("分享成功");
    } else {
      // 直接复制链接，更简单可靠
      const success = await copyToClipboard(shareUrl);
      if (success) {
        message.success("链接已复制到剪贴板，可以分享给他人了");
      } else {
        // 降级方案：显示链接让用户手动复制
        Modal.info({
          title: "分享资源",
          content: `请复制以下链接分享给他人：\n\n${shareUrl}`,
        });
      }
    }
  } catch (error) {
    console.error("分享失败:", error);
    // 降级到复制链接
    const success = await copyToClipboard(shareUrl);
    if (success) {
      message.success("链接已复制到剪贴板");
    } else {
      message.error("分享失败，请手动复制链接：" + shareUrl);
    }
  } finally {
    sharing.value = false;
  }
};

onMounted(() => {
  fetchResource();
});
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
