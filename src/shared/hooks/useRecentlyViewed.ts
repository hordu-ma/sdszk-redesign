import { useStorage } from '@vueuse/core'
import type { Ref } from 'vue'

interface HasId {
  id: string
  [key: string]: any
}

export function useRecentlyViewed<T extends HasId>(key: string, maxItems: number = 10) {
  const items = useStorage<T[]>(key, [])

  const addItem = (item: T) => {
    const index = items.value.findIndex(existing => existing.id === item.id)
    if (index > -1) {
      items.value.splice(index, 1)
    }
    items.value.unshift(item)
    if (items.value.length > maxItems) {
      items.value.pop()
    }
  }

  const removeItem = (id: string) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  const clearItems = () => {
    items.value = []
  }

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  }
}
