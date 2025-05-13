<template>
  <div class="home-container">
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
        <el-carousel height="400px">
          <el-carousel-item v-for="item in carouselItems" :key="item.id">
            <img :src="item.image" :alt="item.title" class="carousel-img" />
          </el-carousel-item>
        </el-carousel>
      </div>
      <!-- 中心动态部分 -->
      <div class="center-news">
        <div class="block-header">
          <h3>
            <i class="fas fa-newspaper header-icon"></i>
            <span class="title-text">中心动态</span>
            <router-link to="/news/center" class="more-link">
              更多<i class="fas fa-angle-right"></i>
            </router-link>
          </h3>
        </div>
        <div class="news-container">
          <div v-for="news in centerNews" :key="news.id" class="news-item">
            <router-link :to="`/news/detail/${news.id}`" class="news-link">
              <div class="news-wrapper">
                <div class="date-block">
                  <span class="day">{{ news.date.split("-")[2] }}</span>
                  <span class="month-year"
                    >{{ news.date.split("-")[1] }}/{{
                      news.date.split("-")[0].slice(2)
                    }}</span
                  >
                </div>
                <div class="news-content">
                  <h3 class="news-title">{{ news.title }}</h3>
                  <p class="news-summary">{{ news.summary }}</p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 四个信息板块 -->
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
                  <span class="info-affiliation">{{
                    research.affiliation
                  }}</span>
                  <span class="info-date">发布日期：{{ research.date }}</span>
                </div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- 思政短视频组件 -->
    <div class="video-section">
      <div class="block-header">
        <h3>
          <i class="fas fa-video header-icon"></i>
          <span class="title-text">思政短视频</span>
        </h3>
      </div>
      <div class="video-grid">
        <div v-for="video in videos" :key="video.id" class="video-card">
          <video-player :src="video.url" :poster="video.poster" />
          <p class="video-title">{{ video.title }}</p>
        </div>
      </div>
    </div>

    <!-- 十佳百优思政教师组件 -->
    <div class="teachers-section">
      <div class="block-header">
        <h3>
          <i class="fas fa-user-tie header-icon"></i>
          <span class="title-text">"十佳百优"思政教师</span>
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
        </div>
      </div>
    </div>

    <!-- 一体化共同体组件 -->
    <div class="community-section">
      <div class="block-header">
        <h3>
          <i class="fas fa-university header-icon"></i>
          <span class="title-text">一体化共同体</span>
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
          <img :src="school.logo" :alt="school.name" />
          <p class="school-name">{{ school.name }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import VideoPlayer from "../components/VideoPlayer.vue";
import carousel1 from "../assets/images/carousel1.jpg";
import carousel2 from "../assets/images/carousel2.jpg";
import carousel3 from "../assets/images/carousel3.jpg";
import video1 from "../assets/videos/video1.mp4";
import video2 from "../assets/videos/video2.mp4";
import video3 from "../assets/videos/video3.mp4";
import video4 from "../assets/videos/video4.mp4";
import video5 from "../assets/videos/video5.mp4";
import video6 from "../assets/videos/video6.mp4";
import poster1 from "../assets/images/posters/poster1.jpg";
import poster2 from "../assets/images/posters/poster2.jpg";
import poster3 from "../assets/images/posters/poster3.jpg";
import poster4 from "../assets/images/posters/poster4.jpg";
import poster5 from "../assets/images/posters/poster5.jpg";
import poster6 from "../assets/images/posters/poster6.jpg";
import teacher1 from "../assets/images/teachers/teacher1.jpg";
import teacher2 from "../assets/images/teachers/teacher2.jpg";
import teacher3 from "../assets/images/teachers/teacher3.jpg";
import teacher4 from "../assets/images/teachers/teacher4.jpg";
import teacher5 from "../assets/images/teachers/teacher5.jpg";
import teacher6 from "../assets/images/teachers/teacher6.jpg";
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
  {
    id: 1,
    title: "校际协同，星辰引航：'星空下的思政课'开讲",
    date: "2025-04-29",
    url: "https://www.sdszk.cn/home/information/item/2/87",
    summary:
      "青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办'星空下的思政课'大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。把思政课堂与文化实践教学有机结合，推动大中小学一体化课程思政是青岛理工大学近年来着力开展的重点工作，物理作为贯穿大中小学的科学教育，是实现大中小学一体化课程思政的重要课程载体。",
  },
  {
    id: 2,
    title: "菏泽家政职业学院组织开展大中小学乡村振兴劳动教育实践活动",
    date: "2025-04-26",
    url: "https://www.sdszk.cn/home/information/item/2/85",
    summary:
      "菏泽家政职业学院依托菏泽市大中小学思政课一体化建设共同体平台，组织大中小学学生走进全国文明村、全国乡村治理示范村——单县龙王庙镇刘土城村，开展了以'劳动铸魂 青春筑梦'为主题的乡村振兴劳动教育实践活动。",
  },
  {
    id: 3,
    title: "济宁市新时代学校思政课建设推进会召开",
    date: "2025-04-20",
    url: "https://www.sdszk.cn/home/information/item/2/84",
    summary:
      "济宁市新时代学校思政课建设推进会召开，市委常委、宣传部部长董冰出席并讲话，副市长宫晓芳主持会议。",
  },
]);

