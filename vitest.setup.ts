// vitest.setup.ts
import { beforeAll, afterAll, vi } from 'vitest'

// 定义自定义的mock类型供测试文件使用
export type CustomMock<T = any, Y extends any[] = any> = {
  (): T
  mockImplementation(fn: (...args: Y) => T): any
  mockReturnValue(value: T): any
  mockResolvedValue(value: T): any
  mockRejectedValue(value: any): any
  mockReturnedValue(): T
  getMockName(): string
  mock: {
    calls: Y[]
    results: { type: string; value: T }[]
    instances: any[]
    contexts: any[]
    lastCall: Y
  }
}

beforeAll(() => {
  // 模拟 window 对象
  vi.stubGlobal('window', {
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      state: null,
    },
    location: {
      pathname: '/',
      search: '',
      hash: '',
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })

  // 模拟 localStorage
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
})
