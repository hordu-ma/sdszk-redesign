<template>
  <page-layout :title="categoryTitle">
    <div class="resources-by-category">
      <h2>{{ categoryTitle }}</h2>
      <a-spin :spinning="loading">
        <a-row :gutter="[24, 24]">
          <a-col :span="8" v-for="resource in resources" :key="resource.id">
            <a-card hoverable @click="goToDetail(resource.id)">
              <a-card-meta :title="resource.title">
                <template #description>
                  <div>{{ resource.description }}</div>
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
  () => props.category || (route.params.category as string)
);
const categoryTitle = computed(() => {
  if (category.value === "theory") return "理论前沿";
  if (category.value === "teaching") return "教学研究";
  if (category.value === "video") return "影像思政";
  return "资源分类";
});

const fetchResources = async () => {
  loading.value = true;
  try {
    const res: any = await resourceApi.getList({ category: category.value });
    if (res.success) resources.value = res.data;
  } finally {
    loading.value = false;
  }
};

const goToDetail = (id: string) => {
  router.push(`/resources/detail/${id}`);
};

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
</style>