const notices = ref([
  {
    id: 1,
    title: "关于组织开展2025年度山东省高校示范马克思主义学院建设项目评估的通知",
    date: "2025-05-10",
    url: "https://www.sdszk.cn/home/information/item/1/156",
    unit: "山东省教育厅",
  },
  {
    id: 2,
    title: "关于开展2025年度山东省高校思想政治工作精品项目申报工作的通知",
    date: "2025-05-08",
    url: "https://www.sdszk.cn/home/information/item/1/155",
    unit: "山东省教育厅",
  },
  {
    id: 3,
    title: "关于举办山东省高校思政课教师教学创新大赛的通知",
    date: "2025-05-05",
    url: "https://www.sdszk.cn/home/information/item/1/154",
    unit: "山东省教育厅",
  },
  {
    id: 4,
    title: "关于开展2025年度高校思政课教师示范培训的通知",
    date: "2025-05-03",
    url: "https://www.sdszk.cn/home/information/item/1/153",
    unit: "山东省教育厅",
  },
  {
    id: 5,
    title: "2025年山东省高校思政课建设研究课题申报指南",
    date: "2025-04-30",
    url: "https://www.sdszk.cn/home/information/item/1/152",
    unit: "山东省教育厅",
  },
  {
    id: 6,
    title: "关于开展2025年度思政课教学质量提升工程项目评选的通知",
    date: "2025-04-28",
    url: "https://www.sdszk.cn/home/information/item/1/151",
    unit: "山东省教育厅",
  },
]);

const policies = ref([
  {
    id: 1,
    title: "教育部关于加强新时代高校思想政治理论课建设的指导意见",
    date: "2025-05-09",
    url: "https://www.sdszk.cn/home/information/item/3/89",
    unit: "教育部",
  },
  {
    id: 2,
    title: "关于深化新时代学校思想政治理论课改革创新的若干意见",
    date: "2025-05-07",
    url: "https://www.sdszk.cn/home/information/item/3/88",
    unit: "教育部",
  },
  {
    id: 3,
    title: "山东省教育厅关于加强高校思政课教师队伍建设的实施方案",
    date: "2025-05-04",
    url: "https://www.sdszk.cn/home/information/item/3/87",
    unit: "山东省教育厅",
  },
  {
    id: 4,
    title: "关于实施高校思政课教学质量提升工程的通知",
    date: "2025-05-02",
    url: "https://www.sdszk.cn/home/information/item/3/86",
    unit: "教育部",
  },
  {
    id: 5,
    title: "山东省高校思政课改革创新实施细则",
    date: "2025-04-29",
    url: "https://www.sdszk.cn/home/information/item/3/85",
    unit: "山东省教育厅",
  },
  {
    id: 6,
    title: "关于加强新时代高校思想政治工作的实施意见",
    date: "2025-04-27",
    url: "https://www.sdszk.cn/home/information/item/3/84",
    unit: "教育部",
  },
]);

