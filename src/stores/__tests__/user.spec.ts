import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import api from '../../utils/api'

// Mock API
vi.mock('../../utils/api', () => ({
  default: {
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useUserStore()
      expect(store.token).toBeNull()
      expect(store.userInfo).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.isAdmin).toBe(false)
      expect(store.isEditor).toBe(false)
      expect(store.userPermissions).toEqual([])
    })
  })

  describe('登录功能', () => {
    const mockLoginPayload = {
      username: 'testuser',
      password: 'password123',
      remember: true,
    }

    const mockSuccessResponse = {
      data: {
        status: 'success',
        token: 'mock-token',
        data: {
          user: {
            id: '1',
            username: 'testuser',
            name: 'Test User',
            role: 'user',
            permissions: ['read'],
          },
        },
      },
    }

    it('成功登录应该正确设置状态', async () => {
      const store = useUserStore()
      vi.mocked(api.post).mockResolvedValueOnce(mockSuccessResponse)

      const result = await store.login(mockLoginPayload)

      expect(result).toBe(true)
      expect(store.token).toBe('mock-token')
      expect(store.userInfo).toEqual(mockSuccessResponse.data.data.user)
      expect(store.isAuthenticated).toBe(true)
      expect(localStorage.getItem('token')).toBe('mock-token')
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-token')
    })

    it('登录失败应该保持初始状态', async () => {
      const store = useUserStore()
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Login failed'))

      const result = await store.login(mockLoginPayload)

      expect(result).toBe(false)
      expect(store.token).toBeNull()
      expect(store.userInfo).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('登出功能', () => {
    it('应该清除所有用户状态', async () => {
      const store = useUserStore()
      store.setToken('test-token')
      store.setUserInfo({
        id: '1',
        username: 'testuser',
        name: 'Test User',
        role: 'user',
        permissions: ['read'],
      })
      localStorage.setItem('token', 'test-token')

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.userInfo).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
    })
  })
})
