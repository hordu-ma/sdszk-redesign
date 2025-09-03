// homeApiHandler.js - 首页API处理工具
import { resourceApi } from "@/api";

// 缓存对象
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 防抖函数
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

// 获取资源的核心函数
const getResources = async (category, limit = 10) => {
  try {
    console.log(`正在获取资源: category=${category}, limit=${limit}`);

    const response = await resourceApi.instance.getList({
      category: category,
      limit: limit,
      page: 1,
    });

    if (response.success && response.data) {
      // 处理URL格式，确保相对路径转换为完整URL
      const processedData = response.data.map((item) => {
        const processedItem = { ...item };

        // 处理文件URL - 保持相对路径，让vite代理处理
        // 在开发环境中，vite会自动代理这些请求到后端
        // 不需要手动添加完整URL

        return processedItem;
      });

      console.log(`成功获取${category}资源:`, processedData.length, "条");
      return {
        success: true,
        data: processedData,
      };
    } else {
      console.warn(`获取${category}资源失败:`, response);
      return {
        success: false,
        data: [],
        message: response.message || "获取资源失败",
      };
    }
  } catch (error) {
    console.error(`获取${category}资源时发生错误:`, error);
    return {
      success: false,
      data: [],
      message: error.message || "网络请求失败",
    };
  }
};

// 带缓存的资源获取函数
const getCachedResources = async (category, limit = 10) => {
  const cacheKey = `${category}-${limit}`;
  const cached = cache.get(cacheKey);

  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`使用缓存数据: ${cacheKey}`);
    return cached.data;
  }

  // 获取新数据
  const result = await getResources(category, limit);

  // 只缓存成功的结果
  if (result.success) {
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
  }

  return result;
};

// 创建防抖的资源获取函数
export const debouncedGetResources = debounce(getCachedResources, 300);

// 清除缓存的函数
export const clearResourceCache = () => {
  cache.clear();
  console.log("资源缓存已清除");
};

// 预加载资源的函数
export const preloadResources = async () => {
  const categories = ["theory", "teaching", "video"];
  const promises = categories.map((category) =>
    debouncedGetResources(category, 6),
  );

  try {
    const results = await Promise.all(promises);
    console.log("资源预加载完成:", results);
    return results;
  } catch (error) {
    console.error("资源预加载失败:", error);
    return [];
  }
};

// 获取单个分类资源的简化函数
export const getResourcesByCategory = async (category, limit = 10) => {
  return await debouncedGetResources(category, limit);
};

// 导出默认函数
export default {
  debouncedGetResources,
  clearResourceCache,
  preloadResources,
  getResourcesByCategory,
};
