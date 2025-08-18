import { getRedisClient, isRedisConnected } from '../config/redis.js'

/**
 * 缓存服务类
 * 提供统一的缓存操作接口，支持降级到内存缓存
 */
class CacheService {
  constructor() {
    // 内存缓存作为降级方案
    this.memoryCache = new Map()
    this.memoryCacheTTL = new Map()
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 缓存键前缀
   * @param {string|object} identifier - 标识符
   * @returns {string} 缓存键
   */
  generateKey(prefix, identifier) {
    if (typeof identifier === 'object') {
      return `${prefix}:${JSON.stringify(identifier)}`
    }
    return `${prefix}:${identifier}`
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = 3600) {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        const serialized = JSON.stringify(value)
        if (ttl > 0) {
          await client.setEx(key, ttl, serialized)
        } else {
          await client.set(key, serialized)
        }
        return true
      } else {
        // 降级到内存缓存
        this.setMemoryCache(key, value, ttl)
        return true
      }
    } catch (error) {
      console.error(`缓存设置失败 [${key}]:`, error.message)
      // 降级到内存缓存
      this.setMemoryCache(key, value, ttl)
      return false
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        const value = await client.get(key)
        return value ? JSON.parse(value) : null
      } else {
        // 从内存缓存获取
        return this.getMemoryCache(key)
      }
    } catch (error) {
      console.error(`缓存获取失败 [${key}]:`, error.message)
      // 降级到内存缓存
      return this.getMemoryCache(key)
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async del(key) {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        await client.del(key)
      }
      
      // 同时清理内存缓存
      this.memoryCache.delete(key)
      this.memoryCacheTTL.delete(key)
      return true
    } catch (error) {
      console.error(`缓存删除失败 [${key}]:`, error.message)
      return false
    }
  }

  /**
   * 批量删除缓存（通过模式匹配）
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>} 删除的键数量
   */
  async delByPattern(pattern) {
    try {
      const client = getRedisClient()
      let count = 0
      
      if (isRedisConnected() && client) {
        const keys = await client.keys(pattern)
        if (keys.length > 0) {
          count = await client.del(keys)
        }
      }
      
      // 清理内存缓存中的匹配项
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key)
          this.memoryCacheTTL.delete(key)
          count++
        }
      }
      
      return count
    } catch (error) {
      console.error(`批量删除缓存失败 [${pattern}]:`, error.message)
      return 0
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        return await client.exists(key) === 1
      } else {
        return this.memoryCache.has(key) && !this.isMemoryCacheExpired(key)
      }
    } catch (error) {
      console.error(`检查缓存存在失败 [${key}]:`, error.message)
      return false
    }
  }

  /**
   * 设置缓存过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>}
   */
  async expire(key, ttl) {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        return await client.expire(key, ttl)
      }
      return false
    } catch (error) {
      console.error(`设置过期时间失败 [${key}]:`, error.message)
      return false
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>}
   */
  async flush() {
    try {
      const client = getRedisClient()
      
      if (isRedisConnected() && client) {
        await client.flushDb()
      }
      
      // 清空内存缓存
      this.memoryCache.clear()
      this.memoryCacheTTL.clear()
      return true
    } catch (error) {
      console.error('清空缓存失败:', error.message)
      return false
    }
  }

  // 内存缓存辅助方法
  setMemoryCache(key, value, ttl) {
    this.memoryCache.set(key, value)
    if (ttl > 0) {
      this.memoryCacheTTL.set(key, Date.now() + ttl * 1000)
    }
  }

  getMemoryCache(key) {
    if (this.isMemoryCacheExpired(key)) {
      this.memoryCache.delete(key)
      this.memoryCacheTTL.delete(key)
      return null
    }
    return this.memoryCache.get(key) || null
  }

  isMemoryCacheExpired(key) {
    const expireTime = this.memoryCacheTTL.get(key)
    if (!expireTime) return false
    if (Date.now() > expireTime) {
      return true
    }
    return false
  }

  /**
   * 使用缓存包装函数
   * @param {string} key - 缓存键
   * @param {Function} fn - 数据获取函数
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<any>}
   */
  async wrap(key, fn, ttl = 3600) {
    // 尝试从缓存获取
    const cached = await this.get(key)
    if (cached !== null) {
      console.log(`缓存命中: ${key}`)
      return cached
    }

    // 缓存未命中，执行函数获取数据
    console.log(`缓存未命中: ${key}`)
    const result = await fn()
    
    // 将结果存入缓存
    if (result !== null && result !== undefined) {
      await this.set(key, result, ttl)
    }
    
    return result
  }
}

// 导出单例
export default new CacheService()
