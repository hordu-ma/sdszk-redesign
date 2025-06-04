<template>
  <div class="info-section">
    <div class="info-block notice">
      <div class="block-header">
        <h3>
          <i class="fas fa-bullhorn header-icon"></i>
          <span class="title-text">通知公告</span>
          <router-link to="/news/notice" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="notice in notices" :key="notice.id">
          <router-link :to="`/news/detail/${notice.id}`" class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ notice.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-date">发布日期：{{ notice.date }}</span>
                <span class="info-unit">{{ notice.unit }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="info-block policy">
      <div class="block-header">
        <h3>
          <i class="fas fa-file-alt header-icon"></i>
          <span class="title-text">政策文件</span>
          <router-link to="/news/policy" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="policy in policies" :key="policy.id">
          <router-link :to="`/news/detail/${policy.id}`" class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ policy.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-date">发布日期：{{ policy.date }}</span>
                <span class="info-unit">{{ policy.unit }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="info-block theory">
      <div class="block-header">
        <h3>
          <i class="fas fa-book header-icon"></i>
          <span class="title-text">理论前沿</span>
          <router-link to="/resources/theory" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="theory in theories" :key="theory.id">
          <router-link :to="`/news/detail/${theory.id}`" class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ theory.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-author">{{ theory.author }}</span>
                <span class="info-affiliation">{{ theory.affiliation }}</span>
                <span class="info-date">发布日期：{{ theory.date }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="info-block teaching">
      <div class="block-header">
        <h3>
          <i class="fas fa-chalkboard-teacher header-icon"></i>
          <span class="title-text">教学研究</span>
          <router-link to="/resources/teaching" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="research in researches" :key="research.id">
          <router-link :to="`/news/detail/${research.id}`" class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ research.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-author">{{ research.author }}</span>
                <span class="info-affiliation">{{ research.affiliation }}</span>
                <span class="info-date">发布日期：{{ research.date }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  notices: {
    type: Array,
    required: true,
  },
  policies: {
    type: Array,
    required: true,
  },
  theories: {
    type: Array,
    required: true,
  },
  researches: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.info-block {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.block-header {
  margin-bottom: 20px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin: 0;
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
  font-size: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.block-header h3:hover {
  transform: scale(1.02);
  background: linear-gradient(to right, #c44836, #9a2314);
}

.header-icon {
  margin-right: 8px;
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
}

.more-link i {
  margin-left: 4px;
}

.styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-link {
  text-decoration: none;
  color: inherit;
  display: block;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.info-link:hover {
  background-color: #f5f7fa;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-header {
  display: flex;
  align-items: center;
}

.info-title {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-footer {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.info-date,
.info-unit,
.info-author,
.info-affiliation {
  white-space: nowrap;
}
</style>
