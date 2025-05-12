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

      <div class="login-form">
        <a-alert
          v-if="loginError"
          type="error"
          :message="loginError"
          banner
          closable
          @close="loginError = ''"
          class="login-alert"
        />

        <a-form
          :model="loginForm"
          @finish="handleLogin"
          :rules="loginRules"
          ref="loginFormRef"
          layout="vertical"
        >
          <a-form-item name="username" label="用户名">
            <a-input
              v-model:value="loginForm.username"
              size="large"
              placeholder="请输入用户名"
              :prefix="UserOutlined"
              autocomplete="username"
            />
          </a-form-item>

          <a-form-item name="password" label="密码">
            <a-input-password
              v-model:value="loginForm.password"
              size="large"
              placeholder="请输入密码"
              :prefix="LockOutlined"
              autocomplete="current-password"
            />
          </a-form-item>

          <a-form-item>
            <a-row :gutter="8">
              <a-col :span="16">
                <a-input
                  v-model:value="loginForm.captcha"
                  size="large"
                  placeholder="请输入验证码"
                  :prefix="SafetyCertificateOutlined"
                />
              </a-col>
              <a-col :span="8">
                <div class="captcha-container" @click="refreshCaptcha">
                  <img :src="captchaUrl" alt="验证码" class="captcha-image" />
                  <div class="captcha-refresh">点击刷新</div>
                </div>
              </a-col>
            </a-row>
          </a-form-item>

          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              block
            >
              登录
            </a-button>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="rememberMe">记住我</a-checkbox>
            <a class="login-form-forgot" href="">忘记密码?</a>
          </a-form-item>
        </a-form>
      </div>

      <div class="login-footer">
        <p>© {{ currentYear }} 山东省大中小学思政课一体化指导中心</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useUserStore } from "@/stores/user";

export default {
  name: "AdminLogin",

  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const loginFormRef = ref(null);
    const loading = ref(false);
    const loginError = ref("");
    const rememberMe = ref(false);
    const captchaUrl = ref("/api/auth/captcha?" + Date.now());

    const currentYear = computed(() => new Date().getFullYear());

    const loginForm = reactive({
      username: "",
      password: "",
      captcha: "",
    });

    // 表单验证规则
    const loginRules = {
      username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
      password: [
        { required: true, message: "请输入密码", trigger: "blur" },
        { min: 6, message: "密码长度不能少于6个字符", trigger: "blur" },
      ],
      captcha: [
        { required: true, message: "请输入验证码", trigger: "blur" },
        { len: 4, message: "请输入4位验证码", trigger: "blur" },
      ],
    };

    // 刷新验证码
    const refreshCaptcha = () => {
      captchaUrl.value = "/api/auth/captcha?" + Date.now();
      loginForm.captcha = "";
    };

    // 处理登录操作
    const handleLogin = async () => {
      try {
        loading.value = true;
        loginError.value = "";

        // 调用登录API
        const success = await userStore.login({
          username: loginForm.username,
          password: loginForm.password,
          captcha: loginForm.captcha,
          remember: rememberMe.value,
        });

        if (success) {
          message.success("登录成功，正在跳转...");
          router.push({ name: "AdminDashboard" });
        }
      } catch (error) {
        loginError.value = error.message || "登录失败，请检查您的用户名和密码";
        refreshCaptcha();
      } finally {
        loading.value = false;
      }
    };

    // 检查本地存储的用户名
    onMounted(() => {
      const savedUsername = localStorage.getItem("admin_username");
      if (savedUsername) {
        loginForm.username = savedUsername;
        rememberMe.value = true;
      }
    });

    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      loginError,
      rememberMe,
      captchaUrl,
      currentYear,
      refreshCaptcha,
      handleLogin,
      // 图标组件
      UserOutlined,
      LockOutlined,
      SafetyCertificateOutlined,
    };
  },
};
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  background-image: url("/admin-bg.jpg");
  background-size: cover;
  background-position: center;
}

.login-container {
  width: 400px;
  padding: 40px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.login-logo {
  width: 80px;
  height: auto;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin: 0;
}

.login-form {
  margin-top: 24px;
}

.login-alert {
  margin-bottom: 24px;
}

.login-form-forgot {
  float: right;
  color: #1890ff;
}

.captcha-container {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.captcha-image {
  width: 100%;
  height: auto;
}

.captcha-refresh {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  text-align: center;
  padding: 2px;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.captcha-container:hover .captcha-refresh {
  transform: translateY(0);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
