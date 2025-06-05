<template>
  <div :class="['page-container', className]">
    <slot name="header">
      <div class="page-header">
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
    </slot>
    <div class="page-content">
      <slot name="content">
        <slot></slot>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PageLayout',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    className: {
      type: String,
      default: '',
    },
  },
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
}

.page-header p {
  font-size: 16px;
  color: #666;
}

.page-content {
  margin-top: 20px;
}
</style>
