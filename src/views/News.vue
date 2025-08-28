<template>
  <page-layout
    title="资讯中心"
    description="大中小学思政课一体化建设相关资讯、政策及研究资料"
  >
    <div class="news-content">
      <!-- 分类导航 -->
      <div class="category-nav">
        <a-tabs v-model:active-key="activeCategory">
          <a-tab-pane key="all" tab="全部资讯" />
          <a-tab-pane
            v-for="category in categories"
            :key="category.key"
            :tab="category.name"
          />
        </a-tabs>
      </div>

      <!-- 新闻列表 -->
      <div class="news-list">
        <a-spin :spinning="loading">
          <div class="news-items">
            <news-list-item
              v-for="news in filteredNews"
              :key="news.id"
              :news="news"
            />
          </div>

          <!-- 分页 -->
          <div v-if="totalNews > 0" class="pagination-container">
            <a-pagination
              v-model:current="currentPage"
              :total="totalNews"
              :page-size="pageSize"
              show-less-items
              @change="handlePageChange"
            />
          </div>

          <!-- 无数据提示 -->
          <a-empty
            v-if="filteredNews.length === 0"
            description="暂无相关资讯"
          />
        </a-spin>
      </div>
    </div>
  </page-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { newsApi, newsCategoryApi } from "@/api";
import PageLayout from "../components/common/PageLayout.vue";
import NewsListItem from "../components/news/NewsListItem.vue";

interface NewsCategory {
  _id: string;
  name: string;
  key: string;
}

interface NewsItem {
  id: string;
  _id?: string; // 兼容字段
  title: string;
  content: string;
  summary?: string;
  publishDate: string;
  createdAt: string;
  author: any;
  category: NewsCategory;
  viewCount?: number;
  categoryKey?: string;
  categoryName?: string;
}

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalNews = ref(0);

// 数据状态
const newsList = ref<NewsItem[]>([]);
const categories = ref<NewsCategory[]>([]);
const categoriesLoaded = ref(false); // 新增：分类数据是否已加载

// 使用可写计算属性将 activeCategory 与路由查询参数同步
const activeCategory = computed<string>({
  get: () => (route.query.category as string) || "all",
  set: (val) => {
    router.push({
      path: "/news",
      query: val === "all" ? {} : { category: val },
    });
  },
});

// 获取分类列表
async function fetchCategories() {
  try {
    const response = await newsCategoryApi.instance.getList();
    if (response.success) {
      categories.value = response.data;
      categoriesLoaded.value = true;
      console.log("分类数据加载完成:", categories.value);
      console.log(
        "分类详细信息:",
        categories.value.map((cat) => ({
          _id: cat._id,
          key: cat.key,
          name: cat.name,
        })),
      );
    }
  } catch (error) {
    console.error("获取分类失败:", error);
    message.error("获取分类失败");
    categoriesLoaded.value = true; // 即使失败也标记为已加载，避免无限等待
  }
}

