<template>
  <div class="block-header">
    <h3>
      <div class="title-container">
        <i :class="icon" class="header-icon" />
        <span class="title-text">{{ title }}</span>
      </div>
      <router-link v-if="moreLink" :to="moreLink" class="more-link">
        更多<i class="fas fa-angle-right" />
      </router-link>
    </h3>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SectionHeader",
  props: {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    moreLink: {
      type: String,
      default: "",
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
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 1.2em;
  color: var(--primary-color);
}

.title-text {
  color: var(--text-color);
}

.more-link {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 5px;
}

.more-link:hover {
  color: var(--primary-color);
}
</style>
