<template>
  <div class="teachers-section">
    <div class="block-header">
      <h3>
        <div class="title-container">
          <i class="fas fa-user-tie header-icon"></i>
          <span class="title-text">"十佳百优"思政教师</span>
        </div>
        <router-link to="/teachers" class="more-link">
          更多<i class="fas fa-angle-right"></i>
        </router-link>
      </h3>
    </div>
    <div class="teachers-grid">
      <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
        <img
          :src="teacher.avatar"
          :alt="teacher.name"
          class="teacher-avatar"
        />
        <h4>{{ teacher.name }}</h4>
        <p>{{ teacher.title }}</p>
        <p class="teacher-institution">{{ teacher.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  teachers: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.teachers-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.block-header {
  margin-bottom: 20px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  font-size: 18px;
  color: #333;
}

.title-container {
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 8px;
  color: #409EFF;
}

.more-link {
  font-size: 14px;
  color: #909399;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.more-link:hover {
  color: #409EFF;
}

.more-link i {
  margin-left: 4px;
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
  background: #f5f7fa;
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
  color: #303133;
}

.teacher-card p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.teacher-institution {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>