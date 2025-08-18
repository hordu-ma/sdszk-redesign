import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore, type UserInfo } from '@/stores/user'
import api from '@/utils/api'

// Mock the api module
vi.mock('@/utils/api', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {} as Record<string, string>,
      },
    },
  }
  
  return {
    default: mockAxiosInstance,
    __esModule: true,
  }
})

describe('useUserStore', () => {
  beforeEach(() => {
    // 创建一个新的 Pinia 实例，并将其设置为活动实例
    setActivePinia(createPinia())
    
    // 清除 localStorage
    localStorage.clear()
    
    // 重置所有 mocks
    vi.resetAllMocks()
  })

  afterEach(() => {
    // 清除所有计时器
    vi.clearAllTimers()
  })

  it('应该初始化时没有用户信息和token', () => {
    const store = useUserStore()
    
    expect(store.token).toBeNull()
    expect(store.userInfo).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isAdmin).toBe(false)
    expect(store.isEditor).toBe(false)
  })

  it('应该能够设置token', () => {
    const store = useUserStore()
    const token = 'test-token'
    
    store.setToken(token)
    
    expect(store.token).toBe(token)
    expect(store.isAuthenticated).toBe(true)
  })

  it('应该能够设置用户信息', () => {
    const store = useUserStore()
    const userInfo: UserInfo = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      role: 'user',
      permissions: ['news:read'],
    }
    
    store.setUserInfo(userInfo)
    
    expect(store.userInfo).toEqual(userInfo)
  })

  it('应该能够正确转换权限', () => {
    const store = useUserStore()
    
    // 测试后端权限对象
    const backendPermissions = {
      news: {
        read: true,
        create: false,
        update: true,
        delete: false,
        manage: true, // manage权限应该包含所有操作权限
      },
      settings: {
        read: true,
        update: true, // settings:update应该添加system:setting权限
      },
    }
    
    // @ts-ignore - 访问私有方法用于测试
    const transformedPermissions = store.transformPermissions(backendPermissions)
    
    expect(transformedPermissions).toContain('news:read')
    expect(transformedPermissions).toContain('news:update')
    expect(transformedPermissions).toContain('news:manage')
    // manage权限应该包含所有操作权限
    expect(transformedPermissions).toContain('news:create')
    expect(transformedPermissions).toContain('news:delete')
    // settings:update应该添加system:setting权限
    expect(transformedPermissions).toContain('system:setting')
    // settings:read和settings:update也应该在权限列表中
    expect(transformedPermissions).toContain('settings:read')
    expect(transformedPermissions).toContain('settings:update')
  })

  it('应该能够正确检查权限', () => {
    const store = useUserStore()
    
    // 设置一个有特定权限的用户
    store.setUserInfo({
      id: '1',
      username: 'testuser',
      name: 'Test User',
      role: 'user',
      permissions: ['news:read', 'resources:create'],
    })
    
    expect(store.hasPermission('news:read')).toBe(true)
    expect(store.hasPermission('resources:create')).toBe(true)
    expect(store.hasPermission('news:create')).toBe(false)
  })

  it('管理员应该拥有所有权限', () => {
    const store = useUserStore()
    
    // 设置一个管理员用户
    store.setUserInfo({
      id: '1',
      username: 'admin',
      name: 'Admin User',
      role: 'admin',
      permissions: [], // 管理员权限不依赖于具体权限列表
    })
    
    expect(store.hasPermission('news:read')).toBe(true)
    expect(store.hasPermission('resources:create')).toBe(true)
    expect(store.hasPermission('any:permission')).toBe(true)
  })

  it('应该能够成功登录', async () => {
    const store = useUserStore()
    const loginPayload = {
      username: 'testuser',
      password: 'password123',
    }
    
    // Mock API响应
    const mockResponse = {
      data: {
        status: 'success',
        token: 'jwt-token',
        data: {
          user: {
            id: '1',
            username: 'testuser',
            name: 'Test User',
            role: 'user',
            permissions: {
              news: { read: true },
            },
          },
        },
      },
    }
    
    api.post.mockResolvedValueOnce(mockResponse)
    
    const result = await store.login(loginPayload)
    
    expect(result).toBe(true)
    expect(store.token).toBe('jwt-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.userInfo?.username).toBe('testuser')
    // 检查权限是否已转换
    expect(store.userInfo?.permissions).toContain('news:read')
    // 检查Authorization header是否已设置
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer jwt-token')
  })

  it('应该在登录失败时抛出错误', async () => {
    const store = useUserStore()
    const loginPayload = {
      username: 'testuser',
      password: 'wrongpassword',
    }
    
    // Mock API错误响应
    const mockError = {
      response: {
        data: {
          message: '用户名或密码错误',
        },
      },
    }
    
    api.post.mockRejectedValueOnce(mockError)
    
    await expect(store.login(loginPayload)).rejects.toThrow('用户名或密码错误')
  })

  it('应该能够成功登出', async () => {
    const store = useUserStore()
    
    // 先登录
    store.setToken('jwt-token')
    store.setUserInfo({
      id: '1',
      username: 'testuser',
      name: 'Test User',
      role: 'user',
      permissions: ['news:read'],
    })
    // @ts-ignore
    api.defaults.headers.common['Authorization'] = 'Bearer jwt-token'
    
    // Mock登出API响应
    const mockResponse = {
      data: {
        status: 'success',
        message: '登出成功',
      },
    }
    
    api.post.mockResolvedValueOnce(mockResponse)
    
    await store.logout()
    
    expect(store.token).toBeNull()
    expect(store.userInfo).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(api.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('应该能够初始化用户信息', async () => {
    // 模拟localStorage中存在token
    localStorage.setItem('token', 'jwt-token')
    
    const store = useUserStore()
    
    // Mock API响应
    const mockResponse = {
      data: {
        status: 'success',
        data: {
          user: {
            id: '1',
            username: 'testuser',
            name: 'Test User',
            role: 'user',
            permissions: {
              news: { read: true },
            },
          },
        },
      },
    }
    
    api.get.mockResolvedValueOnce(mockResponse)
    
    await store.initUserInfo()
    
    expect(store.token).toBe('jwt-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.userInfo?.username).toBe('testuser')
    // 检查权限是否已转换
    expect(store.userInfo?.permissions).toContain('news:read')
    // 检查Authorization header是否已设置
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer jwt-token')
  })
})