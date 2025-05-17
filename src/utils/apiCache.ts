import { CACHE_CONFIG } from '@/config'

interface CacheItem<T> {
  data: T
  timestamp: number
}

class ApiCache {
  private cache: Map<string, CacheItem<any>>

  constructor() {
    this.cache = new Map()
  }

  private generateKey(url: string, params?: Record<string, any>): string {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return `${url}${queryString}`
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_CONFIG.ttl
  }

  get<T>(url: string, params?: Record<string, any>): T | null {
    if (!CACHE_CONFIG.enabled) return null

    const key = this.generateKey(url, params)
    const item = this.cache.get(key)

    if (!item || this.isExpired(item.timestamp)) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set<T>(url: string, data: T, params?: Record<string, any>): void {
    if (!CACHE_CONFIG.enabled) return

    const key = this.generateKey(url, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  clearByUrl(url: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(url)) {
        this.cache.delete(key)
      }
    }
  }

  invalidateExpired(): void {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item.timestamp)) {
        this.cache.delete(key)
      }
    }
  }
}

export const apiCache = new ApiCache()