// 获取新闻数据
async function fetchNews() {
  // 如果分类数据还未加载完成，等待加载
  if (!categoriesLoaded.value) {
    console.log("⏳ 分类数据未加载完成，等待加载...");
    return;
  }

  // 双重检查：确保categories数据有效
  if (
    activeCategory.value !== "all" &&
    (!Array.isArray(categories.value) || categories.value.length === 0)
  ) {
    console.warn("⚠️ 分类数据无效，重新加载分类");
    try {
      await fetchCategories();
      if (!categoriesLoaded.value || categories.value.length === 0) {
        console.error("❌ 重新加载分类失败，继续请求所有新闻");
      }
    } catch (error) {
      console.error("❌ 重新加载分类出错:", error);
    }
  }

  loading.value = true;
  try {
    const params: { page: number; limit: number; category?: string } = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    // 如果有选择分类，添加分类筛选
    if (activeCategory.value !== "all") {
      console.log("当前分类:", activeCategory.value);
      console.log(
        "可用分类列表:",
        categories.value.map((cat) => ({
          _id: cat._id,
          key: cat.key,
          name: cat.name,
        })),
      );

      // 容错处理：确保categories是数组且有数据
      if (!Array.isArray(categories.value) || categories.value.length === 0) {
        console.warn("⚠️ 分类数据为空或格式错误，跳过分类筛选");
        return;
      }

      // 根据分类key查找分类ID，添加容错处理
      const selectedCategory = categories.value.find((cat) => {
        // 确保cat对象存在且有key属性
        if (!cat || typeof cat !== "object") {
          console.warn("⚠️ 发现无效分类数据:", cat);
          return false;
        }
        return cat.key === activeCategory.value;
      });

      console.log("查找结果:", selectedCategory);

      if (selectedCategory && selectedCategory._id) {
        // 确保_id存在且有效
        params.category = selectedCategory._id;
        console.log(
          "✅ 找到分类:",
          selectedCategory.name,
          "ID:",
          selectedCategory._id,
        );
      } else {
        console.error(
          "❌ 未找到分类或分类ID无效:",
          activeCategory.value,
          "可用分类:",
          categories.value.map((cat) => ({
            key: cat?.key || "undefined",
            name: cat?.name || "undefined",
            _id: cat?._id || "undefined",
          })),
        );
        // 即使找不到分类，也继续请求（返回所有新闻）
        console.log("🔄 继续请求所有新闻");
      }
    }

    console.log("📤 发送新闻请求参数:", JSON.stringify(params, null, 2));
    const response = await newsApi.instance.getList(params);
    console.log("📥 新闻接口响应", response);

    if (response.success) {
      console.log("🔍 原始响应数据:", response.data);
      newsList.value = response.data.map((item: any) => {
        // 确保分类信息完整传递
        const mappedItem = {
          ...item,
          id: item.id || item._id,
          publishDate: item.publishDate || item.createdAt,
          // 保留原有的分类信息结构
          categoryKey: item.categoryKey || item.category?.key,
          categoryName: item.categoryName || item.category?.name,
        };
        console.log(`🏷️ 映射新闻 "${item.title}":`, {
          categoryKey: mappedItem.categoryKey,
          categoryName: mappedItem.categoryName,
          category: item.category,
        });
        return mappedItem;
      });
      totalNews.value = response.pagination?.total || 0;
      console.log(
        `📊 获取到 ${newsList.value.length} 条新闻，总数: ${totalNews.value}`,
      );
      console.log(
        "新闻分类分布:",
        newsList.value.map((item) => ({
          title: item.title,
          categoryKey: item.categoryKey || item.category?.key,
          categoryName: item.categoryName || item.category?.name,
          categoryId: item.category?._id,
        })),
      );
    } else {
      message.error("获取新闻失败");
    }
  } catch (error) {
    console.error("获取新闻失败:", error);
    message.error("获取新闻失败");
  } finally {
    loading.value = false;
  }
}

// 监听分类数据加载状态，加载完成后立即获取新闻数据
watch(
  categoriesLoaded,
  (loaded) => {
    if (loaded) {
      console.log("🎯 分类数据加载完成，开始获取新闻数据");
      console.log("当前URL分类参数:", activeCategory.value);
      fetchNews();
    }
  },
  { immediate: false },
);

// 监听 activeCategory (源自路由) 的变化来获取数据
watch(
  activeCategory,
  () => {
    if (categoriesLoaded.value) {
      console.log("🔄 分类切换:", activeCategory.value);
      currentPage.value = 1; // 分类变化时重置到第一页
      fetchNews();
    } else {
      console.log("⏳ 分类数据尚未加载完成，等待...");
    }
  },
  { immediate: false }, // 不立即执行，等待分类数据加载完成
);

// 组件挂载时先获取分类列表
onMounted(async () => {
  console.log("🚀 组件挂载，开始加载分类数据");
  console.log("初始URL参数:", route.query);
  await fetchCategories();
});

// 计算显示的新闻列表
const filteredNews = computed(() => {
  return newsList.value.map((news) => ({
    ...news,
    // 格式化显示数据
    date: new Date(news.publishDate || news.createdAt).toLocaleDateString(
      "zh-CN",
    ),
    categoryKey: news.categoryKey || news.category.key || "center",
    categoryName: news.categoryName || news.category.name || "中心动态",
  }));
});

// 分页变更处理
function handlePageChange(page: number) {
  currentPage.value = page;
  fetchNews();
  window.scrollTo(0, 0); // 回到顶部
}
</script>

<style scoped>
.news-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-nav {
  margin-bottom: 24px;
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.news-list {
  margin-top: 24px;
}

.news-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