const theories = ref([
  {
    id: 1,
    title: "习近平新时代中国特色社会主义思想的理论逻辑与实践创新",
    date: "2025-05-10",
    url: "https://www.sdszk.cn/home/resources/item/1/156",
    author: "李明",
    affiliation: "山东大学马克思主义学院",
  },
  {
    id: 2,
    title: "论新时代大中小学思政课一体化建设的路径创新",
    date: "2025-05-08",
    url: "https://www.sdszk.cn/home/resources/item/1/155",
    author: "王华",
    affiliation: "山东师范大学马克思主义学院",
  },
  {
    id: 3,
    title: "中国共产党百年党史教育的经验与启示",
    date: "2025-05-05",
    url: "https://www.sdszk.cn/home/resources/item/1/154",
    author: "张丽",
    affiliation: "青岛大学马克思主义学院",
  },
  {
    id: 4,
    title: "新时代思政课教学改革创新研究",
    date: "2025-05-03",
    url: "https://www.sdszk.cn/home/resources/item/1/153",
    author: "刘强",
    affiliation: "济南大学马克思主义学院",
  },
  {
    id: 5,
    title: "大思政课视域下的课程思政建设研究",
    date: "2025-04-30",
    url: "https://www.sdszk.cn/home/resources/item/1/152",
    author: "陈红",
    affiliation: "山东理工大学马克思主义学院",
  },
  {
    id: 6,
    title: "新时代爱国主义教育的理论与实践探索",
    date: "2025-04-28",
    url: "https://www.sdszk.cn/home/resources/item/1/151",
    author: "孙伟",
    affiliation: "中国海洋大学马克思主义学院",
  },
]);

const researches = ref([
  {
    id: 1,
    title: "山东高校思政课一体化建设的创新实践与经验总结",
    date: "2025-05-09",
    url: "https://www.sdszk.cn/home/resources/item/2/89",
    author: "张华",
    affiliation: "山东师范大学",
  },
  {
    id: 2,
    title: "基于信息技术的思政课教学模式改革研究",
    date: "2025-05-07",
    url: "https://www.sdszk.cn/home/resources/item/2/88",
    author: "李明",
    affiliation: "山东大学",
  },
  {
    id: 3,
    title: "新时代大中小学思政课一体化建设的实践探索",
    date: "2025-05-04",
    url: "https://www.sdszk.cn/home/resources/item/2/87",
    author: "王华",
    affiliation: "青岛大学",
  },
  {
    id: 4,
    title: "思政课教学中的案例教学方法创新研究",
    date: "2025-05-02",
    url: "https://www.sdszk.cn/home/resources/item/2/86",
    author: "刘强",
    affiliation: "济南大学",
  },
  {
    id: 5,
    title: "新媒体环境下思政课教学改革与创新",
    date: "2025-04-29",
    url: "https://www.sdszk.cn/home/resources/item/2/85",
    author: "陈红",
    affiliation: "山东理工大学",
  },
  {
    id: 6,
    title: "大中小学思政课一体化教材体系建设研究",
    date: "2025-04-27",
    url: "https://www.sdszk.cn/home/resources/item/2/84",
    author: "孙伟",
    affiliation: "中国海洋大学",
  },
]);

const videos = ref([
  {
    id: 1,
    title: "思政课程创新实践",
    url: video1,
    poster: poster1,
  },
  {
    id: 2,
    title: "红色教育示范课",
    url: video2,
    poster: poster2,
  },
  {
    id: 3,
    title: "思政理论实践探索",
    url: video3,
    poster: poster3,
  },
  {
    id: 4,
    title: "党史教育专题课",
    url: video4,
    poster: poster4,
  },
  {
    id: 5,
    title: "思政实践教学案例",
    url: video5,
    poster: poster5,
  },
  {
    id: 6,
    title: "教学方法创新讲座",
    url: video6,
    poster: poster6,
  },
]);

