<template>
  <div class="home-container">
    <!-- 头部组件 -->
    <header class="header">
      <div class="header-content">
        <div class="logo-container">
          <img src="../assets/images/logo.png" alt="中心logo" class="logo" />
          <h1 class="center-name">山东省大中小学思政课一体化指导中心</h1>
        </div>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/about" class="nav-item">平台简介</router-link>
          <el-dropdown trigger="hover" class="nav-dropdown">
            <router-link to="/news" class="nav-item">资讯中心</router-link>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/news/center" class="dropdown-link"
                    >中心动态</router-link
                  >
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/news/notice" class="dropdown-link"
                    >通知公告</router-link
                  >
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/news/policy" class="dropdown-link"
                    >政策文件</router-link
                  >
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link to="/activities" class="nav-item">活动中心</router-link>
          <el-dropdown trigger="hover" class="nav-dropdown">
            <router-link to="/resources" class="nav-item">资源中心</router-link>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/resources/theory" class="dropdown-link"
                    >理论研究</router-link
                  >
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/resources/teaching" class="dropdown-link"
                    >教学前沿</router-link
                  >
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/resources/video" class="dropdown-link"
                    >思政短视频</router-link
                  >
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
        <img
          src="../assets/images/banner.jpg"
          alt="平台宣传图"
          class="banner-img"
        />
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
          <p class="school-name">{{ school.name }}</p>
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
import carousel1 from "../assets/images/carousel1.jpg";
import carousel2 from "../assets/images/carousel2.jpg";
import carousel3 from "../assets/images/carousel3.jpg";
import school1Logo from "../assets/images/schools/school1.png";
import school2Logo from "../assets/images/schools/school2.png";
import school3Logo from "../assets/images/schools/school3.png";
import school4Logo from "../assets/images/schools/school4.png";
import school5Logo from "../assets/images/schools/school5.png";
import school6Logo from "../assets/images/schools/school6.png";

const router = useRouter();

// 模拟数据
const carouselItems = ref([
  { id: 1, image: carousel1, title: "新闻1" },
  { id: 2, image: carousel2, title: "新闻2" },
  { id: 3, image: carousel3, title: "新闻3" },
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
  {
    id: 1,
    title: "思政课程创新实践",
    url: "../assets/videos/video1.mp4",
    poster: "../assets/images/posters/poster1.jpg",
  },
  {
    id: 2,
    title: "红色教育示范课",
    url: "../assets/videos/video2.mp4",
    poster: "../assets/images/posters/poster2.jpg",
  },
  {
    id: 3,
    title: "思政理论实践探索",
    url: "../assets/videos/video3.mp4",
    poster: "../assets/images/posters/poster3.jpg",
  },
  {
    id: 4,
    title: "党史教育专题课",
    url: "../assets/videos/video4.mp4",
    poster: "../assets/images/posters/poster4.jpg",
  },
  {
    id: 5,
    title: "思政实践教学案例",
    url: "../assets/videos/video5.mp4",
    poster: "../assets/images/posters/poster5.jpg",
  },
  {
    id: 6,
    title: "教学方法创新讲座",
    url: "../assets/videos/video6.mp4",
    poster: "../assets/images/posters/poster6.jpg",
  },
]);

const teachers = ref([
  {
    id: 1,
    name: "张教授",
    title: "特聘教授",
    avatar: "../assets/images/teachers/teacher1.jpg",
    description: "思政理论教育专家",
  },
  {
    id: 2,
    name: "李教授",
    title: "教授",
    avatar: "../assets/images/teachers/teacher2.jpg",
    description: "马克思主义理论研究",
  },
  {
    id: 3,
    name: "王教授",
    title: "教授",
    avatar: "../assets/images/teachers/teacher3.jpg",
    description: "党史教育研究",
  },
  {
    id: 4,
    name: "刘教授",
    title: "副教授",
    avatar: "../assets/images/teachers/teacher4.jpg",
    description: "思想政治教育",
  },
  {
    id: 5,
    name: "陈教授",
    title: "副教授",
    avatar: "../assets/images/teachers/teacher5.jpg",
    description: "当代中国研究",
  },
  {
    id: 6,
    name: "孙教授",
    title: "副教授",
    avatar: "../assets/images/teachers/teacher6.jpg",
    description: "思政教育创新",
  },
]);

