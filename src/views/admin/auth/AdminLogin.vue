<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-section">
            <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
            <div class="title-section">
              <h1 class="main-title">管理后台</h1>
              <p class="sub-title">山东省大中小学思政课一体化中心平台</p>
            </div>
          </div>
        </div>

        <div class="login-form">
          <a-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            layout="vertical"
            @finish="handleLogin"
          >
            <a-form-item label="用户名" name="username">
              <a-input
                v-model:value="formData.username"
                size="large"
                placeholder="请输入用户名"
                :prefix="h(UserOutlined)"
              />
            </a-form-item>

            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="formData.password"
                size="large"
                placeholder="请输入密码"
                :prefix="h(LockOutlined)"
              />
            </a-form-item>

            <a-form-item>
              <div class="login-options">
                <a-checkbox v-model:checked="formData.rememberMe">
                  记住我
                </a-checkbox>
                <a href="#" class="forgot-password">忘记密码？</a>
              </div>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="loading"
              >
                登录
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { useUserStore } from "@/stores/user";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import type { Rule } from "ant-design-vue/es/form";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const formRef = ref();

// 表单数据
const formData = reactive({
  username: "",
  password: "",
  rememberMe: false,
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度应在3-20个字符之间",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6个字符", trigger: "blur" },
  ],
};

// 处理登录
const handleLogin = async () => {
  try {
    loading.value = true;
    await userStore.login({
      username: formData.username,
      password: formData.password,
      remember: formData.rememberMe,
    });
    message.success("登录成功");
    // 获取重定向路径或默认跳转到仪表板
    const redirectPath = (route.query.redirect as string) || "/admin/dashboard";
    router.push(redirectPath);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "登录失败，请检查用户名和密码";
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时的初始化
onMounted(() => {
  // 如果已经登录，直接跳转到仪表板
  if (userStore.isAuthenticated) {
    router.push("/admin/dashboard");
  }
});
</script>

<style scoped lang="scss">
.admin-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
}

.logo {
  width: 64px;
  height: 64px;
}

.title-section {
  text-align: center;
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-title {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.login-form {
  :deep(.ant-form-item-label) {
    font-weight: 500;
    color: #333;
  }

  :deep(.ant-input-affix-wrapper) {
    border-radius: 8px;
    border: 1px solid #e0e0e0;

    &:hover,
    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.ant-btn-primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    height: 48px;
    font-size: 16px;
    font-weight: 500;

    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    color: #5a6fd8;
    text-decoration: underline;
  }
}

@media (max-width: 480px) {
  .admin-login {
    padding: 16px;
  }

  .login-card {
    padding: 24px;
  }

  .main-title {
    font-size: 24px;
  }

  .sub-title {
    font-size: 12px;
  }
}
</style>
