<template>
  <div class="article-meta">
    <span v-if="date" class="meta-item">
      <i class="fas fa-calendar-alt" />
      {{ formattedDate }}
    </span>
    <span v-if="author" class="meta-item">
      <i class="fas fa-user" />
      {{ author }}
    </span>
    <span v-if="source" class="meta-item">
      <i class="fas fa-globe" />
      {{ source }}
    </span>
    <span v-if="viewCount" class="meta-item">
      <i class="fas fa-eye" />
      {{ viewCount }} 次阅读
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  date?: string;
  author?: string;
  source?: string;
  viewCount?: number;
}

const props = defineProps<Props>();

const formattedDate = computed(() => {
  if (!props.date) return "";
  return new Date(props.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
});
</script>

<style scoped>
.article-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item i {
  color: #999;
}
</style>
