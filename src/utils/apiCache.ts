import { CACHE_CONFIG } from "@/config";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number; // 单独的 TTL 设置
  tags?: string[]; // 用于按标签清除缓存
  hits: number; // 缓存命中次数
  lastAccessed: number; // 最后访问时间
}

interface CacheStats {
  totalItems: number;
  totalHits: number;
  size: number;
  oldestItem: number;
  newestItem: number;
}

class ApiCache {
  private cache: Map<string, CacheItem<any>>;
  private maxItems: number;
  private totalHits: number;

  constructor() {
    this.cache = new Map();
    this.maxItems = CACHE_CONFIG.maxSize || 100;
    this.totalHits = 0;

    // 启动定期清理任务
    if (CACHE_CONFIG.enabled) {
      this.startCleanupTask();
    }
  }

  private generateKey(url: string, params?: Record<string, any>): string {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return `${url}${queryString}`;
  }

  private isExpired(item: CacheItem<any>): boolean {
    const ttl = item.ttl || CACHE_CONFIG.ttl;
    return Date.now() - item.timestamp > ttl;
  }

  private startCleanupTask(): void {
    // 每分钟执行一次清理
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  get<T>(url: string, params?: Record<string, any>): T | null {
    if (!CACHE_CONFIG.enabled) return null;

    const key = this.generateKey(url, params);
    const item = this.cache.get(key);

    if (!item) return null;
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    // 更新访问统计
    item.hits++;
    item.lastAccessed = Date.now();
    this.totalHits++;

    return item.data;
  }

  set<T>(
    url: string,
    data: T,
    options?: {
      params?: Record<string, any>;
      ttl?: number;
      tags?: string[];
    },
  ): void {
    if (!CACHE_CONFIG.enabled) return;

    const key = this.generateKey(url, options?.params);

    // 如果缓存已满，清理一些空间
    if (this.cache.size >= this.maxItems) {
      this.evictItems();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl,
      tags: options?.tags,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  private evictItems(count = 1): void {
    // 按最后访问时间和点击次数计算优先级，删除优先级最低的项
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        priority: item.hits / (Date.now() - item.lastAccessed),
      }))
      .sort((a, b) => a.priority - b.priority);

    // 删除指定数量的项
    items.slice(0, count).forEach((item) => this.delete(item.key));
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags?.includes(tag)) {
        this.delete(key);
      }
    }
  }

  deleteByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.totalHits = 0;
  }

  getStats(): CacheStats {
    const timestamps = Array.from(this.cache.values()).map(
      (item) => item.timestamp,
    );
    return {
      totalItems: this.cache.size,
      totalHits: this.totalHits,
      size: this.estimateSize(),
      oldestItem: Math.min(...timestamps),
      newestItem: Math.max(...timestamps),
    };
  }

  private estimateSize(): number {
    let size = 0;
    for (const [key, item] of this.cache.entries()) {
      // 粗略估计每个缓存项的大小（字节）
      size += key.length * 2; // key 字符串
      size += JSON.stringify(item.data).length * 2; // 数据
      size += 8 * 2; // timestamp 和 ttl
      size += (item.tags?.join(",").length || 0) * 2; // tags
      size += 16; // hits 和 lastAccessed
    }
    return size;
  }

  clearByUrl(url: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(url)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateExpired(): void {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();

/**
 * 使用缓存包装API调用，减少重复请求
 *
 * @param url API路径
 * @param fetchFn API调用函数
 * @param options 缓存选项
 * @returns 缓存数据或API调用结果
 */
export async function withCache<T>(
  url: string,
  fetchFn: () => Promise<T>,
  options?: {
    params?: Record<string, any>;
    ttl?: number;
    tags?: string[];
    forceRefresh?: boolean;
  },
): Promise<T> {
  if (!CACHE_CONFIG.enabled || options?.forceRefresh) {
    const data = await fetchFn();
    // 即使forceRefresh，也更新缓存
    apiCache.set(url, data, options);
    return data;
  }

  // 尝试从缓存获取
  const cachedData = apiCache.get<T>(url, options?.params);
  if (cachedData !== null) {
    console.log(`🔄 使用缓存数据: ${url}`);
    return cachedData;
  }

  // 缓存未命中，调用API
  console.log(`⬇️ 获取新数据: ${url}`);
  const data = await fetchFn();

  // 更新缓存
  apiCache.set(url, data, options);

  return data;
}

/* 使用示例：

1. 基本使用
const data = apiCache.get('/resources')
apiCache.set('/resources', responseData)

2. 带参数的缓存
const data = apiCache.get('/resources', { category: 'document' })
apiCache.set('/resources', responseData, { 
  params: { category: 'document' },
  ttl: 5 * 60 * 1000, // 5分钟
  tags: ['resources', 'document']
})

3. 清除特定标签的缓存
apiCache.deleteByTag('resources')

4. 按模式清除缓存
apiCache.deleteByPattern('^/resources')

5. 获取缓存统计
const stats = apiCache.getStats()
console.log(`缓存项数：${stats.totalItems}`)
console.log(`总命中次数：${stats.totalHits}`)
console.log(`缓存占用：${stats.size} 字节`)
*/
