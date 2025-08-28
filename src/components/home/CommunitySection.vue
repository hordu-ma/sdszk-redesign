<template>
  <div class="community-section">
    <div class="block-header">
      <h3>
        <div class="title-container">
          <i class="fas fa-university header-icon" />
          <span class="title-text">一体化共同体</span>
        </div>
        <router-link to="/community" class="more-link">
          更多<i class="fas fa-angle-right" />
        </router-link>
      </h3>
    </div>
    <div class="school-logos">
      <a
        v-for="school in schools"
        :key="school.id"
        :href="school.website"
        target="_blank"
        class="school-logo"
      >
        <img :src="school.logo" :alt="school.name">
        <p class="school-name">{{ school.name }}</p>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  schools: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.community-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.block-header {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  max-width: 1440px;
  z-index: 2;
  margin: 0 auto 20px auto;
  padding: 0;
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
  color: #409eff;
}

.more-link {
  font-size: 14px;
  color: #909399;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.more-link:hover {
  color: #409eff;
}

.more-link i {
  margin-left: 4px;
}

.school-logos {
  margin-top: 60px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.school-logo {
  text-decoration: none;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.school-logo:hover {
  transform: translateY(-5px);
}

.school-logo img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 10px;
}

.school-name {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}
</style>
