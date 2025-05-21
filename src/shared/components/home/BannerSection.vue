<template>
  <div class="platform-banner">
    <router-link to="/ai">
      <img
        src="../../assets/images/banner.jpg"
        alt="平台宣传图"
        class="banner-img"
      />
    </router-link>
  </div>
</template>

<script setup>
// 无需额外的逻辑
</script>

<style scoped>
.platform-banner {
  width: 100%;
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.banner-img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.banner-img:hover {
  transform: scale(1.02);
}
</style>