const teachers = ref([
  {
    id: 1,
    name: "张教授",
    title: "特聘教授",
    avatar: teacher1,
    description: "思政理论教育专家",
  },
  {
    id: 2,
    name: "李教授",
    title: "教授",
    avatar: teacher2,
    description: "马克思主义理论研究",
  },
  {
    id: 3,
    name: "王教授",
    title: "教授",
    avatar: teacher3,
    description: "党史教育研究",
  },
  {
    id: 4,
    name: "刘教授",
    title: "副教授",
    avatar: teacher4,
    description: "思想政治教育",
  },
  {
    id: 5,
    name: "陈教授",
    title: "副教授",
    avatar: teacher5,
    description: "当代中国研究",
  },
  {
    id: 6,
    name: "孙教授",
    title: "副教授",
    avatar: teacher6,
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
  {
    id: 3,
    name: "北京高校思想政治理论课高精尖创新中心",
    url: "http://www.bjcipt.org/",
  },
  {
    id: 4,
    name: "山东师范大学马克思主义学院",
    url: "http://www.marx.sdnu.edu.cn/index.htm",
  },
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
  max-width: 1440px;
  margin: 0 auto;
  padding: 0;
  background-color: #f4f5f7;
  overflow: hidden;
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
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.banner-img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  display: block;
}

.news-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 24px;
  margin: 0 auto;
  max-width: 1200px;
  background-color: transparent;
}

@media (max-width: 768px) {
  .news-section {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .carousel-container {
    margin-bottom: 16px;
  }
}

.carousel-container {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.carousel-img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.center-news {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  height: 400px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.center-news .section-header {
  margin-bottom: 20px;
}

.center-news .section-header h2 {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin: 0;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  position: relative;
}

.news-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  padding: 0 10px;
}

.news-container::-webkit-scrollbar {
  width: 6px;
}

.news-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb {
  background: #9a2314;
  border-radius: 3px;
}

.news-container::-webkit-scrollbar-thumb:hover {
  background: #7a1c10;
}

.news-item {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.news-link {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 16px;
}

.news-content {
  position: relative;
}

.news-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
  text-align: left;
  display: block;
  word-break: break-word;
}

.news-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-date {
  font-size: 13px;
  color: #999;
  display: block;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin: 30px auto;
  max-width: 1200px;
  padding: 0 20px;
}

.info-block {
  padding: 25px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-block .block-header {
  margin-bottom: 20px;
  background: #9a2314;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  margin: 0;
}

.info-block .block-header h3 {
  display: flex;
  align-items: center;
  color: #fff;
  margin: 0;
  font-size: 18px;
}

.info-block .header-icon {
  margin-right: 15px; /* 增加图标与文字的间距 */
}

.info-block .title-text {
  flex: 1;
  padding-left: 2px; /* 为文本添加少量左内边距 */
}

.info-block .more-link {
  margin-left: auto;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.info-block .more-link:hover {
  opacity: 1;
}

.info-block .more-link i {
  margin-left: 4px;
}

.info-block .styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-block .styled-list li {
  position: relative;
  padding: 16px 0 16px 20px;
  border-bottom: 1px dashed #e5e5e5;
}

.info-block .styled-list li:last-child {
  border-bottom: none;
}

.info-block .styled-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 24px;
  width: 6px;
  height: 6px;
  background: #9a2314;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.info-block .styled-list li:hover::before {
  transform: scale(1.5);
  background: #c44836;
}

.info-block .info-link {
  color: #333;
  text-decoration: none;
  transition: all 0.3s ease;
  display: block;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.info-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: #333;
  transition: all 0.3s ease;
  text-align: left;
  display: block;
  word-break: break-word;
}

.info-block .info-link:hover .info-title {
  color: #9a2314;
  transform: translateX(5px);
}

.info-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  color: #999;
  font-size: 13px;
  margin-top: 6px;
}

.info-date {
  color: inherit;
}

.info-unit {
  color: inherit;
}

.info-author {
  color: #9a2314;
  font-weight: 500;
}

.info-affiliation {
  color: #666;
}

.info-block ul li a.info-link:hover {
  transform: translateX(5px);
}

.info-block ul li a.info-link:hover .info-title {
  color: #9a2314;
}

.info-block ul li a.info-link:hover .info-unit,
.info-block ul li a.info-link:hover .info-summary,
.info-block ul li a.info-link:hover .info-date,
.info-block ul li a.info-link:hover .info-affiliation {
  color: #666;
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
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.video-title {
  padding: 12px 15px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  color: #333;
  background: #fff;
  border-top: 1px solid rgba(154, 35, 20, 0.1);
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(154, 35, 20, 0.15);
}

/* 教师卡片样式 */
.teacher-card {
  text-align: center;
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  position: relative;
  overflow: hidden;
}

.teacher-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #9a2314;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.teacher-card:hover::after {
  transform: translateX(0);
}

.teacher-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  margin-bottom: 20px;
  object-fit: cover;
  border: 4px solid rgba(154, 35, 20, 0.1);
  transition: all 0.3s ease;
  background: #f5f5f5;
}

.teacher-card:hover .teacher-avatar {
  border-color: rgba(154, 35, 20, 0.3);
  transform: scale(1.05);
}

.teacher-card h4 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.teacher-card:hover h4 {
  color: #9a2314;
}

.teacher-card p {
  font-size: 15px;
  color: #666;
  margin: 5px 0;
  line-height: 1.4;
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

.footer-section {
  background: linear-gradient(to bottom, #f8f9fa, #e4e7ed);
  padding: 30px 0;
  margin-top: 30px;
  border-top: 1px solid rgba(154, 35, 20, 0.1);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.links {
  flex: 1;
}

.links h4 {
  color: #333;
  font-size: 20px;
  margin-bottom: 20px;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  position: relative;
  padding-left: 12px;
}

.links h4::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #9a2314;
  border-radius: 2px;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.footer-section .footer-link {
  color: #666;
  text-decoration: none;
  padding: 10px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  display: flex;
  align-items: center;
}

.footer-section .footer-link:hover {
  color: #9a2314;
  background: #fff;
  box-shadow: 0 4px 12px rgba(154, 35, 20, 0.1);
  transform: translateY(-2px);
}

.qrcode {
  text-align: center;
  margin-left: 60px;
}

.qrcode-img {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qrcode p {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .news-section {
    grid-template-columns: 1fr;
  }

  .info-section {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }

  .video-grid,
  .teachers-grid,
  .school-logos {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 0 1rem;
  }

  /* 移动端标题图标间距调整 */
  .info-block .header-icon {
    margin-right: 12px; /* 移动端稍微减少间距 */
  }

  .center-news .header-icon,
  .video-section .header-icon,
  .teachers-section .header-icon,
  .community-section .header-icon {
    margin-right: 14px; /* 移动端调整图标间距 */
  }

  .block-header h3 {
    font-size: 1.2rem;
    padding: 0.8rem 1rem;
  }

  .news-title {
    font-size: 1rem;
  }

  .news-summary {
    font-size: 0.9rem;
  }

  .video-title {
    font-size: 0.9rem;
  }

  .footer-content {
    flex-direction: column;
    align-items: center;
    padding: 0 20px;
  }

  .links {
    margin-right: 0;
    margin-bottom: 30px;
    width: 100%;
  }

  .link-grid {
    grid-template-columns: 1fr;
  }

  .qrcode {
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .center-news .header-icon,
  .video-section .header-icon,
  .teachers-section .header-icon,
  .community-section .header-icon {
    margin-right: 15px; /* 在小屏幕上稍微减少间距 */
  }

  .block-header h3 {
    font-size: 18px; /* 小屏幕上减小标题尺寸 */
  }

  .block-header {
    padding: 10px 15px; /* 减少内边距，使空间更紧凑 */
  }

  .more-link {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .home-container {
    padding: 0;
  }

  .news-section,
  .info-section,
  .video-grid,
  .teachers-grid,
  .school-logos {
    margin: 1rem auto;
  }

  /* 小屏幕设备上图标间距调整 */
  .info-block .header-icon {
    margin-right: 10px; /* 小屏幕上进一步缩小间距 */
    font-size: 14px; /* 减小图标尺寸 */
  }

  .center-news .header-icon,
  .video-section .header-icon,
  .teachers-section .header-icon,
  .community-section .header-icon {
    margin-right: 12px; /* 小屏幕上调整间距 */
    font-size: 14px; /* 减小图标尺寸 */
  }

  .info-block .title-text,
  .center-news .title-text,
  .video-section .title-text,
  .teachers-section .title-text,
  .community-section .title-text {
    font-size: 16px; /* 小屏幕上减小标题文字大小 */
  }

  .carousel-container {
    border-radius: 0;
  }

  .el-carousel {
    height: 200px !important;
  }

  .el-carousel__item {
    height: 200px !important;
  }

  .carousel-img {
    height: 200px;
    object-fit: cover;
  }

  .video-card {
    margin: 0 1rem;
  }

  .teacher-card,
  .school-logo {
    margin: 0 1rem;
  }

  .block-header {
    margin: 0 1rem;
  }

  .teachers-grid,
  .school-logos {
    grid-template-columns: 1fr;
  }

  .video-card {
    width: 100%;
  }

  .carousel-container {
    margin-bottom: 0.5rem;
  }

  .el-carousel {
    height: 200px !important;
  }

  .news-wrapper {
    padding: 0.5rem;
  }

  .date-block {
    padding: 0.5rem;
  }

  .news-content {
    padding: 0.5rem;
  }

  .block-header {
    padding: 0.5rem;
  }
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
  background: linear-gradient(to right, #8a1f11, #b33f2e);
  transform: none;
}

/* 统一标题栏样式 */
.center-news .block-header h3,
.video-section h3,
.teachers-section h3,
.community-section h3 {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin: 0;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  position: relative;
}

/* 专门为中心动态和其他主要区块的图标增加间距 */
.center-news .header-icon,
.video-section .header-icon,
.teachers-section .header-icon,
.community-section .header-icon {
  margin-right: 18px; /* 较大的间距，确保图标与文字分离清晰 */
  -webkit-box-flex: 0;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto; /* 防止图标被挤压 */
}

.center-news .title-text,
.video-section .title-text,
.teachers-section .title-text,
.community-section .title-text {
  padding-left: 3px; /* 文本轻微左缩进，增强阅读体验 */
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1; /* 确保文本占据剩余空间 */
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 文本溢出显示省略号 */
}

/* 浏览器兼容性样式 */
.block-header h3 {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}

/* 确保图标与文字垂直对齐 */
.header-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.block-header:hover .header-icon {
  transform: scale(1.1) rotate(5deg);
  color: #ffcc80;
}

.title-text {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.block-header:hover .title-text {
  color: #ffcc80;
}

/* 解决Firefox中的图标对齐问题 */
@-moz-document url-prefix() {
  .header-icon {
    position: relative;
    top: 1px;
  }
}

/* 特定栏目标题居中显示 */
.video-section .block-header h3,
.teachers-section .block-header h3,
.community-section .block-header h3 {
  width: 100%;
  max-width: 1200px;
  padding: 12px 40px;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

/* 图标和文本作为一个整体集中在标题栏中间 */
.video-section .block-header h3 .header-icon,
.teachers-section .block-header h3 .header-icon,
.community-section .block-header h3 .header-icon {
  margin-right: 18px;
  flex-shrink: 0;
}

/* 这三个栏目不需要使用flex:1自动拉伸，让它们保持原始宽度 */
.video-section .block-header h3 .title-text,
.teachers-section .block-header h3 .title-text,
.community-section .block-header h3 .title-text {
  flex: 0 0 auto;
  white-space: nowrap;
}

/* 确保父容器支持正确的布局 */
.video-section .block-header,
.teachers-section .block-header,
.community-section .block-header {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

/* 特定栏目标题图标和文字动画效果优化 */
.video-section .block-header:hover h3,
.teachers-section .block-header:hover h3,
.community-section .block-header:hover h3 {
  transform: scale(1.05);
}

.video-section .header-icon,
.teachers-section .header-icon,
.community-section .header-icon {
  transition: transform 0.3s ease, color 0.3s ease;
}
</style>
