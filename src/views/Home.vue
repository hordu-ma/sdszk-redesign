<template>
  <div class="home-container">
    <banner-section />

    <news-section />

    <info-section :theories="theories" :researches="researches" />

    <!-- 影像思政组件 -->
    <div class="video-section">
      <h3>
        <i class="fas fa-video header-icon"></i>
        <span class="title-text">影像思政</span>
        <router-link to="/resources/category/video" class="more-link">
          更多<i class="fas fa-angle-right"></i>
        </router-link>
      </h3>
      <div class="video-grid">
        <div v-for="video in videos" :key="video.id" class="video-card">
          <video-player :src="video.url" :poster="video.poster || ''" />
          <p class="video-title">{{ video.title }}</p>
        </div>
      </div>
    </div>

    <!-- 十佳百优思政教师组件 -->
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

    <!-- 一体化共同体组件 -->
    <div class="community-section">
      <h3>
        <i class="fas fa-university header-icon"></i>
        <span class="title-text">一体化共同体</span>
        <router-link to="/community" class="more-link">
          更多<i class="fas fa-angle-right"></i>
        </router-link>
      </h3>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { resourceApi } from '@/api'
import VideoPlayer from '../components/VideoPlayer.vue'
import NewsSection from '../components/home/NewsSection.vue'
import InfoSection from '../components/home/InfoSection.vue'
import BannerSection from '../components/home/BannerSection.vue'
import video1 from '../assets/videos/video1.mp4'
import video2 from '../assets/videos/video2.mp4'
import video3 from '../assets/videos/video3.mp4'
import video4 from '../assets/videos/video4.mp4'
import video5 from '../assets/videos/video5.mp4'
import video6 from '../assets/videos/video6.mp4'
import poster1 from '../assets/images/posters/poster1.jpg'
import poster2 from '../assets/images/posters/poster2.jpg'
import poster3 from '../assets/images/posters/poster3.jpg'
import SectionHeader from '../components/common/SectionHeader.vue'

const theories = ref([])
const researches = ref([])
const videos = ref([])

const fetchResourceBlock = async () => {
  // 理论前沿
  const theoryRes = await resourceApi.getList({ category: 'theory', limit: 5, status: 'published' })
  if (theoryRes.success) theories.value = theoryRes.data
  // 教学研究
  const researchRes = await resourceApi.getList({
    category: 'teaching',
    limit: 5,
    status: 'published',
  })
  if (researchRes.success) researches.value = researchRes.data
  // 影像思政
  const videoRes = await resourceApi.getList({ category: 'video', limit: 6, status: 'published' })
  if (videoRes.success) videos.value = videoRes.data
}

onMounted(() => {
  fetchResourceBlock()
})

import poster4 from '../assets/images/posters/poster4.jpg'
import poster5 from '../assets/images/posters/poster5.jpg'
import poster6 from '../assets/images/posters/poster6.jpg'
import teacher1 from '../assets/images/teachers/teacher1.jpg'
import teacher2 from '../assets/images/teachers/teacher2.jpg'
import teacher3 from '../assets/images/teachers/teacher3.jpg'
import teacher4 from '../assets/images/teachers/teacher4.jpg'
import teacher5 from '../assets/images/teachers/teacher5.jpg'
import teacher6 from '../assets/images/teachers/teacher6.jpg'
import school1Logo from '../assets/images/schools/school1.png'
import school2Logo from '../assets/images/schools/school2.png'
import school3Logo from '../assets/images/schools/school3.png'
import school4Logo from '../assets/images/schools/school4.png'
import school5Logo from '../assets/images/schools/school5.png'
import school6Logo from '../assets/images/schools/school6.png'

const router = useRouter()

// 模拟数据

const teachers = ref([
  {
    id: 1,
    name: '王岳喜',
    title: '教授',
    avatar: teacher1,
    description: '山东商业职业技术学院',
  },
  {
    id: 2,
    name: '高继文',
    title: '二级教授',
    avatar: teacher2,
    description: '山东师范大学',
  },
  {
    id: 3,
    name: '渠月',
    title: '正高级教师',
    avatar: teacher3,
    description: '山东省教科院',
  },
  {
    id: 4,
    name: '张淑琴',
    title: '校长',
    avatar: teacher4,
    description: '临沂北城小学',
  },
  {
    id: 5,
    name: '朱海英',
    title: '特级教师',
    avatar: teacher5,
    description: '邹平市第一实验小学',
  },
  {
    id: 6,
    name: '宋侃侃',
    title: '教师',
    avatar: teacher6,
    description: '枣庄市第十五中学',
  },
])

