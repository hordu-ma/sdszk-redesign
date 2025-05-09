<template>
  <div class="home-container">
    <!-- 头部组件 -->
    <header class="header">
      <div class="header-content">
        <div class="logo-container">
          <img src="../assets/logo.png" alt="中心logo" class="logo" />
          <h1 class="center-name">山东省大中小学思政课一体化指导中心</h1>
        </div>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/about" class="nav-item">平台简介</router-link>
          <router-link to="/news" class="nav-item">资讯中心</router-link>
          <router-link to="/activities" class="nav-item">活动中心</router-link>
          <router-link to="/resources" class="nav-item">资源中心</router-link>
          <router-link to="/ai" class="nav-item">AI思政</router-link>
        </nav>
        <div class="login-section">
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </div>
      </div>
    </header>

    <!-- 平台宣传图组件 -->
    <div class="platform-banner">
      <router-link to="/ai">
        <img src="../assets/banner.jpg" alt="平台宣传图" class="banner-img" />
      </router-link>
    </div>

    <!-- 新闻轮播和中心动态区域 -->
    <div class="news-section">
      <div class="carousel-container">
        <el-carousel height="300px">
          <el-carousel-item v-for="item in carouselItems" :key="item.id">
            <img :src="item.image" :alt="item.title" class="carousel-img" />
          </el-carousel-item>
        </el-carousel>
      </div>
      <div class="center-news">
        <h3 class="section-title">中心动态</h3>
        <ul class="news-list">
          <li v-for="news in centerNews" :key="news.id" class="news-item">
            <router-link :to="`/news/${news.id}`">{{ news.title }}</router-link>
            <span class="news-date">{{ news.date }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 四个信息板块 -->
    <div class="info-section">
      <div class="info-block notice">
        <h3>通知公告</h3>
        <ul>
          <li v-for="notice in notices" :key="notice.id">
            <router-link :to="`/news/notice/${notice.id}`">{{
              notice.title
            }}</router-link>
          </li>
        </ul>
      </div>
      <div class="info-block policy">
        <h3>政策文件</h3>
        <ul>
          <li v-for="policy in policies" :key="policy.id">
            <router-link :to="`/news/policy/${policy.id}`">{{
              policy.title
            }}</router-link>
          </li>
        </ul>
      </div>
      <div class="info-block theory">
        <h3>理论前沿</h3>
        <ul>
          <li v-for="theory in theories" :key="theory.id">
            <router-link :to="`/resources/theory/${theory.id}`">{{
              theory.title
            }}</router-link>
          </li>
        </ul>
      </div>
      <div class="info-block teaching">
        <h3>教学研究</h3>
        <ul>
          <li v-for="research in researches" :key="research.id">
            <router-link :to="`/resources/research/${research.id}`">{{
              research.title
            }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- 思政短视频组件 -->
    <div class="video-section">
      <h3>思政短视频</h3>
      <div class="video-grid">
        <div v-for="video in videos" :key="video.id" class="video-card">
          <video-player :src="video.url" :poster="video.poster" />
          <p class="video-title">{{ video.title }}</p>
        </div>
      </div>
    </div>

    <!-- 十佳百优思政教师组件 -->
    <div class="teachers-section">
      <h3>"十佳百优"思政教师</h3>
      <div class="teachers-grid">
        <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
          <img
            :src="teacher.avatar"
            :alt="teacher.name"
            class="teacher-avatar"
          />
          <h4>{{ teacher.name }}</h4>
          <p>{{ teacher.title }}</p>
        </div>
      </div>
    </div>

    <!-- 一体化共同体组件 -->
    <div class="community-section">
      <h3>一体化共同体</h3>
      <div class="school-logos">
        <a
          v-for="school in schools"
          :key="school.id"
          :href="school.website"
          target="_blank"
          class="school-logo"
        >
          <img :src="school.logo" :alt="school.name" />
        </a>
      </div>
    </div>

    <!-- 底部组件 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="links">
          <h4>相关链接</h4>
          <div class="link-grid">
            <a
              v-for="link in relatedLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
            >
              {{ link.name }}
            </a>
          </div>
        </div>
        <div class="qrcode">
          <img src="../assets/qrcode.jpg" alt="微信公众号" class="qrcode-img" />
          <p>扫码关注公众号</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 模拟数据
const carouselItems = ref([
  { id: 1, image: "/carousel1.jpg", title: "新闻1" },
  { id: 2, image: "/carousel2.jpg", title: "新闻2" },
  { id: 3, image: "/carousel3.jpg", title: "新闻3" },
]);

const centerNews = ref([
  { id: 1, title: "中心最新动态1", date: "2024-01-20" },
  { id: 2, title: "中心最新动态2", date: "2024-01-19" },
  { id: 3, title: "中心最新动态3", date: "2024-01-18" },
]);

const notices = ref([
  { id: 1, title: "重要通知1" },
  { id: 2, title: "重要通知2" },
  { id: 3, title: "重要通知3" },
  { id: 4, title: "重要通知4" },
  { id: 5, title: "重要通知5" },
  { id: 6, title: "重要通知6" },
]);

const policies = ref([
  { id: 1, title: "最新政策1" },
  { id: 2, title: "最新政策2" },
  { id: 3, title: "最新政策3" },
  { id: 4, title: "最新政策4" },
  { id: 5, title: "最新政策5" },
  { id: 6, title: "最新政策6" },
]);

const theories = ref([
  { id: 1, title: "理论研究1" },
  { id: 2, title: "理论研究2" },
  { id: 3, title: "理论研究3" },
  { id: 4, title: "理论研究4" },
  { id: 5, title: "理论研究5" },
  { id: 6, title: "理论研究6" },
]);

const researches = ref([
  { id: 1, title: "教学研究1" },
  { id: 2, title: "教学研究2" },
  { id: 3, title: "教学研究3" },
  { id: 4, title: "教学研究4" },
  { id: 5, title: "教学研究5" },
  { id: 6, title: "教学研究6" },
]);

const videos = ref([
  { id: 1, title: "思政视频1", url: "/video1.mp4", poster: "/poster1.jpg" },
  { id: 2, title: "思政视频2", url: "/video2.mp4", poster: "/poster2.jpg" },
  { id: 3, title: "思政视频3", url: "/video3.mp4", poster: "/poster3.jpg" },
]);

const teachers = ref([
  { id: 1, name: "教师1", title: "教授", avatar: "/teacher1.jpg" },
  { id: 2, name: "教师2", title: "副教授", avatar: "/teacher2.jpg" },
  { id: 3, name: "教师3", title: "讲师", avatar: "/teacher3.jpg" },
]);

const schools = ref([
  {
    id: 1,
    name: "学校1",
    logo: "/school1.jpg",
    website: "http://school1.edu.cn",
  },
  {
    id: 2,
    name: "学校2",
    logo: "/school2.jpg",
    website: "http://school2.edu.cn",
  },
  {
    id: 3,
    name: "学校3",
    logo: "/school3.jpg",
    website: "http://school3.edu.cn",
  },
]);

const relatedLinks = ref([
  { id: 1, name: "教育部", url: "http://www.moe.gov.cn" },
  { id: 2, name: "山东省教育厅", url: "http://edu.shandong.gov.cn" },
]);

const handleLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
/*全局样式重置*/
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.home-container {
  width: 100%;
  padding: 0;
  margin: 0;
  position: relative;
}

.header {
  display: flex;
  width: 100%;
  margin: 0;
  padding: 0;
  position: relative;
  left: 0;
  right: 0;
  background-color: #9a2314;
}

/* 内容区域限制宽度 */
.header > div {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  align-items: center;
  padding-right: 20px;
}

.logo {
  width: 50px;
  height: 50px;
  margin-right: 12px;
}

.center-name {
  font-size: 20px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  gap: 30px;
  margin-right: auto;
  margin-left: 60px;
}

.nav-item {
  text-decoration: none;
  color: #fff;
  font-size: 16px;
  padding: 6px 0;
  position: relative;
  transition: all 0.3s ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: rgba(255, 255, 255, 0.95);
}

.nav-item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #fff;
  transition: width 0.3s ease;
}

.nav-item:hover::after,
.nav-item.router-link-active::after {
  width: 100%;
}

.platform-banner {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0;
  padding: 0;
}

.news-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.center-news {
  padding: 20px;
  background: #f5f7fa;
}

.news-list {
  list-style: none;
  padding: 0;
}

.news-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 20px 0;
}

.info-block {
  padding: 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.video-section,
.teachers-section,
.community-section {
  margin: 40px 0;
}

.video-grid,
.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.school-logos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.footer {
  background: #f5f7fa;
  padding: 40px 0;
  margin-top: 40px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.qrcode {
  text-align: center;
}

.qrcode-img {
  width: 120px;
  height: 120px;
}

.login-section {
  margin-left: 20px;
}

.login-section :deep(.el-button) {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #fff;
  padding: 8px 24px;
  transition: all 0.3s ease;
}

.login-section :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
  color: #fff;
}
</style>
