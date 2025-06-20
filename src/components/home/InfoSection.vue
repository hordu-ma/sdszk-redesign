<template>
  <div class="info-section">
    <div class="info-block notice">
      <div class="block-header">
        <h3>
          <i class="fas fa-bullhorn header-icon"></i>
          <span class="title-text">通知公告</span>
          <router-link to="/news?category=notice" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="notice in noticeNews as any[]" :key="notice.id">
          <router-link :to="`/news/detail/${notice.id}`" class="info-link">
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
        <li v-if="noticeNews.length === 0" class="no-data">暂无通知公告</li>
      </ul>
    </div>
    <div class="info-block policy">
      <div class="block-header">
        <h3>
          <i class="fas fa-file-alt header-icon"></i>
          <span class="title-text">政策文件</span>
          <router-link to="/news?category=policy" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="policy in policyNews as any[]" :key="policy.id">
          <router-link :to="`/news/detail/${policy.id}`" class="info-link">
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
        <li v-if="policyNews.length === 0" class="no-data">暂无政策文件</li>
      </ul>
    </div>
    <div class="info-block theory">
      <div class="block-header">
        <h3>
          <i class="fas fa-book header-icon"></i>
          <span class="title-text">理论前沿</span>
          <router-link to="/resources?category=theory" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="theory in theories as any[]" :key="theory.id">
          <router-link :to="`/resources/detail/${theory.id}`" class="info-link">
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
          <i class="fas fa-chalkboard-teacher header-icon"></i>
          <span class="title-text">教学研究</span>
          <router-link to="/resources?category=teaching" class="more-link">
            更多<i class="fas fa-angle-right"></i>
          </router-link>
        </h3>
      </div>
      <ul class="styled-list">
        <li v-for="research in researches as any[]" :key="research.id">
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
import { computed } from "vue";
import {
  debouncedGetCoreCategories,
  debouncedGetNews,
} from "@/utils/homeApiHandler";

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
const noticeCategoryId = ref<string>("");
const policyCategoryId = ref<string>("");