const schools = ref([
  {
    id: 1,
    name: "山东大学",
    logo: school1Logo,
    website: "http://www.sdu.edu.cn",
  },
  {
    id: 2,
    name: "中国海洋大学",
    logo: school2Logo,
    website: "http://www.ouc.edu.cn",
  },
  {
    id: 3,
    name: "山东师范大学",
    logo: school3Logo,
    website: "http://www.sdnu.edu.cn",
  },
  {
    id: 4,
    name: "济南大学",
    logo: school4Logo,
    website: "http://www.ujn.edu.cn",
  },
  {
    id: 5,
    name: "青岛大学",
    logo: school5Logo,
    website: "http://www.qdu.edu.cn",
  },
  {
    id: 6,
    name: "山东理工大学",
    logo: school6Logo,
    website: "http://www.sdut.edu.cn",
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
  width: 100vw;
  padding: 0;
  margin: 0;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  overflow-x: hidden;
}

.header {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #9a2314;
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
  align-items: center;
  height: 40px;
}

.nav-item {
  text-decoration: none;
  color: #fff;
  font-size: 16px;
  padding: 6px 0;
  position: relative;
  transition: all 0.3s ease;
  display: inline-block;
  line-height: 28px;
  transform: translateY(0);
  box-shadow: 0 0 0 rgba(255, 255, 255, 0);
}

/* 为非下拉菜单的导航项添加悬停效果 */
.nav-menu > .nav-item:hover {
  transform: translateY(-5px);
  font-size: 18px;
  box-shadow: 0 6px 12px rgba(255, 255, 255, 0.3);
  transform-origin: center;
  scale: 1.05;
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

.nav-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

.nav-dropdown :deep(.el-dropdown),
.nav-dropdown :deep(.el-dropdown:focus),
.nav-dropdown :deep(.el-dropdown:focus-visible),
.nav-dropdown :deep(.el-dropdown:hover),
.nav-dropdown :deep(.el-dropdown:active) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.nav-dropdown :deep(.el-popper) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.nav-dropdown :deep(.el-dropdown-menu) {
  background-color: #fff;
  border: none;
  padding: 0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.nav-dropdown :deep(.el-dropdown-menu__item) {
  padding: 0;
  line-height: normal;
}

.nav-dropdown :deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(154, 35, 20, 0.05);
}

.nav-dropdown :deep(.el-dropdown-menu__item:not(:last-child)) {
  border-bottom: 1px solid rgba(154, 35, 20, 0.1);
}

.dropdown-link {
  display: block;
  padding: 12px 20px;
  color: #9a2314;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.dropdown-link:hover {
  color: #9a2314;
  opacity: 0.8;
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
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin: 0 auto;
  max-width: 100%;
  padding: 0;
}

.carousel-container {
  width: 100%;
  height: 300px;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.center-news {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.news-list {
  list-style: none;
  padding: 0;
  margin-top: 15px;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-block:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.video-section,
.teachers-section,
.community-section {
  margin: 40px 0;
}

.video-grid,
.teachers-grid,
.school-logos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px 20px;
  margin: 30px auto;
  max-width: 1200px;
  padding: 0 20px;
}

.video-card,
.teacher-card,
.school-logo {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.video-card:hover,
.teacher-card:hover,
.school-logo:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 视频卡片样式 */
.video-card {
  position: relative;
}

.video-title {
  padding: 10px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  background: rgba(154, 35, 20, 0.02);
}

/* 教师卡片样式 */
.teacher-card {
  text-align: center;
  padding: 20px;
}

.teacher-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 15px;
  object-fit: cover;
  border: 3px solid rgba(154, 35, 20, 0.1);
}

.teacher-card h4 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.teacher-card p {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}

/* 学校logo样式 */
.school-logo {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  height: 100px;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.school-logo::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(154, 35, 20, 0.02);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.school-logo:hover::after {
  transform: translateX(0);
}

.school-logo img {
  width: 120px;
  height: 60px;
  object-fit: contain;
  margin-right: 20px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.school-logo .school-name {
  font-size: 18px;
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
  margin: 0;
  line-height: 1.4;
  flex-grow: 1;
  text-align: left;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
}

.school-logo:hover img {
  transform: scale(1.05);
}

.school-logo:hover .school-name {
  color: #9a2314;
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

.section-title,
.info-block h3,
.video-section h3,
.teachers-section h3,
.community-section h3 {
  font-family: "STZhongsong", "Microsoft YaHei", "PingFang SC",
    "Hiragino Sans GB", "Heiti SC", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  padding: 10px 15px;
  background: rgba(154, 35, 20, 0.05);
  border-left: 4px solid #9a2314;
  margin-bottom: 20px;
  border-radius: 0 4px 4px 0;
  position: relative;
  transition: all 0.3s ease;
}

.section-title:hover,
.info-block h3:hover,
.video-section h3:hover,
.teachers-section h3:hover,
.community-section h3:hover {
  background: rgba(154, 35, 20, 0.08);
  transform: translateX(5px);
}
</style>