const schools = ref([
  {
    id: 1,
    name: '山东大学',
    logo: school1Logo,
    website: 'http://www.sdu.edu.cn',
  },
  {
    id: 2,
    name: '中国海洋大学',
    logo: school2Logo,
    website: 'http://www.ouc.edu.cn',
  },
  {
    id: 3,
    name: '山东师范大学',
    logo: school3Logo,
    website: 'http://www.sdnu.edu.cn',
  },
  {
    id: 4,
    name: '济南大学',
    logo: school4Logo,
    website: 'http://www.ujn.edu.cn',
  },
  {
    id: 5,
    name: '青岛大学',
    logo: school5Logo,
    website: 'http://www.qdu.edu.cn',
  },
  {
    id: 6,
    name: '山东理工大学',
    logo: school6Logo,
    website: 'http://www.sdut.edu.cn',
  },
])

const relatedLinks = ref([
  { id: 1, name: '教育部', url: 'http://www.moe.gov.cn' },
  { id: 2, name: '山东省教育厅', url: 'http://edu.shandong.gov.cn' },
  {
    id: 3,
    name: '北京高校思想政治理论课高精尖创新中心',
    url: 'http://www.bjcipt.org/',
  },
  {
    id: 4,
    name: '山东师范大学马克思主义学院',
    url: 'http://www.marx.sdnu.edu.cn/index.htm',
  },
])

const handleLogin = () => {
  router.push('/login')
}
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
  content: '';
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
  grid-template-columns: 3fr 2fr;
  gap: 24px;
  padding: 12px;
  margin: 0 auto;
  max-width: 1600px;
  background-color: transparent;
}

@media (max-width: 768px) {
  .news-section {
    grid-template-columns: 1fr;
    padding: 8px;
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
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
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
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
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
  max-width: 1600px;
  padding: 0 12px;
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
  content: '';
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
  width: 100%;
  max-width: 1440px;
  margin: 0 auto 40px auto;
  padding: 20px;
  box-sizing: border-box;
}

.video-grid,
.teachers-grid,
.school-logos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px 20px;
  margin: 30px auto;
  max-width: 1600px;
  padding: 0 12px;
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
  height: auto; /* 确保高度自适应内容 */
  min-height: 300px; /* 设置最小高度 */
}

.teacher-card::after {
  content: '';
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

.teacher-card .teacher-institution {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
  font-style: italic;
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
  content: '';
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
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
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
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
  position: relative;
  padding-left: 12px;
}

.links h4::before {
  content: '';
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
    padding: 0 8px;
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
  font-family:
    'STZhongsong', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', sans-serif;
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
  font-family: 'STZhongsong', 'Microsoft YaHei', sans-serif;
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

/* 特定栏目标题栏样式 */
.video-section .block-header h3,
.teachers-section .block-header h3,
.community-section .block-header h3 {
  width: 100%;
  max-width: 1600px;
  padding: 12px 40px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  background: #9a2314;
  position: relative;
}

/* 图标和文字容器 */
.video-section .block-header h3 .title-container,
.teachers-section .block-header h3 .title-container,
.community-section .block-header h3 .title-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  white-space: nowrap;
}

/* 图标样式 */
.video-section .block-header h3 .header-icon,
.teachers-section .block-header h3 .header-icon,
.community-section .block-header h3 .header-icon {
  margin-right: 18px;
  flex-shrink: 0;
}

/* 标题文本样式 */
.video-section .block-header h3 .title-text,
.teachers-section .block-header h3 .title-text,
.community-section .block-header h3 .title-text {
  white-space: nowrap;
}

/* 更多链接样式 */
.video-section .block-header h3 .more-link,
.teachers-section .block-header h3 .more-link,
.community-section .block-header h3 .more-link {
  margin-left: auto;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.video-section .block-header h3 .more-link:hover,
.teachers-section .block-header h3 .more-link:hover,
.community-section .block-header h3 .more-link:hover {
  opacity: 1;
}

.video-section .block-header h3 .more-link i,
.teachers-section .block-header h3 .more-link i,
.community-section .block-header h3 .more-link i {
  margin-left: 4px;
}

/* 确保父容器支持正确的布局 */
.video-section .block-header,
.teachers-section .block-header,
.community-section .block-header {
  display: flex;
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
  transition:
    transform 0.3s ease,
    color 0.3s ease;
}
</style>
