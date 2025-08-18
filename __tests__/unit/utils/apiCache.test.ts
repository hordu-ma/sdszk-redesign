import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiCache, withCache } from '@/utils/apiCache'
import { CACHE_CONFIG } from '@/config'

// Mock CACHE_CONFIG
vi.mock('@/config', () => ({
  CACHE_CONFIG: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
}))

describe('ApiCache', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  afterEach(() => {
    apiCache.clear()
  })

  it('应该能够设置和获取缓存数据', () => {
    const testData = { id: 1, name: 'Test' }
    apiCache.set('/test', testData)
    
    const cachedData = apiCache.get('/test')
    expect(cachedData).toEqual(testData)
  })

  it('应该能够处理带参数的缓存', () => {
    const testData = { id: 1, name: 'Test' }
    const params = { category: 'document' }
    
    apiCache.set('/test', testData, { params })
    
    const cachedData = apiCache.get('/test', params)
    expect(cachedData).toEqual(testData)
  })

  it('应该在TTL过期后清除缓存', () => {
    const testData = { id: 1, name: 'Test' }
    // Mock TTL为1毫秒
    apiCache.set('/test', testData, { ttl: 1 })
    
    // 模拟时间过去
    vi.spyOn(global.Date, 'now').mockImplementation(() => new Date().getTime() + 1000)
    
    const cachedData = apiCache.get('/test')
    expect(cachedData).toBeNull()
  })

  it('应该能够按标签删除缓存', () => {
    const testData = { id: 1, name: 'Test' }
    apiCache.set('/test', testData, { tags: ['test', 'document'] })
    
    apiCache.deleteByTag('document')
    
    const cachedData = apiCache.get('/test')
    expect(cachedData).toBeNull()
  })

  it('应该能够按模式删除缓存', () => {
    const testData1 = { id: 1, name: 'Test1' }
    const testData2 = { id: 2, name: 'Test2' }
    
    apiCache.set('/resources/1', testData1)
    apiCache.set('/resources/2', testData2)
    
    apiCache.deleteByPattern('^/resources')
    
    const cachedData1 = apiCache.get('/resources/1')
    const cachedData2 = apiCache.get('/resources/2')
    
    expect(cachedData1).toBeNull()
    expect(cachedData2).toBeNull()
  })

  it('应该在缓存满时清理旧项', () => {
    // 设置最大缓存项为1
    // @ts-ignore - 访问私有属性用于测试
    apiCache.maxItems = 1
    
    const testData1 = { id: 1, name: 'Test1' }
    const testData2 = { id: 2, name: 'Test2' }
    
    apiCache.set('/test1', testData1)
    apiCache.set('/test2', testData2)
    
    const cachedData1 = apiCache.get('/test1')
    const cachedData2 = apiCache.get('/test2')
    
    // 第一项应该被清理
    expect(cachedData1).toBeNull()
    // 第二项应该存在
    expect(cachedData2).toEqual(testData2)
  })
})

describe('withCache', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  afterEach(() => {
    apiCache.clear()
  })

  it('应该在缓存未命中时调用fetchFn并缓存结果', async () => {
    const testData = { id: 1, name: 'Test' }
    const fetchFn = vi.fn().mockResolvedValue(testData)
    
    const result = await withCache('/test', fetchFn)
    
    expect(result).toEqual(testData)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    
    // 再次获取应该从缓存中获取
    const cachedResult = await withCache('/test', fetchFn)
    expect(cachedResult).toEqual(testData)
    // fetchFn应该仍然只被调用一次
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('应该在forceRefresh为true时强制调用fetchFn', async () => {
    const testData1 = { id: 1, name: 'Test1' }
    const testData2 = { id: 2, name: 'Test2' }
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(testData1)
      .mockResolvedValueOnce(testData2)
    
    // 第一次调用
    const result1 = await withCache('/test', fetchFn)
    expect(result1).toEqual(testData1)
    
    // 强制刷新
    const result2 = await withCache('/test', fetchFn, { forceRefresh: true })
    expect(result2).toEqual(testData2)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('应该在缓存禁用时每次都调用fetchFn', async () => {
    // Mock 缓存禁用
    vi.spyOn(CACHE_CONFIG, 'enabled', 'get').mockReturnValue(false)
    
    const testData1 = { id: 1, name: 'Test1' }
    const testData2 = { id: 2, name: 'Test2' }
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(testData1)
      .mockResolvedValueOnce(testData2)
    
    const result1 = await withCache('/test', fetchFn)
    expect(result1).toEqual(testData1)
    
    const result2 = await withCache('/test', fetchFn)
    expect(result2).toEqual(testData2)
    
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})