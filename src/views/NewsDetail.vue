<!-- NewsDetail.vue - 用于显示单个新闻文章详情 -->
<template>
  <div class="news-detail-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-nav">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <router-link to="/">首页</router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>
          <router-link to="/news">资讯中心</router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>{{
          newsData.title || "文章详情"
        }}</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 文章标题 -->
    <div class="article-header">
      <h1 class="article-title">{{ newsData.title }}</h1>
      <div class="article-meta">
        <span class="meta-item">
          <i class="fas fa-calendar-alt"></i> {{ newsData.date }}
        </span>
        <span class="meta-item" v-if="newsData.author">
          <i class="fas fa-user"></i> {{ newsData.author }}
        </span>
        <span class="meta-item" v-if="newsData.source">
          <i class="fas fa-bookmark"></i> {{ newsData.source }}
        </span>
      </div>
    </div>

    <!-- 文章内容 -->
    <div class="article-content">
      <!-- 文章摘要 -->
      <div class="article-summary" v-if="newsData.summary">
        <p>{{ newsData.summary }}</p>
      </div>

      <!-- 主要内容 -->
      <div class="article-body" v-html="newsData.content"></div>
    </div>

    <!-- 相关文章 -->
    <div class="related-articles" v-if="relatedNews.length > 0">
      <div class="block-header">
        <h3>
          <i class="fas fa-newspaper header-icon"></i>
          <span class="title-text">相关文章</span>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="item in relatedNews" :key="item.id">
          <router-link :to="`/news/detail/${item.id}`" class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ item.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-date">发布日期：{{ item.date }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { message, Breadcrumb } from "ant-design-vue";

const route = useRoute();
const newsId = computed(() => route.params.id);

// 文章数据
const newsData = ref({
  id: null,
  title: "",
  date: "",
  author: "",
  source: "",
  summary: "",
  content: "",
  category: "",
});

// 相关文章
const relatedNews = ref([]);

// 假数据（实际项目中应通过API获取数据）
const newsDatabase = {
  1: {
    id: "1",
    title: '校际协同，星辰引航："星空下的思政课"开讲',
    date: "2025-04-29",
    author: "张明",
    source: "青岛理工大学",
    summary:
      '青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办"星空下的思政课"大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。把思政课堂与文化实践教学有机结合，推动大中小学一体化课程思政是青岛理工大学近年来着力开展的重点工作，物理作为贯穿大中小学的科学教育，是实现大中小学一体化课程思政的重要课程载体。',
    content: `<p>4月29日晚，青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办"星空下的思政课"大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。</p>

              <p>把思政课堂与文化实践教学有机结合，推动大中小学一体化课程思政是青岛理工大学近年来着力开展的重点工作，物理作为贯穿大中小学的科学教育，是实现大中小学一体化课程思政的重要课程载体。</p>

              <div class="image-container">
                <img src="../assets/images/carousel1.jpg" alt="思政课实践现场" />
                <div class="image-caption">思政课现场互动</div>
              </div>

              <p>此次"星空下的思政课"的举办地点选在了紧邻大海的青岛理工大学金家岭校区群星广场，学生们在聆听物理老师讲解星空下的物理知识时，不仅了解了望远镜结构、原理，学习了天体知识，也聆听了思政老师穿插其中的科技报国、宇航强国的主题宣传教育，在润物无声中传递爱国主义与科技报国精神。</p>

              <p>据悉，"星空下的思政课"为青岛理工大学首次面向大中小学生户外教学的实践教育活动，联合了多个院系和学科的力量。本次活动旨在通过天文知识和天体观测活动，将科学精神与家国情怀有机融合，充分发挥"大思政课"协同育人作用。</p>

              <div class="image-container">
                <img src="../assets/images/carousel2.jpg" alt="学生观测星空" />
                <div class="image-caption">大中小学生共同观测星空</div>
              </div>

              <p>青岛理工大学马克思主义学院院长王教授表示："探索宇宙奥秘与探索真理规律相通，我们希望通过这样的活动，让学生们不仅学习知识，更能感受到科学探索的魅力和责任担当。这种体验式教育比课堂讲授更为直观生动，对学生的影响也更持久深远。"</p>

              <p>参加活动的小学生小明说："这是我第一次通过专业望远镜观察星空，太神奇了！以前只在书本上看过这些星球，今天能亲眼看到，还听老师讲了这么多关于宇宙和国家航天事业的故事，我长大也要为中国航天事业贡献力量。"</p>

              <p>此次活动的成功举办，标志着青岛理工大学在探索大中小学思政课一体化建设方面迈出了新的一步，为今后同类活动的开展积累了宝贵经验。学校表示，将继续深化产教融合、校地合作，推动形成更多富有特色的思政教育实践模式。</p>`,
    category: "中心动态",
  },
  2: {
    id: "2",
    title: "菏泽家政职业学院组织开展大中小学乡村振兴劳动教育实践活动",
    date: "2025-04-26",
    author: "李华",
    source: "菏泽家政职业学院",
    summary:
      '菏泽家政职业学院依托菏泽市大中小学思政课一体化建设共同体平台，组织大中小学学生走进全国文明村、全国乡村治理示范村——单县龙王庙镇刘土城村，开展了以"劳动铸魂 青春筑梦"为主题的乡村振兴劳动教育实践活动。',
    content: "<p>具体内容将根据实际情况填充...</p>",
    category: "中心动态",
  },
  3: {
    id: "3",
    title: "济宁市新时代学校思政课建设推进会召开",
    date: "2025-04-20",
    author: "王强",
    source: "济宁市教育局",
    summary:
      "济宁市新时代学校思政课建设推进会召开，市委常委、宣传部部长董冰出席并讲话，副市长宫晓芳主持会议。",
    content: "<p>具体内容将根据实际情况填充...</p>",
    category: "中心动态",
  },
};

