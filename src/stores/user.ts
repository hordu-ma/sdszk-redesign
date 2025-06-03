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

    // 权限转换函数：将后端嵌套对象格式转换为前端字符串数组格式
    function transformPermissions(backendPermissions: any): string[] {
      const permissions: string[] = []

      // 调试输出权限对象
      console.log('接收到的原始权限对象:', backendPermissions)

      if (!backendPermissions || typeof backendPermissions !== 'object') {
        return permissions
      }

      // 遍历权限对象，将嵌套结构转换为字符串数组
      for (const [module, actions] of Object.entries(backendPermissions)) {
        if (actions && typeof actions === 'object') {
          for (const [action, hasPermission] of Object.entries(
            actions as Record<string, boolean>
          )) {
            if (hasPermission === true) {
              // 特殊处理 settings 模块权限，确保 settings:read 和 settings:update 匹配路由中的要求
              const permissionKey = `${module}:${action}`
              permissions.push(permissionKey)

              // 为管理员添加系统设置权限
              if (module === 'settings' && action === 'update') {
                permissions.push('system:setting')
              }
            }
          }
        }
      }

      return permissions
    }

    // 登录方法
    async function login(payload: LoginPayload): Promise<boolean> {
      try {
        loading.value = true
        console.log('正在发送登录请求到:', '/api/auth/login', '携带数据:', payload)
        const response = await api.post('/api/auth/login', payload)
        console.log('登录响应:', response.data)

        // 确保检查response.data是对象且有status属性
        if (
          typeof response.data === 'object' &&
          response.data !== null &&
          response.data.status === 'success'
        ) {
          const authToken = response.data.token
          const userData = response.data.data?.user // 获取用户数据

          if (authToken && userData) {
            token.value = authToken

            // 转换权限格式
            const transformedPermissions = transformPermissions(userData.permissions)
            const userWithTransformedPermissions = {
              ...userData,
              permissions: transformedPermissions,
            }

            userInfo.value = userWithTransformedPermissions
            console.log('转换后的权限:', transformedPermissions)

            // 如果选择记住登录状态，保存token
            if (payload.remember) {
              localStorage.setItem('token', authToken)
            }

            // 设置全局请求头
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

            return true
          }
        }

        // 登录失败时抛出错误
        console.error('登录请求成功但返回失败状态:', response.data)
        throw new Error(response.data.message || '登录失败，请检查用户名和密码')
      } catch (error: any) {
        console.error('登录错误:', error)
        console.error('错误详情:', error.response?.data || '无响应数据')
        // 重新抛出错误，让组件能够捕获
        throw new Error(
          error.response?.data?.message || error.message || '登录失败，请检查网络连接'
        )
      } finally {
        loading.value = false
      }
    }

    // 登出方法
    async function logout(): Promise<void> {
      try {
        await api.post('/api/auth/logout')
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
      console.log(`检查权限: ${permission}，当前权限列表:`, userPermissions.value)
      console.log(`当前用户角色: ${userInfo.value?.role}`)

      // 如果是管理员，始终有权限
      if (userInfo.value?.role === 'admin') {
        console.log('管理员具有所有权限，返回 true')
        return true
      }

      return userPermissions.value.includes(permission)
    }

    // 初始化用户信息
    async function initUserInfo(): Promise<void> {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        token.value = savedToken
        // 设置全局请求头
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
        try {
          const { data } = await api.get('/api/auth/me')
          if (data.status === 'success') {
            const userData = data.data.user

            // 转换权限格式
            const transformedPermissions = transformPermissions(userData.permissions)
            const userWithTransformedPermissions = {
              ...userData,
              permissions: transformedPermissions,
            }

            userInfo.value = userWithTransformedPermissions
            console.log('初始化时转换后的权限:', transformedPermissions)
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
      initUserInfo,
      transformPermissions,
    }
  },
  {
    persist: true,
  }
)
