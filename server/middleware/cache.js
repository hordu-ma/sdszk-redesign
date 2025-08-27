import cacheService from "../services/cacheService.js";

/**
 * 缓存中间件配置
 */
export const CacheTTL = {
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟
  LONG: 1800, // 30分钟
  VERY_LONG: 3600, // 1小时
  DAY: 86400, // 1天
};

/**
 * 生成缓存键
 * @param {object} req - Express请求对象
 * @returns {string} 缓存键
 */
function generateCacheKey(req) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userId = req.user?.id || "anonymous";
  return `api:${method}:${url}:${userId}`;
}

/**
 * 缓存中间件
 * @param {object} options - 缓存配置选项
 * @param {number} options.ttl - 缓存过期时间（秒）
 * @param {Function} options.keyGenerator - 自定义缓存键生成函数
 * @param {boolean} options.condition - 是否启用缓存的条件函数
 * @returns {Function} Express中间件
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyGenerator = generateCacheKey,
    condition = () => true,
  } = options;

  return async (req, res, next) => {
    // 检查是否应该使用缓存
    if (!condition(req, res)) {
      return next();
    }

    // 只缓存GET请求
    if (req.method !== "GET") {
      return next();
    }

    // 生成缓存键
    const cacheKey = keyGenerator(req);

    try {
      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`缓存命中: ${cacheKey}`);
        // 设置缓存标识头
        res.set("X-Cache", "HIT");
        res.set("X-Cache-Key", cacheKey);
        return res.json(cached);
      }

      // 缓存未命中，继续处理请求
      console.log(`缓存未命中: ${cacheKey}`);

      // 保存原始的res.json方法
      const originalJson = res.json.bind(res);

      // 重写res.json方法以捕获响应数据
      res.json = function (data) {
        // 只缓存成功的响应
        if (res.statusCode === 200) {
          // 异步缓存，不阻塞响应
          cacheService.set(cacheKey, data, ttl).catch((err) => {
            console.error("缓存写入失败:", err.message);
          });
        }

        // 设置缓存标识头
        res.set("X-Cache", "MISS");
        res.set("X-Cache-Key", cacheKey);

        // 调用原始方法发送响应
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("缓存中间件错误:", error.message);
      // 缓存错误不应该影响正常请求
      next();
    }
  };
}

/**
 * 清除缓存中间件
 * 用于在数据更新时清除相关缓存
 * @param {string|Function} pattern - 缓存键模式或生成函数
 * @returns {Function} Express中间件
 */
export function clearCacheMiddleware(pattern) {
  return async (req, res, next) => {
    try {
      let cachePattern;

      if (typeof pattern === "function") {
        cachePattern = pattern(req);
      } else {
        cachePattern = pattern;
      }

      // 清除匹配的缓存
      const count = await cacheService.delByPattern(cachePattern);
      console.log(`清除缓存: ${cachePattern}, 清除数量: ${count}`);

      // 添加到响应头
      res.set("X-Cache-Cleared", cachePattern);
      res.set("X-Cache-Cleared-Count", count.toString());

      next();
    } catch (error) {
      console.error("清除缓存错误:", error.message);
      // 清除缓存失败不应该影响正常请求
      next();
    }
  };
}

/**
 * 禁用缓存中间件
 * 用于强制跳过缓存
 */
export function noCacheMiddleware(req, res, next) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
}

/**
 * 条件缓存中间件生成器
 * @param {string} resource - 资源类型
 * @param {number} ttl - 缓存时间
 * @returns {Function} Express中间件
 */
export function resourceCache(resource, ttl = CacheTTL.MEDIUM) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const baseKey = `${resource}:${req.method}:${req.path}`;
      const query = JSON.stringify(req.query);
      return query !== "{}" ? `${baseKey}:${query}` : baseKey;
    },
    condition: (req) => {
      // 如果请求头包含no-cache，则跳过缓存
      return !req.headers["cache-control"]?.includes("no-cache");
    },
  });
}

export default {
  cacheMiddleware,
  clearCacheMiddleware,
  noCacheMiddleware,
  resourceCache,
  CacheTTL,
};
