<template>
  <div class="back-to-top" :class="{ visible: isVisible }" @click="scrollToTop">
    <i class="fas fa-arrow-up" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

// 控制按钮可见性的响应式变量
const isVisible = ref(false);

// 滚动事件处理函数
const handleScroll = () => {
  // 当页面滚动超过300px时显示按钮
  isVisible.value = window.scrollY > 300;
};

// 回到顶部的函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth", // 平滑滚动
  });
};

// 组件挂载时添加滚动监听
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

// 组件卸载时移除滚动监听
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
.back-to-top {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(154, 35, 20, 0.85);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s ease;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background-color: #9a2314;
    transform: translateY(0) scale(1.1);
  }

  &.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
  }
}
</style>
