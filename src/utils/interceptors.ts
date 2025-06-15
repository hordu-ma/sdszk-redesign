import type { AxiosInstance } from 'axios'
import { useUserStore } from '../stores/user'
import { handleApiError } from './apiErrorHandler'

// 保存 store 实例
let userStore: ReturnType<typeof useUserStore>

// 初始化 store
const initStore = () => {
  if (!userStore) {
    userStore = useUserStore()
  }
  return userStore
}

export const setupInterceptors = (axios: AxiosInstance) => {
  // 请求拦截器
  axios.interceptors.request.use(
    config => {
      const store = initStore()
      // 如果有token，添加到请求头
      if (store.token) {
        config.headers.Authorization = `Bearer ${store.token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  axios.interceptors.response.use(
    response => {
      // 转换后端响应格式以匹配前端期望
      if (response.data && response.data.status) {
        // 统一转换 status 为 success 字段
        response.data.success = response.data.status === 'success'

        // 保持向后兼容性，同时保留 status 字段
        // response.data.status 保持不变
      }
      return response
    },
    error => {
      return handleApiError(error)
    }
  )

  return axios
}
