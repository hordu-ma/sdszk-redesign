<template>
  <div class="news-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>资讯中心</h1>
      <p>大中小学思政课一体化教育相关新闻、通知、政策及研究资料</p>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <a-tabs v-model:activeKey="activeCategory" @change="handleCategoryChange">
        <a-tab-pane key="all" tab="全部资讯"></a-tab-pane>
        <a-tab-pane key="center" tab="中心动态"></a-tab-pane>
        <a-tab-pane key="notice" tab="通知公告"></a-tab-pane>
        <a-tab-pane key="policy" tab="政策文件"></a-tab-pane>
        <a-tab-pane key="theory" tab="理论前沿"></a-tab-pane>
        <a-tab-pane key="teaching" tab="教学研究"></a-tab-pane>
      </a-tabs>
    </div>

    <!-- 新闻列表 -->
    <div class="news-content">
      <a-spin :spinning="loading">
        <div class="news-list">
          <div v-for="news in filteredNews" :key="news.id" class="news-item">
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
                <div class="news-content-inner">
                  <h3 class="news-title">{{ news.title }}</h3>
                  <div class="news-meta">
                    <span
                      class="category-tag"
                      :class="'category-' + news.categoryKey"
                      >{{ news.category }}</span
                    >
                    <span v-if="news.author" class="news-author">{{
                      news.author
                    }}</span>
                    <span v-if="news.source" class="news-source">{{
                      news.source
                    }}</span>
                  </div>
                  <p class="news-summary">{{ news.summary }}</p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" v-if="totalNews > 0">
          <a-pagination
            v-model:current="currentPage"
            :total="totalNews"
            :pageSize="pageSize"
            @change="handlePageChange"
            show-less-items
          />
        </div>

        <!-- 无数据提示 -->
        <a-empty v-if="filteredNews.length === 0" description="暂无相关资讯" />
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const activeCategory = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalNews = ref(0);

// 初始化时从路由参数获取分类
onMounted(() => {
  if (route.query.category) {
    activeCategory.value = route.query.category;
  }
  fetchNews();
});

// 监听分类变化，更新路由参数
watch(activeCategory, (newCategory) => {
  router.push({
    path: "/news",
    query: { ...(newCategory !== "all" ? { category: newCategory } : {}) },
  });
  currentPage.value = 1;
  fetchNews();
});

// 模拟新闻数据（实际项目中应从API获取）
const allNews = ref([
  // 中心动态
  {
    id: 1,
    title: "校际协同，星辰引航：'星空下的思政课'开讲",
    date: "2025-04-29",
    author: "张明",
    source: "青岛理工大学",
    categoryKey: "center",
    category: "中心动态",
    summary:
      "青岛理工大学马克思主义学院、理学院联合青岛第五十三中学教育集团，举办'星空下的思政课'大中小学一体化课程思政实践，共同探索大中小学一体化课程思政新方式。把思政课堂与文化实践教学有机结合，推动大中小学一体化课程思政是青岛理工大学近年来着力开展的重点工作，物理作为贯穿大中小学的科学教育，是实现大中小学一体化课程思政的重要课程载体。",
  },
  {
    id: 2,
    title: "菏泽家政职业学院组织开展大中小学乡村振兴劳动教育实践活动",
    date: "2025-04-26",
    author: "李华",
    source: "菏泽家政职业学院",
    categoryKey: "center",
    category: "中心动态",
    summary:
      "菏泽家政职业学院依托菏泽市大中小学思政课一体化建设共同体平台，组织大中小学学生走进全国文明村、全国乡村治理示范村——单县龙王庙镇刘土城村，开展了以'劳动铸魂 青春筑梦'为主题的乡村振兴劳动教育实践活动。",
  },
  {
    id: 3,
    title: "济宁市新时代学校思政课建设推进会召开",
    date: "2025-04-20",
    author: "王强",
    source: "济宁市教育局",
    categoryKey: "center",
    category: "中心动态",
    summary:
      "济宁市新时代学校思政课建设推进会召开，市委常委、宣传部部长董冰出席并讲话，副市长宫晓芳主持会议。",
  },
  // 通知公告
  {
    id: 4,
    title: "关于组织开展2025年度山东省高校示范马克思主义学院建设项目评估的通知",
    date: "2025-05-10",
    author: "",
    source: "山东省教育厅",
    categoryKey: "notice",
    category: "通知公告",
    summary:
      "为深入贯彻落实习近平新时代中国特色社会主义思想和党的二十大精神，进一步加强高校马克思主义理论学科和马克思主义学院建设，根据《山东省高校示范马克思主义学院建设管理办法》，现就组织开展2025年度山东省高校示范马克思主义学院建设项目评估工作通知如下。",
  },
  {
    id: 5,
    title: "关于开展2025年度山东省高校思想政治工作精品项目申报工作的通知",
    date: "2025-05-08",
    author: "",
    source: "山东省教育厅",
    categoryKey: "notice",
    category: "通知公告",
    summary:
      "为贯彻落实《关于加强新时代高校思想政治工作的实施意见》，充分发挥精品项目示范引领作用，现就做好2025年度山东省高校思想政治工作精品项目申报工作有关事项通知如下。",
  },
  // 其他分类文章...
]);

// 根据活跃分类筛选新闻
const filteredNews = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;

  let result = allNews.value;
  if (activeCategory.value !== "all") {
    result = result.filter((item) => item.categoryKey === activeCategory.value);
  }

  totalNews.value = result.length;
  return result.slice(startIndex, endIndex);
});

// 模拟从API获取新闻数据
const fetchNews = () => {
  loading.value = true;
  // 实际项目中这里应该是API调用
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// 分类变更处理
const handleCategoryChange = (key) => {
  activeCategory.value = key;
};

// 分页变更处理
const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo(0, 0); // 回到顶部
};
</script>

<style scoped>
.news-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
}

.page-header p {
  font-size: 16px;
  color: #666;
}

.category-nav {
  margin-bottom: 30px;
  border-bottom: 1px solid #eaeaea;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.news-item {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.news-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12);
}

.news-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.news-wrapper {
  display: flex;
  padding: 20px;
}

.date-block {
  min-width: 80px;
  width: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-color-light) 100%
  );
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  border-radius: 8px;
  flex-shrink: 0;
}

.date-block .day {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}

.date-block .month-year {
  font-size: 14px;
}

.news-content-inner {
  flex: 1;
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.5;
  transition: color 0.3s;
}

.news-item:hover .news-title {
  color: #9a2314;
}

.news-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  background-color: #1890ff;
}

.category-center {
  background-color: #1890ff;
}

.category-notice {
  background-color: #52c41a;
}

.category-policy {
  background-color: #722ed1;
}

.category-theory {
  background-color: #fa8c16;
}

.category-teaching {
  background-color: #eb2f96;
}

.news-author,
.news-source {
  font-size: 13px;
  color: #666;
}

.news-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-top: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .news-wrapper {
    flex-direction: column;
  }

  .date-block {
    margin-bottom: 15px;
    margin-right: 0;
    width: 60px;
    height: 60px;
  }

  .news-title {
    font-size: 16px;
  }

  .news-summary {
    -webkit-line-clamp: 3;
  }
}
</style>
