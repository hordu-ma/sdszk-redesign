<template>
  <div class="block-header">
    <h3>
      <div class="title-container">
        <i :class="['fas', iconClass, 'header-icon']"></i>
        <span class="title-text">{{ title }}</span>
      </div>
      <router-link v-if="moreLink" :to="moreLink" class="more-link">
        更多<i class="fas fa-angle-right"></i>
      </router-link>
    </h3>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export interface BlockHeaderProps {
  title: string;
  iconClass: string;
  moreLink?: string;
}

export default defineComponent({
  name: "BlockHeader",
  props: {
    title: {
      type: String,
      required: true,
    },
    iconClass: {
      type: String,
      required: true,
    },
    moreLink: {
      type: String,
      required: false,
    },
  },
});
</script>

<style scoped>
.block-header {
  margin-bottom: 20px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  background: linear-gradient(
    to right,
    var(--primary-color, #9a2314),
    var(--primary-color-light, #c44836)
  );
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin: 0;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.block-header h3:hover {
  transform: scale(1.02);
  background: linear-gradient(
    to right,
    var(--primary-color-light, #c44836),
    var(--primary-color, #9a2314)
  );
}

.title-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  color: white;
  font-size: 1.2em;
  margin-right: 8px;
}

.title-text {
  font-size: 1em;
  font-weight: 500;
  color: white;
}

.more-link {
  margin-left: auto;
  font-size: 14px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.more-link:hover {
  opacity: 0.8;
  color: white;
}

.more-link i {
  margin-left: 4px;
}
</style>
