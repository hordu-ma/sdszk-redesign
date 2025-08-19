/**
 * 首页API请求处理模块
 * 封装首页组件需要的各种数据获取逻辑，应用防抖和缓存机制
 */

import { ref } from "vue";
import { debounce } from "@/utils/debounce";
import { newsApi, newsCategoryApi, resourceApi } from "@/api";

// 缓存数据
let coreCategoriesCache: any = null;
let coreCategoriesTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存有效期

/**
 * 获取核心分类，带缓存机制
 */
export async function getCoreCategoriesWithCache() {
  const now = Date.now();

  // 如果缓存存在且未过期，返回缓存数据
  if (coreCategoriesCache && now - coreCategoriesTimestamp < CACHE_TTL) {
    console.log("【首页API】使用缓存的分类数据");
    return coreCategoriesCache;
  }

  // 缓存不存在或已过期，重新获取
  console.log("【首页API】获取新的分类数据");
  const res = await newsCategoryApi.instance.getCoreCategories();

  // 缓存结果
  coreCategoriesCache = res;
  coreCategoriesTimestamp = now;

  return res;
}

// 对getCoreCategoriesWithCache进行防抖处理
export const debouncedGetCoreCategories = debounce(
  getCoreCategoriesWithCache,
  800
);

// 资源数据缓存
const resourcesCache = new Map<string, { data: any; timestamp: number }>();

/**
 * 获取特定分类的资源，带缓存机制
 */
export async function getResourcesByCategoryWithCache(
  category: string,
  limit = 5
) {
  const cacheKey = `${category}-${limit}`;
  const now = Date.now();
  const cached = resourcesCache.get(cacheKey);

  // 如果缓存存在且未过期，返回缓存数据
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`【首页API】使用缓存的资源数据: ${category}`);
    return cached.data;
  }

  // 缓存不存在或已过期，重新获取
  console.log(`【首页API】获取新的资源数据: ${category}`);
  try {
    const res = await resourceApi.instance.getList({
      category,
      limit,
    });

    // 缓存结果
    resourcesCache.set(cacheKey, {
      data: res,
      timestamp: now,
    });

    return res;
  } catch (error) {
    console.error(`【首页API】获取资源失败: ${category}`, error);
    // 如果请求失败但有缓存，返回过期的缓存数据
    if (cached) {
      console.log(`【首页API】请求失败，使用过期缓存: ${category}`);
      return cached.data;
    }
    throw error;
  }
}

// 对资源获取函数进行防抖处理
export const debouncedGetResources = debounce(
  getResourcesByCategoryWithCache,
  800
);

// 新闻数据缓存
const newsCache = new Map<string, { data: any; timestamp: number }>();

/**
 * 获取特定分类的新闻，带缓存机制
 */
export async function getNewsByCategoryWithCache(
  categoryId: string,
  limit = 3
) {
  const cacheKey = `${categoryId}-${limit}`;
  const now = Date.now();
  const cached = newsCache.get(cacheKey);

  // 如果缓存存在且未过期，返回缓存数据
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`【首页API】使用缓存的新闻数据: ${categoryId}`);
    return cached.data;
  }

  // 缓存不存在或已过期，重新获取
  console.log(`【首页API】获取新的新闻数据: ${categoryId}`);
  try {
    const res = await newsApi.instance.getList({
      category: categoryId,
      limit,
    });

    // 缓存结果
    newsCache.set(cacheKey, {
      data: res,
      timestamp: now,
    });

    return res;
  } catch (error) {
    console.error(`【首页API】获取新闻失败: ${categoryId}`, error);
    // 如果请求失败但有缓存，返回过期的缓存数据
    if (cached) {
      console.log(`【首页API】请求失败，使用过期缓存: ${categoryId}`);
      return cached.data;
    }
    throw error;
  }
}

// 对新闻获取函数进行防抖处理
export const debouncedGetNews = debounce(getNewsByCategoryWithCache, 800);
