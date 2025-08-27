<template>
  <div class="info-section">
    <div class="info-block notice">
      <div class="block-header">
        <h3>
          <i class="fas fa-bullhorn header-icon" />
          <span class="title-text">通知公告</span>
          <router-link to="/news?category=notice"
class="more-link">
            更多<i class="fas fa-angle-right" />
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="notice in noticeNews as any[]"
:key="notice.id">
          <router-link :to="`/news/detail/${notice.id}`"
class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ notice.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-date">发布日期：{{ notice.date }}</span>
                <span class="info-unit">{{
                  notice.author || notice.source || ""
                }}</span>
              </div>
            </div>
          </router-link>
        </li>
        <li v-if="!noticeLoading && noticeNews.length === 0"
class="no-data">
          暂无通知公告
        </li>
      </ul>
    </div>
    <div class="info-block policy">
      <div class="block-header">
        <h3>
          <i class="fas fa-file-alt header-icon" />
          <span class="title-text">政策文件</span>
          <router-link to="/news?category=policy"
class="more-link">
            更多<i class="fas fa-angle-right" />
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="policy in policyNews as any[]"
:key="policy.id">
          <router-link :to="`/news/detail/${policy.id}`"
class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ policy.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-date">发布日期：{{ policy.date }}</span>
                <span class="info-unit">{{
                  policy.author || policy.source || ""
                }}</span>
              </div>
            </div>
          </router-link>
        </li>
        <li v-if="!policyLoading && policyNews.length === 0"
class="no-data">
          暂无政策文件
        </li>
      </ul>
    </div>
    <div class="info-block theory">
      <div class="block-header">
        <h3>
          <i class="fas fa-book header-icon" />
          <span class="title-text">理论前沿</span>
          <router-link to="/resources?category=theory"
class="more-link">
            更多<i class="fas fa-angle-right" />
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="theory in theories as any[]"
:key="theory.id">
          <router-link :to="`/resources/detail/${theory.id}`"
class="info-link">
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ theory.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-author">{{
                  theory.author?.name || "-"
                }}</span>
                <span class="info-date"
                  >发布日期：{{ formatDate(theory.publishDate) }}</span
                >
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="info-block teaching">
      <div class="block-header">
        <h3>
          <i class="fas fa-chalkboard-teacher header-icon" />
          <span class="title-text">教学研究</span>
          <router-link to="/resources?category=teaching"
class="more-link">
            更多<i class="fas fa-angle-right" />
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="research in researches as any[]"
:key="research.id">
          <router-link
            :to="`/resources/detail/${research.id}`"
            class="info-link"
          >
            <div class="info-content">
              <div class="info-header">
                <span class="info-title">{{ research.title }}</span>
              </div>
              <div class="info-footer">
                <span class="info-author">{{
                  research.author?.name || "-"
                }}</span>
                <span class="info-date"
                  >发布日期：{{ formatDate(research.publishDate) }}</span
                >
              </div>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { newsApi, newsCategoryApi } from "@/api";

const props = defineProps({
  theories: {
    type: Array,
    required: true,
  },
  researches: {
    type: Array,
    required: true,
  },
});

const noticeNews = ref<any[]>([]);
const policyNews = ref<any[]>([]);

// 加载状态
const noticeLoading = ref(true);
const policyLoading = ref(true);

const noticeCategoryId = ref<string>("");
const policyCategoryId = ref<string>("");

const fetchCoreCategoryIds = async () => {
  try {
    // 直接调用分类API，更高效
    const res = await newsCategoryApi.instance.getList();

    if (res.success && Array.isArray(res.data)) {
      const notice = res.data.find((cat: any) => cat.key === "notice");
      const policy = res.data.find((cat: any) => cat.key === "policy");

      if (notice) noticeCategoryId.value = notice._id;
      if (policy) policyCategoryId.value = policy._id;
    }
  } catch (error) {
    console.error("【InfoSection】获取分类失败:", error);
  }
};
const fetchNotices = async () => {
  if (!noticeCategoryId.value) {
    noticeLoading.value = false;
    return;
  }

  try {
    // 直接调用新闻API
    const res = await newsApi.instance.getList({
      category: noticeCategoryId.value,
      limit: 5,
    });

    if (res.success && Array.isArray(res.data)) {
      const processedData = res.data.map((item: any, index: number) => ({
        id: item._id || item.id || `notice-${index}`,
        title: item.title || "未命名通知",
        date: item.publishDate
          ? item.publishDate.slice(0, 10)
          : item.createdAt
            ? item.createdAt.slice(0, 10)
            : "",
        author: item.author?.username || item.author?.name || "",
        source: item.source?.name || "",
      }));

      noticeNews.value = processedData;
      await nextTick();
    }
  } catch (error) {
    console.error("【InfoSection】获取通知公告失败:", error);
  } finally {
    noticeLoading.value = false;
  }
};
const fetchPolicies = async () => {
  if (!policyCategoryId.value) {
    policyLoading.value = false;
    return;
  }

  try {
    // 直接调用新闻API
    const res = await newsApi.instance.getList({
      category: policyCategoryId.value,
      limit: 5,
    });

    if (res.success && Array.isArray(res.data)) {
      const processedData = res.data.map((item: any, index: number) => ({
        id: item._id || item.id || `policy-${index}`,
        title: item.title || "未命名政策",
        date: item.publishDate
          ? item.publishDate.slice(0, 10)
          : item.createdAt
            ? item.createdAt.slice(0, 10)
            : "",
        author: item.author?.username || item.author?.name || "",
        source: item.source?.name || "",
      }));

      policyNews.value = processedData;
      await nextTick();
    }
  } catch (error) {
    console.error("【InfoSection】获取政策文件失败:", error);
  } finally {
    policyLoading.value = false;
  }
};

onMounted(async () => {
  // 重置数据
  noticeNews.value = [];
  policyNews.value = [];
  noticeCategoryId.value = "";
  policyCategoryId.value = "";

  await fetchCoreCategoryIds();

  // 串行执行，避免竞态条件
  if (noticeCategoryId.value) {
    await fetchNotices();
  } else {
    noticeLoading.value = false;
  }

  if (policyCategoryId.value) {
    await fetchPolicies();
  } else {
    policyLoading.value = false;
  }
});

const formatDate = (date: any) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
</script>

<style scoped>
.info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 0 20px;
  box-sizing: border-box;
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
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
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
  line-clamp: 2;
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
