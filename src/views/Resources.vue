<template>
  <page-layout title="资源中心" description="大中小学思政课一体化教育资源库">
    <div class="resources-content">
      <!-- 分类导航 -->
      <div class="category-nav">
        <a-tabs
          v-model:activeKey="activeCategory"
          @change="handleCategoryChange"
        >
          <a-tab-pane key="all" tab="全部资源"></a-tab-pane>
          <a-tab-pane
            v-for="category in categories"
            :key="category.key"
            :tab="category.name"
          ></a-tab-pane>
        </a-tabs>
      </div>

      <!-- 资源列表 -->
      <div class="resources-list">
        <a-spin :spinning="loading">
          <a-row :gutter="[24, 24]">
            <a-col :span="8" v-for="resource in resources" :key="resource.id">
              <a-card
                hoverable
                class="resource-card"
                @click="goToDetail(resource.id)"
              >
                <template #cover>
                  <div class="resource-cover">
                    <img
                      v-if="resource.url"
                      :src="resource.url"
                      :alt="resource.title"
                    />
                    <div v-else class="resource-icon">
                      <FileOutlined v-if="resource.type === 'document'" />
                      <VideoCameraOutlined
                        v-else-if="resource.type === 'video'"
                      />
                      <PictureOutlined v-else-if="resource.type === 'image'" />
                      <SoundOutlined v-else-if="resource.type === 'audio'" />
                      <FileOutlined v-else />
                    </div>
                  </div>
                </template>
                <a-card-meta :title="resource.title">
                  <template #description>
                    <div class="resource-meta">
                      <p class="resource-summary">{{ resource.description }}</p>
                      <div class="resource-info">
                        <span
                          ><UserOutlined />
                          {{
                            typeof resource.author === "string"
                              ? resource.author
                              : resource.author?.name ||
                                resource.createdBy?.name ||
                                "Unknown"
                          }}</span
                        >
                        <span
                          ><CalendarOutlined />
                          {{ formatDate(resource.publishDate) }}</span
                        >
                        <span
                          ><EyeOutlined /> {{ resource.viewCount || 0 }}</span
                        >
                        <span
                          ><DownloadOutlined />
                          {{ resource.downloadCount || 0 }}</span
                        >
                      </div>
                    </div>
                  </template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>

          <!-- 分页 -->
          <div class="pagination-container" v-if="total > 0">
            <a-pagination
              v-model:current="currentPage"
              :total="total"
              :pageSize="pageSize"
              @change="handlePageChange"
              show-less-items
            />
          </div>

          <!-- 无数据提示 -->
          <a-empty v-if="resources.length === 0" description="暂无相关资源" />
        </a-spin>
      </div>
    </div>
  </page-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
  FileOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  SoundOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons-vue";
import PageLayout from "../components/common/PageLayout.vue";
import { RESOURCE_CATEGORIES } from "../config";
import { resourceApi } from "@/api";
import type { Resource } from "@/api";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const activeCategory = ref("all");
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const resources = ref<Resource[]>([]);
const categories = ref(RESOURCE_CATEGORIES);

// 初始化时从路由参数获取分类
onMounted(() => {
  if (route.query.category) {
    activeCategory.value = route.query.category as string;
  }
  fetchResources();
});

// 监听分类变化，更新路由参数
watch(activeCategory, (newCategory) => {
  router.push({
    path: "/resources",
    query: { ...(newCategory !== "all" ? { category: newCategory } : {}) },
  });
  currentPage.value = 1;
  fetchResources();
});

// 获取资源列表
const fetchResources = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    // 如果有选择分类，添加分类筛选
    if (activeCategory.value !== "all") {
      // 直接传递分类key，让后端处理key到ObjectId的转换
      params.category = activeCategory.value;
    }

    const response: any = await resourceApi.getList(params);

    if (response.success) {
      resources.value = response.data;
      total.value = response.pagination?.total || 0;
    } else {
      message.error("获取资源列表失败");
    }
  } catch (error: any) {
    console.error("获取资源列表失败", error);
    message.error("获取资源列表失败");
  } finally {
    loading.value = false;
  }
};

// 处理分类变化
const handleCategoryChange = (key: string) => {
  activeCategory.value = key;
};

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchResources();
};

// 跳转到详情页
const goToDetail = (id: string) => {
  router.push(`/resources/detail/${id}`);
};

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 初始化
// onMounted(() => {
//   fetchResources();
// });
</script>

<style scoped>
.resources-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-nav {
  margin-bottom: 24px;
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.resources-list {
  margin-top: 24px;
}

.resource-card {
  height: 100%;
  transition: all 0.3s ease;
}

.resource-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.resource-cover {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.resource-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-icon {
  font-size: 48px;
  color: #1890ff;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-summary {
  margin: 0;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #999;
  font-size: 12px;
}

.pagination-container {
  margin-top: 24px;
  text-align: center;
}
</style>
