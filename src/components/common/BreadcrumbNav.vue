<template>
  <div class="breadcrumb-nav">
    <a-breadcrumb>
      <a-breadcrumb-item v-for="(item, index) in items" :key="index">
        <template v-if="item.link">
          <router-link :to="item.link">
            {{ item.title }}
          </router-link>
        </template>
        <template v-else>
          {{ item.title }}
        </template>
      </a-breadcrumb-item>
    </a-breadcrumb>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface BreadcrumbItem {
  title: string;
  link?: string;
}

export default defineComponent({
  name: "BreadcrumbNav",
  props: {
    items: {
      type: Array as () => BreadcrumbItem[],
      required: true,
    },
  },
});
</script>

<style scoped>
.breadcrumb-nav {
  margin-bottom: 20px;
}

.breadcrumb-nav :deep(.ant-breadcrumb) {
  font-size: 14px;
}

.breadcrumb-nav :deep(.ant-breadcrumb-link) {
  color: #666;
}

.breadcrumb-nav :deep(.ant-breadcrumb-link a) {
  color: #1890ff;
  text-decoration: none;
}

.breadcrumb-nav :deep(.ant-breadcrumb-link a:hover) {
  color: #40a9ff;
}
</style>
