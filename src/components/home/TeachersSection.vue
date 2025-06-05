<template>
  <div class="teachers-section">
    <h3>
      <i class="fas fa-user-tie header-icon"></i>
      <span class="title-text">'十佳百优'思政教师</span>
      <router-link to="/teachers" class="more-link">
        更多<i class="fas fa-angle-right"></i>
      </router-link>
    </h3>
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
interface Teacher {
  id: number
  name: string
  title: string
  avatar: string
  description: string
}

defineProps<{
  teachers: Teacher[]
}>()
</script>

<style scoped>
.teachers-section {
  background: var(--background-color, #fff);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
}

.teachers-section h3 {
  font-family:
    'STZhongsong', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  padding: 12px 20px;
  background: linear-gradient(to right, #9a2314, #c44836);
  margin: -20px -20px 20px -20px;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.teachers-section .header-icon {
  margin-right: 10px;
  color: #fff;
}

.teachers-section .title-text {
  flex: 1;
}

.teachers-section .more-link {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.teachers-section .more-link:hover {
  color: #fff;
}

.teachers-section .more-link i {
  margin-left: 5px;
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
