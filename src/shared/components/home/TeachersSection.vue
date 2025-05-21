<template>
  <div class="teachers-section">
    <block-header
      title="'十佳百优'思政教师"
      icon-class="fa-user-tie"
      more-link="/teachers"
    />
    <div class="teachers-grid">
      <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
        <img :src="teacher.avatar" :alt="teacher.name" class="teacher-avatar" />
        <h4>{{ teacher.name }}</h4>
        <p>{{ teacher.title }}</p>
        <p class="teacher-institution">{{ teacher.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { default as BlockHeader } from "../common/BlockHeader.vue";

interface Teacher {
  id: number;
  name: string;
  title: string;
  avatar: string;
  description: string;
}

defineProps<{
  teachers: Teacher[];
}>();
</script>

<style scoped>
.teachers-section {
  background: var(--background-color, #fff);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.teacher-card {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background: var(--background-color-secondary, #f5f7fa);
  transition: transform 0.3s;
}

.teacher-card:hover {
  transform: translateY(-5px);
}

.teacher-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 10px;
  object-fit: cover;
}

.teacher-card h4 {
  margin: 0 0 5px;
  font-size: 16px;
  color: var(--text-color, #303133);
}

.teacher-card p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #606266);
}

.teacher-institution {
  font-size: 12px;
  color: var(--text-tertiary, #909399);
  margin-top: 5px;
}
</style>
