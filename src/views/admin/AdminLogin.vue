<!-- AdminLogin.vue - 管理登录页面 -->
<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-header">
        <img
          src="@/assets/images/logo.png"
          alt="山东省大中小学思政课一体化指导中心"
          class="login-logo"
        />
        <h1 class="login-title">内容管理系统</h1>
      </div>

      <div class="login-box">
        <el-alert v-if="loginError" :title="loginError" type="error" show-icon class="mb-4" />

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" size="large" placeholder="请输入用户名">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              placeholder="请输入密码"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-row justify="space-between" align="middle">
              <el-col>
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              </el-col>
              <el-col class="text-right">
                <el-tooltip content="如果忘记密码，请联系系统管理员重置" placement="top">
                  <el-link type="primary" @click.prevent>忘记密码?</el-link>
                </el-tooltip>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="login-footer">
        <p>© {{ currentYear }} 山东省大中小学思政课一体化指导中心</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

export default {
  name: 'AdminLogin',

  components: {
    User,
    Lock,
  },

  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const loginError = ref('')
    const rememberMe = ref(false)

    const currentYear = computed(() => new Date().getFullYear())

    const loginForm = reactive({
      username: '',
      password: '',
    })

    // 表单验证规则
    const loginRules = {
      username: [
        {
          required: true,
          message: '请输入用户名',
          trigger: ['blur', 'change'],
        },
      ],
      password: [
        {
          required: true,
          message: '请输入密码',
          trigger: ['blur', 'change'],
        },
        {
          min: 6,
          message: '密码长度不能少于6个字符',
          trigger: 'blur',
        },
      ],
    }

    // 处理登录操作
    const handleLogin = async () => {
      if (!loginFormRef.value) return

      try {
        await loginFormRef.value.validate()
        loading.value = true
        loginError.value = ''

        console.log('提交登录请求', {
          username: loginForm.username,
          password: '******', // 不记录实际密码
        })
        const response = await api.post('/api/auth/login', {
          username: loginForm.username,
          password: loginForm.password,
        })

        // 登录成功后的处理
        console.log('登录响应状态码:', response.status)
        console.log('登录响应头:', response.headers)
        console.log('登录响应数据:', response.data)

        // 检查响应格式，适应不同的后端返回结构
        const responseData = response.data

        // 判断登录是否成功的逻辑
        const isSuccess =
          responseData.status === 'success' ||
          ((responseData.code === 200 || response.status === 200) && !responseData.error)

        if (isSuccess) {
          console.log('登录成功，处理响应数据')

          // 获取token
          const token = responseData.token

          if (token) {
            console.log('获取到token，保存到localStorage')
            localStorage.setItem('token', token)
            // 同时保存到store中
            userStore.setToken(token)
          } else {
            console.warn('未找到token，但登录成功')
          }

          // 如果选择记住用户名，则保存
          if (rememberMe.value) {
            localStorage.setItem('username', loginForm.username)
          }

          // 更新用户信息
          const userData = responseData.data?.user

          if (userData) {
            console.log('获取到用户数据，更新用户信息')
            await userStore.setUserInfo(userData)
          } else {
            throw new Error('未获取到用户信息')
          }

          // 跳转到管理面板
          await router.push('/admin/dashboard')
          ElMessage.success(responseData.message || '登录成功')
        } else {
          console.error('登录失败，响应数据:', responseData)
          throw new Error(responseData.message || responseData.msg || '登录失败')
        }
      } catch (error) {
        console.error('登录失败详细信息:', error)

        // 详细记录错误信息，帮助调试
        if (error.response) {
          console.error('错误响应状态:', error.response.status)
          console.error('错误响应数据:', error.response.data)
        }

        // 处理各种可能的错误格式
        if (error.response?.data?.message) {
          // 后端返回了标准错误消息
          loginError.value = error.response.data.message
        } else if (error.response?.data?.msg) {
          // 有些API使用msg而不是message
          loginError.value = error.response.data.msg
        } else if (error.response?.data?.error) {
          // 有些API在error字段中返回错误信息
          loginError.value =
            typeof error.response.data.error === 'string'
              ? error.response.data.error
              : '用户名或密码错误'
        } else if (error.message && error.message !== 'Network Error') {
          // 使用Error对象的message
          loginError.value = error.message
        } else {
          // 默认错误信息
          loginError.value = '用户名或密码错误，请检查后重试'
        }

        // 清空密码
        loginForm.password = ''
      } finally {
        loading.value = false
      }
    }

    // 检查本地存储的用户名
    onMounted(() => {
      // 如果记住了用户名，自动填充
      const savedUsername = localStorage.getItem('username')
      if (savedUsername) {
        loginForm.username = savedUsername
        rememberMe.value = true
      }
    })

    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      loginError,
      rememberMe,
      currentYear,
      handleLogin,
    }
  },
}
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  background-image: linear-gradient(135deg, #409eff 0%, #a0cfff 100%);
}

.login-container {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  width: 64px;
  height: auto;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  color: #409eff;
  margin: 0;
}

.login-box {
  margin-bottom: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-right {
  text-align: right;
}

.login-button {
  width: 100%;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
