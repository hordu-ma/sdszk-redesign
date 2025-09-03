<template>
  <div class="resource-detail">
    <a-page-header
      :title="resource?.title || '资源详情'"
      @back="() => router.push('/resources')"
    >
      <template #extra>
        <a-space>
          <a-button
            v-if="!isDownloadDisabled"
            type="primary"
            :loading="downloading"
            :disabled="!resource"
            @click="downloadResource"
          >
            <template #icon>
              <download-outlined />
            </template>
            下载
          </a-button>
          <a-button
            :loading="sharing"
            :disabled="!resource"
            @click="shareResource"
          >
            <template #icon>
              <share-alt-outlined />
            </template>
            分享
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[24, 24]" class="resource-content">
      <!-- 资源详情 -->
      <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <a-card v-if="loading">
          <a-skeleton active />
        </a-card>
        <a-card v-else-if="resource">
          <!-- 媒体预览区域 -->
          <div class="media-preview">
            <!-- 视频文件优先显示播放器 -->
            <div
              v-if="getMediaUrl(resource) && isVideoFile(resource)"
              class="video-container"
              @contextmenu.prevent
            >
              <video-player
                :src="getMediaUrl(resource)"
                :poster="resource.thumbnail || ''"
              />
            </div>

            <!-- 理论前沿和教学研究模块PDF文件：优先显示首页缩略图 -->
            <div
              v-else-if="
                isPdfFile(resource) && isTheoryOrTeaching && resource.thumbnail
              "
              class="pdf-main-preview"
              @contextmenu.prevent
            >
              <div class="pdf-thumbnail-main" @click="viewPdfResource">
                <img
                  :src="resource.thumbnail"
                  :alt="resource.title + ' - PDF首页预览'"
                  class="pdf-thumbnail-large"
                  @error="handleThumbnailError"
                />
                <div class="pdf-read-overlay">
                  <div class="read-prompt">
                    <file-pdf-outlined class="pdf-large-icon" />
                    <span class="read-text">点击阅读完整PDF</span>
                    <div class="read-hint">在新窗口中打开</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 其他PDF文件显示缩略图 -->
            <div
              v-else-if="isPdfFile(resource) && resource.thumbnail"
              class="pdf-preview-container"
            >
              <div class="pdf-thumbnail-wrapper" @click="viewPdfResource">
                <img
                  :src="resource.thumbnail"
                  :alt="resource.title + ' - PDF首页'"
                  class="pdf-thumbnail"
                  @error="handleThumbnailError"
                />
                <div class="pdf-overlay">
                  <file-pdf-outlined class="pdf-icon" />
                  <span>点击阅读PDF</span>
                </div>
              </div>
            </div>

            <!-- PDF文件无缩略图时显示默认图标 -->
            <div
              v-else-if="isPdfFile(resource)"
              class="pdf-no-thumbnail"
              @contextmenu.prevent
            >
              <div class="pdf-default-view" @click="viewPdfResource">
                <file-pdf-outlined class="pdf-default-icon" />
                <div class="pdf-info">
                  <h3>{{ resource.title }}</h3>
                  <p>点击在新窗口中阅读PDF文档</p>
                </div>
              </div>
            </div>

            <!-- 音频文件显示播放器 -->
            <div
              v-else-if="getMediaUrl(resource) && isAudioFile(resource)"
              class="audio-container"
            >
              <audio
                :src="getMediaUrl(resource)"
                controls
                preload="metadata"
                class="media-player"
                @error="handleMediaError"
              >
                您的浏览器不支持音频播放
              </audio>
            </div>

            <!-- 图片文件显示图片 -->
            <div
              v-else-if="getMediaUrl(resource) && isImageFile(resource)"
              class="image-container"
            >
              <img
                :src="getMediaUrl(resource)"
                :alt="resource.title"
                class="media-player"
                @error="handleMediaError"
              />
            </div>

            <!-- 其他文件类型优先显示缩略图，点击可查看 -->
            <div v-else-if="resource.thumbnail" class="thumbnail-container">
              <img
                :src="resource.thumbnail"
                :alt="resource.title"
                class="resource-thumbnail clickable-thumbnail"
                @error="handleThumbnailError"
                @click="viewResource"
              />
              <div class="thumbnail-overlay">
                <eye-outlined class="view-icon" />
                <span>点击查看</span>
              </div>
            </div>

            <!-- 没有缩略图时显示默认图标 -->
            <div v-else class="default-thumbnail">
              <div class="file-type-icon">
                <file-pdf-outlined v-if="isPdfFile(resource)" />
                <video-camera-outlined v-else-if="isVideoFile(resource)" />
                <audio-outlined v-else-if="isAudioFile(resource)" />
                <picture-outlined v-else-if="isImageFile(resource)" />
                <file-text-outlined v-else />
              </div>
              <span class="file-type-text">{{
                getFileTypeText(resource)
              }}</span>
            </div>
          </div>

          <div class="resource-info">
            <div class="resource-meta">
              <span>
                <user-outlined />
                {{
                  typeof resource?.author === "string"
                    ? resource.author
                    : resource?.author?.name ||
                      resource?.createdBy?.name ||
                      "未知作者"
                }}
              </span>
              <span>
                <calendar-outlined />
                {{ formatDate(resource?.publishDate || resource?.createdAt) }}
              </span>
              <span><eye-outlined /> {{ resource?.viewCount || 0 }} 查看</span>
              <span v-if="!isDownloadDisabled">
                <download-outlined />
                {{ resource?.downloadCount || 0 }} 下载
              </span>
            </div>
            <div
              v-if="resource?.description"
              class="content"
              v-html="resource.description"
            />
            <div v-if="resource?.tags?.length" class="tags">
              <a-tag v-for="tag in resource.tags" :key="tag">
                {{ tag }}
              </a-tag>
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
              <a-button type="primary" @click="() => router.push('/resources')">
                返回资源中心
              </a-button>
            </template>
          </a-result>
        </a-card>

        <!-- 暂时禁用评论系统 -->
        <a-card title="评论" class="comment-section" v-if="false">
          <a-empty description="评论功能开发中..." />
        </a-card>
      </a-col>

      <!-- 相关资源 -->
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="相关资源">
          <template v-if="relatedResources.length">
            <a-list :data-source="relatedResources" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <router-link
                    :to="`/resources/detail/${item.id}`"
                    class="related-resource-link"
                  >
                    {{ item.title }}
                  </router-link>
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
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { resourceApi } from "@/api";
import type { Resource } from "@/api/modules/resources/index";
import { message, Modal } from "ant-design-vue";
import VideoPlayer from "@/components/VideoPlayer.vue";
import {
  DownloadOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  PictureOutlined,
  FileTextOutlined,
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
    const response = await resourceApi.instance.getDetail(resourceId);
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
    const response = await resourceApi.instance.getList({
      category: resource.value.categoryId,
      limit: 5,
    });
    if (response.success && response.data) {
      // 过滤掉当前资源，只显示其他资源
      relatedResources.value = response.data
        .filter((r: any) => r.id !== resource.value?.id)
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

// 媒体相关工具函数
const getMediaUrl = (resource: Resource): string => {
  const resourceData = resource as any;

  // 优先级：fileUrl(模型主字段) > url > downloadUrl > attachmentUrl > videoUrl
  const url =
    resourceData.fileUrl ||
    resourceData.url ||
    resourceData.downloadUrl ||
    resourceData.attachmentUrl ||
    resourceData.videoUrl ||
    (resourceData.attachments && resourceData.attachments[0]?.url) ||
    "";

  // 开发环境输出调试信息
  if (import.meta.env.DEV) {
    console.log("Resource URL fields:", {
      fileUrl: resourceData.fileUrl,
      url: resourceData.url,
      downloadUrl: resourceData.downloadUrl,
      attachmentUrl: resourceData.attachmentUrl,
      videoUrl: resourceData.videoUrl,
      attachments: resourceData.attachments,
      finalUrl: url,
    });
  }

  // 如果URL是相对路径，添加服务器地址前缀
  if (url && !url.startsWith("http")) {
    // 开发环境使用localhost:3000，生产环境使用相对路径
    const baseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";
    return `${baseUrl}${url.startsWith("/") ? url : "/" + url}`;
  }

  return url;
};

const isVideoFile = (resource: Resource): boolean => {
  const url = getMediaUrl(resource);
  const videoExtensions = [".mp4", ".webm", ".ogg", ".avi", ".mov", ".wmv"];
  return (
    videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
    (resource.mimeType?.startsWith("video/") ?? false) ||
    (resource.fileType?.includes("video") ?? false)
  );
};

const isAudioFile = (resource: Resource): boolean => {
  const url = getMediaUrl(resource);
  const audioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".aac"];
  return (
    audioExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
    (resource.mimeType?.startsWith("audio/") ?? false) ||
    (resource.fileType?.includes("audio") ?? false)
  );
};

const isImageFile = (resource: Resource): boolean => {
  const url = getMediaUrl(resource);
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  return (
    imageExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
    (resource.mimeType?.startsWith("image/") ?? false) ||
    (resource.fileType?.includes("image") ?? false)
  );
};

const isPdfFile = (resource: Resource): boolean => {
  const url = getMediaUrl(resource);
  return (
    url.toLowerCase().includes(".pdf") ||
    (resource.mimeType?.includes("pdf") ?? false)
  );
};

// 判断是否为理论前沿或教学研究模块
const isTheoryOrTeaching = computed(() => {
  if (!resource.value) return false;

  // 检查路由参数中的category（最高优先级）
  const categoryFromRoute = route.query.category || route.params.category;
  if (["theory", "teaching"].includes(categoryFromRoute as string)) {
    return true;
  }

  // 强化分类检查：支持多种分类表示方式
  if (resource.value.category) {
    const category = resource.value.category;
    let categoryKey = "";

    if (typeof category === "string") {
      categoryKey = category;
    } else if (category && typeof category === "object") {
      categoryKey = category.key || category.name || category.id || "";
    }

    // 理论前沿和教学研究（支持中英文）
    const targetCategories = [
      "theory",
      "teaching",
      "理论前沿",
      "教学研究",
      "Theory",
      "Teaching",
    ];

    if (targetCategories.includes(categoryKey)) {
      return true;
    }
  }

  // 检查资源类型字段
  const resourceType =
    (resource.value as any).resourceType || (resource.value as any).type;
  if (["theory", "teaching"].includes(resourceType)) {
    return true;
  }

  // 检查URL路径中的分类信息
  const currentPath = route.path;
  if (currentPath.includes("theory") || currentPath.includes("teaching")) {
    return true;
  }

  // 检查标题中是否包含关键词（作为后备判断）
  const title = (resource.value.title || "").toLowerCase();
  const keywords = ["理论前沿", "教学研究", "theory", "teaching"];
  if (keywords.some((keyword) => title.includes(keyword))) {
    return true;
  }

  return false;
});

// 判断是否为禁用下载的资源（包括理论前沿和教学研究）
const isDownloadDisabled = computed(() => {
  if (!resource.value) return false;

  // 检查路由参数中的category（最高优先级）
  const categoryFromRoute = route.query.category || route.params.category;
  if (["video", "theory", "teaching"].includes(categoryFromRoute as string)) {
    return true;
  }

  // 检查视频文件类型
  if (isVideoFile(resource.value)) {
    return true;
  }

  // 强化分类检查：支持多种分类表示方式
  if (resource.value.category) {
    const category = resource.value.category;
    let categoryKey = "";

    if (typeof category === "string") {
      categoryKey = category;
    } else if (category && typeof category === "object") {
      categoryKey = category.key || category.name || category.id || "";
    }

    // 理论前沿和教学研究禁用下载（支持中英文）
    const disabledCategories = [
      "theory",
      "teaching",
      "video",
      "理论前沿",
      "教学研究",
      "优课视窗",
      "Theory",
      "Teaching",
      "Video",
    ];

    if (disabledCategories.includes(categoryKey)) {
      return true;
    }
  }

  // 检查资源类型字段
  const resourceType =
    (resource.value as any).resourceType || (resource.value as any).type;
  if (["theory", "teaching", "video", "document"].includes(resourceType)) {
    return true;
  }

  // 检查URL路径中的分类信息
  const currentPath = route.path;
  if (currentPath.includes("theory") || currentPath.includes("teaching")) {
    return true;
  }

  // 检查标题或内容中是否包含关键词（作为后备判断）
  const title = (resource.value.title || "").toLowerCase();
  const content = (
    (resource.value as any).content ||
    (resource.value as any).description ||
    ""
  ).toLowerCase();

  const keywords = ["理论前沿", "教学研究", "优课视窗", "theory", "teaching"];
  if (
    keywords.some(
      (keyword) => title.includes(keyword) || content.includes(keyword),
    )
  ) {
    return true;
  }

  // 开发环境输出调试信息
  if (import.meta.env.DEV) {
    console.log("下载状态检查:", {
      categoryFromRoute,
      resourceCategory: resource.value.category,
      resourceType: (resource.value as any).resourceType,
      currentPath,
      title: resource.value.title,
      isDisabled: false,
    });
  }

  return false;
});

const handleMediaError = (event: Event) => {
  console.error("媒体加载失败:", event);
  if (isDownloadDisabled.value) {
    message.warning("媒体文件加载失败，请稍后重试");
  } else {
    message.warning("媒体文件加载失败，请尝试下载查看");
  }
};

// 查看资源（点击缩略图时）
const viewResource = () => {
  if (!resource.value) return;

  const url = getMediaUrl(resource.value);
  if (!url) {
    message.warning("资源文件不可用");
    return;
  }

  // 在新窗口打开文件进行查看
  window.open(url, "_blank");
};

// 专门用于PDF资源的查看函数
const viewPdfResource = () => {
  if (!resource.value) {
    message.warning("资源数据不可用");
    return;
  }

  const url = getMediaUrl(resource.value);
  if (!url) {
    // 开发环境输出更详细的错误信息
    if (import.meta.env.DEV) {
      console.error("PDF URL获取失败，资源数据：", resource.value);
    }
    message.error("PDF文件链接不可用，请联系管理员检查资源配置");
    return;
  }

  try {
    // 更新查看次数
    if (resource.value.viewCount !== undefined) {
      resource.value.viewCount += 1;
    }

    // 在新窗口打开PDF进行阅读
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      message.warning("无法打开新窗口，请检查浏览器弹窗拦截设置");
      return;
    }

    // 尝试禁用右键菜单（部分浏览器支持）
    newWindow.onload = () => {
      try {
        newWindow.document.oncontextmenu = () => false;
        // 添加CSS样式隐藏打印按钮等
        const style = newWindow.document.createElement("style");
        style.textContent = `
          @media print {
            body { display: none !important; }
          }
          /* 隐藏PDF查看器的下载按钮 */
          button[title*="下载"],
          button[title*="Download"],
          .download,
          .toolbarButton.download {
            display: none !important;
          }
        `;
        newWindow.document.head?.appendChild(style);
      } catch (error) {
        // 跨域限制或其他错误，静默处理
        console.warn("无法设置PDF查看器样式:", error);
      }
    };

    message.success("正在新窗口中打开PDF文档");
  } catch (error) {
    console.error("打开PDF失败:", error);
    message.error("打开PDF文档失败，请稍后重试");
  }
};

