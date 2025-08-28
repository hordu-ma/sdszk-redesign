<template>
  <div v-if="error" class="error-boundary">
    <a-result status="error" :title="error.title" :sub-title="error.message">
      <template #extra>
        <a-button type="primary" @click="handleRetry"> 重试 </a-button>
        <a-button @click="handleBack"> 返回首页 </a-button>
      </template>
    </a-result>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const error = ref<{ title: string; message: string } | null>(null);

// 捕获错误
onErrorCaptured((err: any) => {
  console.error("Error caught by boundary:", err);

  // 设置错误信息
  error.value = {
    title: "页面加载失败",
    message: err.message || "发生未知错误，请稍后重试",
  };

  return false; // 阻止错误继续传播
});

// 重试
const handleRetry = () => {
  error.value = null;
  window.location.reload();
};

// 返回首页
const handleBack = () => {
  router.push("/");
};
</script>

<style scoped>
.error-boundary {
  padding: 24px;
  text-align: center;
}
</style>