const fetchCoreCategoryIds = async () => {
  try {
    // 使用防抖和缓存的API调用
    const res = await debouncedGetCoreCategories();
    console.log("【InfoSection】获取核心分类原始响应:", res);
    console.log("【InfoSection】响应类型:", typeof res);

    // 处理API响应格式
    let categories = [];
    if (res && typeof res === "object") {
      console.log("【InfoSection】响应是对象，检查数据结构");
      if (res.data && res.data.status === "success") {
        categories = res.data.data;
        console.log("【InfoSection】使用格式: res.data.data");
      } else if (res.success) {
        categories = res.data;
        console.log("【InfoSection】使用格式: res.data");
      } else if (res.data) {
        categories = res.data;
        console.log("【InfoSection】使用格式: res.data (fallback)");
      }
    }

    console.log("【InfoSection】提取的分类数据:", categories);
    console.log(
      "【InfoSection】分类数据是否为数组:",
      Array.isArray(categories)
    );

    if (Array.isArray(categories)) {
      console.log(
        "【InfoSection】分类列表:",
        categories.map((cat) => ({ key: cat.key, id: cat._id, name: cat.name }))
      );

      const notice = categories.find((cat: any) => cat.key === "notice");
      const policy = categories.find((cat: any) => cat.key === "policy");

      console.log("【InfoSection】找到的notice分类:", notice);
      console.log("【InfoSection】找到的policy分类:", policy);

      if (notice) {
        noticeCategoryId.value = notice._id;
        console.log("【InfoSection】设置通知公告ID:", notice._id);
        console.log("【InfoSection】通知公告分类详情:", {
          id: notice._id,
          key: notice.key,
          name: notice.name,
        });
      } else {
        console.error("【InfoSection】🚨 未找到 notice 分类！");
      }

      if (policy) {
        policyCategoryId.value = policy._id;
        console.log("【InfoSection】设置政策文件ID:", policy._id);
        console.log("【InfoSection】政策文件分类详情:", {
          id: policy._id,
          key: policy.key,
          name: policy.name,
        });
      } else {
        console.error("【InfoSection】🚨 未找到 policy 分类！");
      }

      console.log("【InfoSection】最终分类ID获取结果:", {
        notice: noticeCategoryId.value,
        policy: policyCategoryId.value,
      });
    } else {
      console.error("【InfoSection】分类数据格式不正确:", categories);
    }
  } catch (error) {
    console.error("【InfoSection】获取分类失败:", error);
  }
};
const fetchNotices = async () => {
  if (!noticeCategoryId.value) {
    console.log("【InfoSection】通知公告分类ID为空");
    return;
  }

  console.log("【InfoSection】🔍 开始fetchNotices，当前状态检查:");
  console.log("  - noticeNews.value.length:", noticeNews.value.length);
  console.log("  - policyNews.value.length:", policyNews.value.length);
  console.log("  - noticeCategoryId.value:", noticeCategoryId.value);
  console.log("  - policyCategoryId.value:", policyCategoryId.value);

  try {
    console.log(
      "【InfoSection】开始获取通知公告，分类ID:",
      noticeCategoryId.value
    );

    // 临时直接调用原始API，绕过缓存
    console.log("【InfoSection】尝试直接调用原始API");
    let directRes = null;
    try {
      directRes = await newsApi.getList({
        category: noticeCategoryId.value,
        limit: 5,
      });
      console.log("【InfoSection】直接API调用结果:", directRes);
    } catch (directError) {
      console.error("【InfoSection】直接API调用失败:", directError);
    }

    // 使用防抖和缓存的API调用
    const res = await debouncedGetNews(noticeCategoryId.value, 5);
    console.log("【InfoSection】通知公告API响应:", res);
    console.log("【InfoSection】API响应类型:", typeof res);
    console.log("【InfoSection】API响应结构分析:", {
      hasSuccess: "success" in (res as any),
      successValue: (res as any).success,
      hasData: "data" in (res as any),
      dataType: typeof (res as any).data,
      isDataArray: Array.isArray((res as any).data),
      hasNestedData: (res as any).data && "data" in (res as any).data,
      nestedDataType: (res as any).data && typeof (res as any).data.data,
    });

    // 临时使用直接API调用替代缓存调用，因为直接调用返回了正确的数据格式
    console.log("【InfoSection】使用直接API调用结果替代缓存结果");
    const finalRes = directRes || res;

    // 处理API响应格式 - 完全复制政策文件的逻辑
    let newsList = [];
    if ((finalRes as any).success && Array.isArray((finalRes as any).data)) {
      newsList = (finalRes as any).data;
      console.log("【InfoSection】使用格式: finalRes.data (success + array)");
    } else if ((finalRes as any).data && (finalRes as any).data.success) {
      newsList = (finalRes as any).data.data || [];
      console.log(
        "【InfoSection】使用格式: finalRes.data.data (nested success)"
      );
    } else {
      console.log("【InfoSection】API响应格式不匹配预期");
    }

    console.log("【InfoSection】提取的新闻列表:", newsList);
    console.log("【InfoSection】新闻列表长度:", newsList.length);
    console.log("【InfoSection】新闻列表是否为数组:", Array.isArray(newsList));

    console.log(
      "【InfoSection】数据处理前 noticeNews.value:",
      noticeNews.value
    );
    console.log(
      "【InfoSection】数据处理前 noticeNews.value.length:",
      noticeNews.value.length
    );

    if (Array.isArray(newsList)) {
      console.log("【InfoSection】开始处理新闻数据，原始数据:", newsList);

      const processedData = newsList.map((item: any, index: number) => {
        const processed = {
          id: item._id || item.id || `notice-${index}`,
          title: item.title || "未命名通知",
          date: item.publishDate
            ? item.publishDate.slice(0, 10)
            : item.createdAt
              ? item.createdAt.slice(0, 10)
              : "",
          author: item.author?.username || item.author?.name || "",
          source: item.source?.name || "",
        };
        console.log(`【InfoSection】处理第${index}项:`, {
          original: item,
          processed,
        });
        return processed;
      });

      console.log("【InfoSection】处理后的数据:", processedData);

      noticeNews.value = processedData;

      console.log("【InfoSection】赋值后 noticeNews.value:", noticeNews.value);
      console.log(
        "【InfoSection】赋值后 noticeNews.value.length:",
        noticeNews.value.length
      );

      console.log("【InfoSection】通知公告数据处理结果:", noticeNews.value);
      console.log(
        "【InfoSection】通知公告每项详情:",
        noticeNews.value.map((item) => ({
          id: item.id,
          title: item.title,
          hasTitle: !!item.title,
        }))
      );

      // 强制触发响应式更新
      await nextTick();
      console.log(
        "【InfoSection】通知公告响应式更新完成，当前长度:",
        noticeNews.value.length
      );

      // 检查是否意外影响了政策文件数据
      console.log("【InfoSection】🔍 fetchNotices完成后，状态检查:");
      console.log("  - noticeNews.value.length:", noticeNews.value.length);
      console.log("  - policyNews.value.length:", policyNews.value.length);
    } else {
      console.error("【InfoSection】通知公告数据格式不正确:", newsList);
    }
  } catch (error) {
    console.error("【InfoSection】获取通知公告失败:", error);
  }
};
const fetchPolicies = async () => {
  if (!policyCategoryId.value) {
    console.log("【InfoSection】政策文件分类ID为空");
    return;
  }

  console.log("【InfoSection】🔍 开始fetchPolicies，当前状态检查:");
  console.log("  - noticeNews.value.length:", noticeNews.value.length);
  console.log("  - policyNews.value.length:", policyNews.value.length);
  console.log("  - noticeCategoryId.value:", noticeCategoryId.value);
  console.log("  - policyCategoryId.value:", policyCategoryId.value);

  try {
    console.log(
      "【InfoSection】开始获取政策文件，分类ID:",
      policyCategoryId.value
    );

    // 临时直接调用原始API，绕过缓存
    console.log("【InfoSection】尝试直接调用原始API");
    let directRes = null;
    try {
      directRes = await newsApi.getList({
        category: policyCategoryId.value,
        limit: 5,
      });
      console.log("【InfoSection】政策文件直接API调用结果:", directRes);
    } catch (directError) {
      console.error("【InfoSection】政策文件直接API调用失败:", directError);
    }

    // 使用防抖和缓存的API调用
    const res = await debouncedGetNews(policyCategoryId.value, 5);
    console.log("【InfoSection】政策文件API响应:", res);
    console.log("【InfoSection】政策文件API响应类型:", typeof res);
    console.log("【InfoSection】政策文件API响应结构分析:", {
      hasSuccess: "success" in (res as any),
      successValue: (res as any).success,
      hasData: "data" in (res as any),
      dataType: typeof (res as any).data,
      isDataArray: Array.isArray((res as any).data),
      hasNestedData: (res as any).data && "data" in (res as any).data,
      nestedDataType: (res as any).data && typeof (res as any).data.data,
    });

    // 临时使用直接API调用替代缓存调用，因为直接调用返回了正确的数据格式
    console.log("【InfoSection】使用直接API调用结果替代缓存结果");
    const finalRes = directRes || res;

    // 处理API响应格式
    let newsList = [];
    if ((finalRes as any).success && Array.isArray((finalRes as any).data)) {
      newsList = (finalRes as any).data;
      console.log(
        "【InfoSection】政策文件使用格式: finalRes.data (success + array)"
      );
    } else if ((finalRes as any).data && (finalRes as any).data.success) {
      newsList = (finalRes as any).data.data || [];
      console.log(
        "【InfoSection】政策文件使用格式: finalRes.data.data (nested success)"
      );
    } else {
      console.log("【InfoSection】政策文件API响应格式不匹配预期");
    }

    console.log("【InfoSection】政策文件提取的新闻列表:", newsList);
    console.log("【InfoSection】政策文件新闻列表长度:", newsList.length);
    console.log(
      "【InfoSection】政策文件新闻列表是否为数组:",
      Array.isArray(newsList)
    );

    console.log(
      "【InfoSection】政策文件数据处理前 policyNews.value:",
      policyNews.value
    );
    console.log(
      "【InfoSection】政策文件数据处理前 policyNews.value.length:",
      policyNews.value.length
    );

    if (Array.isArray(newsList)) {
      console.log(
        "【InfoSection】政策文件开始处理新闻数据，原始数据:",
        newsList
      );

      const processedData = newsList.map((item: any, index: number) => {
        const processed = {
          id: item._id || item.id || `policy-${index}`,
          title: item.title || "未命名政策",
          date: item.publishDate
            ? item.publishDate.slice(0, 10)
            : item.createdAt
              ? item.createdAt.slice(0, 10)
              : "",
          author: item.author?.username || item.author?.name || "",
          source: item.source?.name || "",
        };
        console.log(`【InfoSection】政策文件处理第${index}项:`, {
          original: item,
          processed,
        });
        return processed;
      });

      console.log("【InfoSection】政策文件处理后的数据:", processedData);

      policyNews.value = processedData;

      console.log(
        "【InfoSection】政策文件赋值后 policyNews.value:",
        policyNews.value
      );
      console.log(
        "【InfoSection】政策文件赋值后 policyNews.value.length:",
        policyNews.value.length
      );

      console.log("【InfoSection】政策文件数据处理结果:", policyNews.value);
      console.log(
        "【InfoSection】政策文件每项详情:",
        policyNews.value.map((item) => ({
          id: item.id,
          title: item.title,
          hasTitle: !!item.title,
        }))
      );

      // 强制触发响应式更新
      await nextTick();
      console.log(
        "【InfoSection】政策文件响应式更新完成，当前长度:",
        policyNews.value.length
      );

      // 检查是否意外影响了通知公告数据
      console.log("【InfoSection】🔍 fetchPolicies完成后，状态检查:");
      console.log("  - noticeNews.value.length:", noticeNews.value.length);
      console.log("  - policyNews.value.length:", policyNews.value.length);
    } else {
      console.error("【InfoSection】政策文件数据格式不正确:", newsList);
    }
  } catch (error) {
    console.error("【InfoSection】获取政策文件失败:", error);
  }
};

