<template>
  <page-layout :title="categoryTitle">
    <div class="resources-by-category">
      <h2>{{ categoryTitle }}</h2>
      <a-spin :spinning="loading">
        <a-row :gutter="[24, 24]">
          <a-col
            v-for="resource in resources"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="8"
            :xl="8"
            :key="resource.id"
          >
            <a-card
              hoverable
              class="resource-card"
              @click="goToDetail(resource.id)"
            >
              <template #cover>
                <div class="resource-cover">
                  <!-- 视频资源显示视频播放器 -->
                  <div v-if="isVideoResource(resource)" class="video-preview">
                    <video
                      :src="resource.fileUrl"
                      :poster="resource.thumbnail"
                      class="resource-video"
                      preload="metadata"
                    >
                      您的浏览器不支持视频播放
                    </video>
                    <div class="video-overlay">
                      <play-circle-outlined class="play-icon" />
                    </div>
                  </div>
                  <!-- 其他资源显示缩略图 -->
                  <img
                    v-else-if="resource.thumbnail"
                    :src="resource.thumbnail"
                    :alt="resource.title"
                    class="resource-thumbnail"
                  />
                  <div v-else class="resource-placeholder">
                    <file-outlined />
                  </div>
                </div>
              </template>
              <a-card-meta :title="resource.title">
                <template #description>
                  <div class="resource-description">
                    {{ resource.description }}
                  </div>
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
        <a-empty
          v-if="!loading && resources.length === 0"
          description="暂无资源"
        />
      </a-spin>
    </div>
  </page-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { FileOutlined, PlayCircleOutlined } from "@ant-design/icons-vue";
import { resourceApi } from "@/api";
import PageLayout from "@/components/common/PageLayout.vue";
import type { Resource } from "@/api";

const props = defineProps<{
  category?: string;
}>();

const route = useRoute();
const router = useRouter();
const resources = ref<Resource[]>([]);
const loading = ref(false);

// 支持两种方式：props传递 或 路由参数传递
const category = computed(
  () => props.category || (route.params.category as string),
);
const categoryTitle = computed(() => {
  if (category.value === "theory") return "理论前沿";
  if (category.value === "teaching") return "教学研究";
  if (category.value === "video") return "优课视窗";
  return "资源分类";
});

const fetchResources = async () => {
  loading.value = true;
  try {
    const res: any = await resourceApi.instance.getList({
      category: category.value,
    });
    if (res.success) resources.value = res.data;
  } finally {
    loading.value = false;
  }
};

const goToDetail = (id: string) => {
  router.push(`/resources/detail/${id}`);
};

// 判断是否为视频资源
const isVideoResource = (resource: Resource): boolean => {
  return (
    resource.fileType?.startsWith("video/") ||
    resource.fileUrl?.includes("/videos/") ||
    category.value === "video"
  );
};

// 获取完整URL - 在开发环境中，vite代理会处理相对路径
onMounted(() => {
  fetchResources();
});
</script>

<style scoped>
.resources-by-category {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .resources-by-category {
    padding: 12px;
  }

  .resources-by-category h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .resource-card {
    margin-bottom: 16px;
  }

  .resource-cover {
    height: 160px;
  }
}

@media (max-width: 480px) {
  .resources-by-category {
    padding: 8px;
  }

  .resources-by-category h2 {
    font-size: 18px;
    margin-bottom: 12px;
    text-align: center;
  }

  .resource-cover {
    height: 140px;
  }

  .resource-placeholder .anticon {
    font-size: 36px;
  }

  .resource-card :deep(.ant-card-meta-title) {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .resource-description {
    font-size: 12px;
    line-height: 1.3;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
}

.resource-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.resource-cover {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.resource-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.resource-card:hover .resource-thumbnail {
  transform: scale(1.05);
}

.resource-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #bfbfbf;
}

.resource-placeholder .anticon {
  font-size: 48px;
}

.resource-description {
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.resource-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}

.play-icon {
  font-size: 48px;
  color: white;
  opacity: 0.8;
  transition: all 0.3s;
}

.resource-card:hover .video-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.resource-card:hover .play-icon {
  opacity: 1;
  transform: scale(1.1);
}
</style>
