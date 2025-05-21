import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

interface UserInfo {
  id: string
  username: string
  name: string
  avatar?: string
  email?: string
  role: 'admin' | 'editor' | 'user'
  permissions: string[]
}

interface LoginPayload {
  username: string
  password: string
  remember?: boolean
}

interface RegisterPayload {
  username: string
  password: string
  email: string
  phone: string
  verificationCode: string
}

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string | null>(null)
    const userInfo = ref<UserInfo | null>(null)
    const loading = ref(false)

    // 计算属性
    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => userInfo.value?.role === 'admin')
    const isEditor = computed(() => userInfo.value?.role === 'editor' || isAdmin.value)
    const userPermissions = computed(() => userInfo.value?.permissions || [])

    // 设置token
    function setToken(newToken: string) {
      token.value = newToken
    }

    // 设置用户信息
    function setUserInfo(user: UserInfo) {
      userInfo.value = user
    }

    // 登录方法
    async function login(payload: LoginPayload): Promise<boolean> {
      try {
        loading.value = true
        const response = await api.post('/api/auth/login', payload)
        console.log('登录响应:', response)

        if (response.data?.status === 'success') {
          const authToken = response.data.token
          const userData = response.data.data.user

          if (authToken && userData) {
            token.value = authToken
            userInfo.value = userData

            // 如果选择记住登录状态，保存token
            if (payload.remember) {
              localStorage.setItem('token', authToken)
            }

            // 设置全局请求头
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

            return true
          }
        }
        return false
      } catch (error) {
        console.error('登录错误:', error)
        return false
      } finally {
        loading.value = false
      }
    }

    // 登出方法
    async function logout(): Promise<void> {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('登出错误:', error)
      } finally {
        token.value = null
        userInfo.value = null
        localStorage.removeItem('token')
      }
    }

    // 注册方法
    async function register(payload: RegisterPayload): Promise<boolean> {
      try {
        loading.value = true
        const response = await api.post('/api/auth/register', payload)

        if (response.data?.status === 'success') {
          return true
        }
        return false
      } catch (error) {
        console.error('注册失败:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    // 发送验证码
    async function sendVerificationCode(phone: string): Promise<boolean> {
      try {
        const response = await api.post('/api/auth/send-code', { phone })
        return response.data?.status === 'success'
      } catch (error) {
        console.error('发送验证码失败:', error)
        throw error
      }
    }

    // 检查权限
    function hasPermission(permission: string): boolean {
      return userPermissions.value.includes(permission)
    }

    // 初始化用户信息
    async function initUserInfo(): Promise<void> {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        token.value = savedToken
        try {
          const { data } = await api.get('/api/auth/me')
          if (data.status === 'success') {
            userInfo.value = data.data.user
          } else {
            throw new Error('获取用户信息失败')
          }
        } catch (error) {
          console.error('初始化用户信息失败:', error)
          await logout()
        }
      }
    }

    return {
      token,
      userInfo,
      loading,
      isAuthenticated,
      isAdmin,
      isEditor,
      userPermissions,
      login,
      logout,
      register,
      sendVerificationCode,
      setUserInfo,
      setToken,
      hasPermission,
    }
  },
  {
    persist: true,
  }
)
