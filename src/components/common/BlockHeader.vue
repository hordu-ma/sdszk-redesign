<template>
  <div class="block-header">
    <h3>
      <div class="title-container">
        <i :class="['fas', iconClass, 'header-icon']" />
        <span class="title-text">{{ title }}</span>
      </div>
      <router-link v-if="moreLink" :to="moreLink" class="more-link">
        更多<i class="fas fa-angle-right" />
      </router-link>
    </h3>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  iconClass: string;
  moreLink?: string;
}>();
</script>

<style scoped>
.block-header {
  width: 100%;
  margin: 0 0 20px 0;
  padding: 0;
}

.block-header h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  padding: 12px 20px;
  border-radius: 0;
  margin: 0;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  position: relative;
}

.title-container {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-icon {
  margin-right: 12px;
  font-size: 18px;
}

.title-text {
  font-weight: 500;
}

.more-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.more-link:hover {
  color: white;
  opacity: 1;
}

.more-link i {
  margin-left: 4px;
}
</style>
