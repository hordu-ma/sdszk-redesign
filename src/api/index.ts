import { NewsApi } from './modules/news/index'
import { ResourceApi } from './modules/resources/index'
import { ResourceCategoryApi } from './modules/resourceCategory/index'

// API 实例
export const newsApi = new NewsApi()
export const resourceApi = new ResourceApi()
export const resourceCategoryApi = new ResourceCategoryApi()

// 导出类型
export type * from './types'
export type * from './modules/news/index'
export type * from './modules/resources/index'
export type * from './modules/resourceCategory/index'
