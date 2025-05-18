import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseService } from '../base.service'

// 创建一个测试用的服务类，继承自BaseService
class TestService extends BaseService<any> {
  constructor() {
    super('test-service')
  }

  async fetchData(id: string) {
    return { id, name: 'Test Data' }
  }

  // 辅助方法，用于测试
  clearCachePublic() {
    this.clearCache()
  }

  getCachedPublic<T>(key: string) {
    return this.getCached<T>(key)
  }

  cacheResponsePublic(key: string, data: any, params?: any) {
    this.cacheResponse(key, data, params)
  }

  deleteCachedPublic(key: string) {
    this.deleteCached(key)
  }

  getCacheKeyPublic(baseKey: string, params?: any) {
    return this.getCacheKey(baseKey, params)
  }
}

describe('BaseService', () => {
  let service: TestService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TestService()
  })

  describe('缓存功能', () => {
    it('应该能够启用和禁用缓存', () => {
      // 默认情况下缓存应该是启用的
      expect(service['useCache']).toBe(true)

      // 禁用缓存
      service.disableCache()
      expect(service['useCache']).toBe(false)

      // 启用缓存
      service.enableCache()
      expect(service['useCache']).toBe(true)
    })

    it('应该能够缓存和检索数据', () => {
      const testData = { id: '1', name: 'Test Item' }
      const cacheKey = 'item:1'

      // 缓存数据
      service.cacheResponsePublic(cacheKey, testData)

      // 检索缓存的数据
      const cachedData = service.getCachedPublic(cacheKey)
      expect(cachedData).toEqual(testData)
    })

    it('应该能够清除缓存', () => {
      const testData = { id: '1', name: 'Test Item' }
      const cacheKey = 'item:1'

      // 缓存数据
      service.cacheResponsePublic(cacheKey, testData)

      // 清除缓存
      service.clearCachePublic()

      // 缓存应该被清空
      const cachedData = service.getCachedPublic(cacheKey)
      expect(cachedData).toBeNull()
    })

    it('应该能够删除特定键的缓存', () => {
      const testData1 = { id: '1', name: 'Item 1' }
      const testData2 = { id: '2', name: 'Item 2' }
      const cacheKey1 = 'item:1'
      const cacheKey2 = 'item:2'

      // 缓存数据
      service.cacheResponsePublic(cacheKey1, testData1)
      service.cacheResponsePublic(cacheKey2, testData2)

      // 删除特定键的缓存
      service.deleteCachedPublic(cacheKey1)

      // 验证结果
      expect(service.getCachedPublic(cacheKey1)).toBeNull()
      expect(service.getCachedPublic(cacheKey2)).toEqual(testData2)
    })

    it('应该能正确生成带参数的缓存键', () => {
      const baseKey = 'list'
      const params = { page: 1, limit: 10, query: 'test' }

      const cacheKey = service.getCacheKeyPublic(baseKey, params)
      expect(cacheKey).toBe('list:{"page":1,"limit":10,"query":"test"}')
    })

    it('当参数为空时，应该返回基础键名', () => {
      const baseKey = 'list'
      const cacheKey = service.getCacheKeyPublic(baseKey)
      expect(cacheKey).toBe('list')
    })
  })

  describe('服务实例化', () => {
    it('应该能使用自定义名称创建服务实例', () => {
      const customService = new TestService()
      expect(customService['serviceName']).toBe('test-service')
    })
  })
})
