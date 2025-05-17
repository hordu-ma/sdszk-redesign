import { NewsApi } from './modules/news'
import { ResourceApi } from './modules/resources'

// API 实例
export const newsApi = new NewsApi()
export const resourceApi = new ResourceApi()

// 导出类型
export type * from './types'
export type * from './modules/news'
export type * from './modules/resources'
