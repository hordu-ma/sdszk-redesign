// persistence.test.ts - Pinia状态持久化测试
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useUserStore } from '@/stores/user'
import { useContentStore } from '@/stores/content'

// Mock localStorage with better implementation
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
}

// Mock API
vi.mock('@/utils/api', () => ({
  default: {
    defaults: { headers: { common: {} } },
    get: vi.fn().mockResolvedValue({ data: { status: 'success', data: { user: {} } } }),
    post: vi.fn().mockResolvedValue({ data: { status: 'success' } }),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock debounce utility
vi.mock('@/utils/debounce', () => ({
  debounce: (fn: Function) => fn
}))

let localStorageMock: ReturnType<typeof createLocalStorageMock>

// Setup localStorage mock globally
Object.defineProperty(window, 'localStorage', {
  get: () => localStorageMock,
  configurable: true
})

describe('Pinia状态持久化测试', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    // 创建新的localStorage mock实例
    localStorageMock = createLocalStorageMock()

    // 创建新的pinia实例
    pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    setActivePinia(pinia)
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('用户Store持久化测试', () => {
    it('应该只持久化token和userInfo', async () => {
      const userStore = useUserStore()

      // 设置各种状态
      userStore.token = 'test-token'
      userStore.userInfo = {
        id: '1',
        username: 'testuser',
        name: '测试用户',
        role: 'user',
        permissions: ['read']
      }
      userStore.loading = true

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 验证localStorage中有数据
      const storedData = localStorageMock.getItem('user')
      expect(storedData).toBeTruthy()

      // 模拟页面刷新 - 创建新的store实例
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      const newUserStore = useUserStore()

      // 验证持久化的状态
      expect(newUserStore.token).toBe('test-token')
      expect(newUserStore.userInfo).toEqual({
        id: '1',
        username: 'testuser',
        name: '测试用户',
        role: 'user',
        permissions: ['read']
      })

      // 验证非持久化的状态（应该是默认值）
      expect(newUserStore.loading).toBe(false)
    })

    it('应该正确处理token的设置和清除', async () => {
      const userStore = useUserStore()

      // 设置token
      userStore.setToken('new-token')
      expect(userStore.token).toBe('new-token')

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 模拟页面刷新
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      const newUserStore = useUserStore()
      expect(newUserStore.token).toBe('new-token')
    })

    it('应该正确清除持久化的认证状态', async () => {
      const userStore = useUserStore()

      // 设置认证状态
      userStore.token = 'test-token'
      userStore.userInfo = {
        id: '1',
        username: 'testuser',
        name: '测试用户',
        role: 'user',
        permissions: ['read']
      }

      // 执行登出
      await userStore.logout()

      // 验证状态被清除
      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()

      // 验证localStorage也被清除
      const persistedData = localStorage.getItem('user')
      if (persistedData) {
        const data = JSON.parse(persistedData)
        expect(data.token).toBeFalsy()
        expect(data.userInfo).toBeFalsy()
      }
    })
  })

  describe('内容Store持久化测试', () => {
    it('应该只持久化用户偏好设置', async () => {
      const contentStore = useContentStore()

      // 设置各种状态
      contentStore.news.filters.category = 'tech'
      contentStore.news.filters.search = '测试搜索'
      contentStore.news.limit = 20
      contentStore.news.loading = true
      contentStore.news.items = [{ id: 1, title: '测试新闻' }]

      contentStore.resources.filters.category = 'docs'
      contentStore.resources.limit = 30
      contentStore.resources.loading = true

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 模拟页面刷新
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      const newContentStore = useContentStore()

      // 验证持久化的偏好设置
      expect(newContentStore.news.filters.category).toBe('tech')
      expect(newContentStore.news.filters.search).toBe('测试搜索')
      expect(newContentStore.news.limit).toBe(20)
      expect(newContentStore.resources.filters.category).toBe('docs')
      expect(newContentStore.resources.limit).toBe(30)

      // 验证非持久化的临时状态（应该是默认值）
      expect(newContentStore.news.loading).toBe(false)
      expect(newContentStore.news.items).toEqual([])
      expect(newContentStore.resources.loading).toBe(false)
    })

    it('应该保持筛选器状态在页面刷新后', async () => {
      const contentStore = useContentStore()

      // 设置复杂的筛选条件
      contentStore.news.filters.category = 'technology'
      contentStore.news.filters.status = 'published'
      contentStore.news.filters.search = 'Vue.js开发'

      contentStore.resources.filters.category = 'documents'
      contentStore.resources.filters.fileType = 'pdf'
      contentStore.resources.filters.search = 'API文档'

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 模拟页面刷新
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      const newContentStore = useContentStore()

      // 验证筛选器被正确恢复
      expect(newContentStore.news.filters.category).toBe('technology')
      expect(newContentStore.news.filters.status).toBe('published')
      expect(newContentStore.news.filters.search).toBe('Vue.js开发')

      expect(newContentStore.resources.filters.category).toBe('documents')
      expect(newContentStore.resources.filters.fileType).toBe('pdf')
      expect(newContentStore.resources.filters.search).toBe('API文档')
    })
  })

  describe('localStorage存储格式验证', () => {
    it('用户Store应该只在localStorage中存储指定字段', async () => {
      const userStore = useUserStore()

      userStore.token = 'test-token'
      userStore.userInfo = {
        id: '1',
        username: 'test',
        name: '测试',
        role: 'user',
        permissions: []
      }
      userStore.loading = true

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 检查localStorage中的数据
      const storedData = localStorageMock.getItem('user')
      expect(storedData).toBeTruthy()

      if (storedData) {
        const data = JSON.parse(storedData)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('userInfo')
        expect(data).not.toHaveProperty('loading')
      }
    })

    it('内容Store应该只在localStorage中存储用户偏好', async () => {
      const contentStore = useContentStore()

      contentStore.news.filters.category = 'tech'
      contentStore.news.limit = 25
      contentStore.news.loading = true
      contentStore.news.items = [{ id: 1 }]

      // 等待持久化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 检查localStorage中的数据
      const storedData = localStorageMock.getItem('content')
      expect(storedData).toBeTruthy()

      if (storedData) {
        const data = JSON.parse(storedData)
        expect(data.news).toHaveProperty('filters')
        expect(data.news).toHaveProperty('limit')
        expect(data.news).not.toHaveProperty('loading')
        expect(data.news).not.toHaveProperty('items')
      }
    })
  })

  describe('数据一致性验证', () => {
    it('应该正确处理无效的持久化数据', () => {
      // 设置无效的localStorage数据
      localStorageMock.setItem('user', '{"invalid": "data"}')

      // 创建新的pinia实例来测试恢复
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      // 创建store应该使用默认值而不是崩溃
      const userStore = useUserStore()
      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(userStore.loading).toBe(false)
    })

    it('应该处理部分缺失的持久化数据', () => {
      // 只设置token，不设置userInfo
      localStorageMock.setItem('user', '{"token": "partial-token"}')

      // 创建新的pinia实例来测试恢复
      const newPinia = createPinia()
      newPinia.use(piniaPluginPersistedstate)
      setActivePinia(newPinia)

      const userStore = useUserStore()
      expect(userStore.token).toBe('partial-token')
      expect(userStore.userInfo).toBeNull()
    })
  })
})