// 缩略图相关函数
const handleThumbnailError = (event: Event) => {
  console.error("缩略图加载失败:", event);
  // 缩略图加载失败时，用默认图标替换
  const img = event.target as HTMLImageElement;
  if (img && resource.value) {
    // 清空 thumbnail 字段，让 v-else 显示默认图标
    resource.value.thumbnail = "";
  }
};

const getFileTypeText = (resource: Resource): string => {
  if (isPdfFile(resource)) return "PDF文档";
  if (isVideoFile(resource)) return "视频文件";
  if (isAudioFile(resource)) return "音频文件";
  if (isImageFile(resource)) return "图片文件";
  return "文档资源";
};

onMounted(() => {
  fetchResource();
});

// 监听路由参数变化，实现页面内跳转更新
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchResource();
    }
  },
);
</script>

<style lang="scss" scoped>
.resource-detail {
  padding: 24px;

  .resource-content {
    margin-top: 24px;
  }

  .media-preview {
    margin-bottom: 24px;

    .video-container,
    .audio-container,
    .image-container,
    .pdf-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
    }

    .media-player {
      max-width: 100%;
      max-height: 500px;
      border-radius: 4px;
    }

    .video-container .media-player {
      width: 100%;
      height: auto;
    }

    .audio-container .media-player {
      width: 100%;
    }

    .image-container .media-player {
      max-height: 400px;
      object-fit: contain;
    }

    .pdf-viewer {
      width: 100%;
      height: 600px;
      border: none;
    }
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

  .related-resource-link {
    color: #1890ff;
    text-decoration: none;

    &:hover {
      color: #40a9ff;
      text-decoration: underline;
    }
  }

  .thumbnail-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
    min-height: 200px;
  }

  .resource-thumbnail {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    object-fit: cover;
  }

  .thumbnail-container {
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);

      .thumbnail-overlay {
        opacity: 1;
      }
    }
  }

  .clickable-thumbnail {
    display: block;
    width: 100%;
  }

  .thumbnail-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 4px;

    .view-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }
  }

  // 理论前沿和教学研究模块的PDF主要展示区域
  .pdf-main-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    padding: 24px;
    min-height: 400px;
  }

  .pdf-thumbnail-main {
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    max-width: 600px;
    width: 100%;

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);

      .pdf-read-overlay {
        opacity: 1;
      }
    }
  }

  .pdf-thumbnail-large {
    display: block;
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: contain;
    border-radius: 12px;
  }

  .pdf-read-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 77, 79, 0.9),
      rgba(255, 107, 107, 0.9)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .read-prompt {
    text-align: center;

    .pdf-large-icon {
      font-size: 64px;
      margin-bottom: 16px;
      display: block;
    }

    .read-text {
      font-size: 20px;
      font-weight: 600;
      display: block;
      margin-bottom: 8px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .read-hint {
      font-size: 14px;
      opacity: 0.9;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
  }

  // 其他PDF文件的预览容器
  .pdf-preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 16px;
  }

  .pdf-thumbnail-wrapper {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.02);

      .pdf-overlay {
        opacity: 1;
      }
    }
  }

  .pdf-thumbnail {
    display: block;
    max-width: 100%;
    max-height: 400px;
    width: auto;
    height: auto;
    border-radius: 8px;
  }

  .pdf-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;

    .pdf-icon {
      font-size: 48px;
      margin-bottom: 12px;
      color: #ff4d4f;
    }

    span {
      font-size: 16px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
  }

  // 无缩略图时的PDF默认展示
  .pdf-no-thumbnail {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 32px;
    min-height: 300px;
  }

  .pdf-default-view {
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 24px;
    border-radius: 8px;

    &:hover {
      background: rgba(255, 77, 79, 0.1);
      transform: translateY(-2px);
    }

    .pdf-default-icon {
      font-size: 72px;
      color: #ff4d4f;
      margin-bottom: 16px;
    }

    .pdf-info {
      h3 {
        color: #333;
        margin-bottom: 8px;
        font-size: 18px;
      }

      p {
        color: #666;
        margin: 0;
        font-size: 14px;
      }
    }
  }

  .default-thumbnail {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8c8c8c;
    text-align: center;

    .file-type-icon {
      font-size: 48px;
      margin-bottom: 12px;
      color: #d9d9d9;
    }

    .file-type-text {
      font-size: 14px;
      color: #595959;
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .resource-detail {
    padding: 12px;

    .resource-content {
      margin-top: 16px;
    }

    .media-preview {
      margin-bottom: 16px;

      .video-container,
      .audio-container,
      .image-container,
      .pdf-container {
        padding: 12px;
      }

      .media-player {
        max-height: 300px;
      }

      .pdf-viewer {
        height: 400px;
      }
    }

    .resource-info {
      .resource-meta {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        span {
          margin-right: 0;
          font-size: 12px;
        }
      }

      .content {
        margin: 12px 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .tags {
        margin-top: 12px;
      }
    }

    .comment-section {
      margin-top: 16px;
    }

    .related-resource-link {
      font-size: 14px;
      line-height: 1.4;
    }
  }
}

@media (max-width: 480px) {
  .resource-detail {
    padding: 8px;

    :deep(.ant-page-header) {
      padding: 12px 0;

      .ant-page-header-heading-title {
        font-size: 16px;
        line-height: 1.3;
      }

      .ant-page-header-heading-extra {
        margin-top: 8px;
      }

      .ant-space {
        flex-direction: column;
        width: 100%;

        .ant-space-item {
          width: 100%;

          .ant-btn {
            width: 100%;
          }
        }
      }
    }

    .resource-content {
      margin-top: 12px;
    }

    .media-preview {
      margin-bottom: 12px;

      .video-container,
      .audio-container,
      .image-container,
      .pdf-container {
        padding: 8px;
      }

      .media-player {
        max-height: 250px;
      }

      .pdf-viewer {
        height: 300px;
      }
    }

    .resource-info {
      .resource-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;

        span {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .content {
        margin: 10px 0;
        font-size: 13px;
      }

      .tags {
        margin-top: 10px;

        .ant-tag {
          font-size: 11px;
          margin-bottom: 4px;
        }
      }
    }

    .thumbnail-container {
      min-height: 150px;
      padding: 12px;
    }

    .resource-thumbnail {
      max-height: 200px;
    }

    .default-thumbnail {
      .file-type-icon {
        font-size: 36px;
        margin-bottom: 8px;
      }

      .file-type-text {
        font-size: 12px;
      }
    }

    :deep(.ant-card) {
      .ant-card-head {
        padding: 12px 16px;

        .ant-card-head-title {
          font-size: 14px;
        }
      }

      .ant-card-body {
        padding: 12px 16px;
      }
    }

    :deep(.ant-list-item) {
      padding: 8px 0;
    }

    .related-resource-link {
      font-size: 13px;
      line-height: 1.3;
    }
  }
}
</style>