onMounted(async () => {
  console.log("【InfoSection】组件挂载开始");

  // 先重置所有数据
  noticeNews.value = [];
  policyNews.value = [];
  noticeCategoryId.value = "";
  policyCategoryId.value = "";

  await fetchCoreCategoryIds();

  console.log("【InfoSection】分类ID获取完成，开始获取新闻数据");
  console.log("【InfoSection】当前分类ID状态:", {
    notice: noticeCategoryId.value,
    policy: policyCategoryId.value,
  });

  // 检查分类ID是否相同（这可能是问题所在）
  if (noticeCategoryId.value === policyCategoryId.value) {
    console.error(
      "【InfoSection】🚨 发现问题：通知公告和政策文件使用了相同的分类ID:",
      noticeCategoryId.value
    );
  }

  // 串行执行而不是并行，避免竞态条件
  if (noticeCategoryId.value) {
    console.log("【InfoSection】步骤1：获取通知公告数据");
    await fetchNotices();
    console.log(
      "【InfoSection】步骤1完成，通知公告数量:",
      noticeNews.value.length
    );
  } else {
    console.warn("【InfoSection】通知公告分类ID为空，跳过获取");
  }

  if (policyCategoryId.value) {
    console.log("【InfoSection】步骤2：获取政策文件数据");
    await fetchPolicies();
    console.log(
      "【InfoSection】步骤2完成，政策文件数量:",
      policyNews.value.length
    );
  } else {
    console.warn("【InfoSection】政策文件分类ID为空，跳过获取");
  }

  // 最终检查
  console.log("【InfoSection】最终数据状态:", {
    noticeCount: noticeNews.value.length,
    policyCount: policyNews.value.length,
    noticeData: noticeNews.value,
    policyData: policyNews.value,
  });
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