// 获取新闻数据
const fetchNewsData = (id) => {
  try {
    // 这里应该是API调用，现在模拟数据
    const data = newsDatabase[id];
    if (data) {
      newsData.value = data;
      // 获取相关文章（同一分类的其他文章）
      fetchRelatedNews(data.category, data.id);
    } else {
      message.error("找不到对应的文章");
    }
  } catch (error) {
    console.error("获取文章详情失败", error);
    message.error("获取文章详情失败");
  }
};

// 获取相关文章
const fetchRelatedNews = (category, currentId) => {
  try {
    // 这里应该是API调用，现在模拟数据
    const related = Object.values(newsDatabase).filter(
      (item) => item.category === category && item.id !== currentId
    );
    relatedNews.value = related;
  } catch (error) {
    console.error("获取相关文章失败", error);
  }
};

onMounted(() => {
  if (newsId.value) {
    fetchNewsData(newsId.value);
  }
});
</script>

<style scoped>
.news-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb-nav {
  margin-bottom: 20px;
}

.article-header {
  margin-bottom: 30px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 15px;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.article-meta {
  color: #666;
  font-size: 14px;
}

.meta-item {
  margin-right: 15px;
}

.meta-item i {
  margin-right: 5px;
}

.article-content {
  line-height: 1.8;
}

.article-summary {
  background-color: #f8f9fa;
  padding: 15px;
  border-left: 4px solid #1890ff;
  margin-bottom: 25px;
  font-size: 16px;
}

.article-body {
  font-size: 16px;
}

.article-body p {
  margin-bottom: 20px;
}

.image-container {
  margin: 30px 0;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  border-radius: 4px;
}

.image-caption {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.block-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.header-icon {
  margin-right: 8px;
  color: #1890ff;
}

.related-articles {
  margin-top: 40px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
}

.styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.styled-list li {
  padding: 12px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.styled-list li:last-child {
  border-bottom: none;
}

.info-link {
  display: block;
  text-decoration: none;
  color: #333;
}

.info-title {
  font-weight: 500;
  transition: color 0.3s;
}

.info-link:hover .info-title {
  color: #1890ff;
}

.info-footer {
  color: #999;
  font-size: 13px;
  margin-top: 5px;
}
</style>
