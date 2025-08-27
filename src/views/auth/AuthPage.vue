<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <div class="auth-header">
        <img
src="@/assets/images/logo.png" alt="中心logo" class="auth-logo" />
        <h2>{{ isLogin ? "用户登录" : "用户注册" }}</h2>
      </div>

      <el-tabs v-model="activeTab"
@tab-click="handleTabClick">
        <!-- 登录面板 -->
        <el-tab-pane label="登录"
name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            class="auth-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                :prefix-icon="User"
                placeholder="请输入用户名/手机号/邮箱"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                :prefix-icon="Lock"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="rememberMe"> 记住我 </el-checkbox>
              <el-button link
type="primary" @click="handleForgotPassword">
                忘记密码？
              </el-button>
            </div>

            <el-button
              type="primary"
              class="submit-btn"
              :loading="loginLoading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 注册面板 -->
        <el-tab-pane label="注册"
name="register">
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-width="0"
            class="auth-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                :prefix-icon="User"
                placeholder="请设置用户名（4-16位字符）"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                :prefix-icon="Lock"
                placeholder="请设置密码（8-20位字符）"
                show-password
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                :prefix-icon="Lock"
                placeholder="请确认密码"
                show-password
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                :prefix-icon="Message"
                placeholder="请输入邮箱"
              />
            </el-form-item>

            <el-form-item prop="phone">
              <el-input
                v-model="registerForm.phone"
                :prefix-icon="Phone"
                placeholder="请输入手机号"
              >
                <template #append>
                  <el-button
                    :disabled="!!countdown || !isPhoneValid"
                    :loading="sendingCode"
                    @click="handleSendVerificationCode"
                  >
                    {{ countdown ? `${countdown}s` : "获取验证码" }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="verificationCode">
              <el-input
                v-model="registerForm.verificationCode"
                :prefix-icon="Key"
                placeholder="请输入验证码"
                maxlength="6"
              />
            </el-form-item>

            <el-button
              type="primary"
              class="submit-btn"
              :loading="registerLoading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { User, Lock, Message, Phone, Key } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";

// 路由实例
const router = useRouter();
const userStore = useUserStore();

// 表单状态
const activeTab = ref("login");
const isLogin = computed(() => activeTab.value === "login");
const rememberMe = ref(false);
const loginLoading = ref(false);
const registerLoading = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);

// 表单引用
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

// 登录表单数据
const loginForm = ref({
  username: "",
  password: "",
});

// 注册表单数据
const registerForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
  verificationCode: "",
});

// 登录表单验证规则
const loginRules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

// 注册表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 4, max: 16, message: "用户名长度为4-16位字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 20, message: "密码长度为8-20位字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== registerForm.value.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号格式",
      trigger: "blur",
    },
  ],
  verificationCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { len: 6, message: "验证码为6位数字", trigger: "blur" },
  ],
};

// 计算手机号是否有效
const isPhoneValid = computed(() => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(registerForm.value.phone);
});

// 切换标签时重置表单
const handleTabClick = () => {
  loginForm.value = {
    username: "",
    password: "",
  };
  registerForm.value = {
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    verificationCode: "",
  };
};

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    const valid = await loginFormRef.value.validate();
    if (valid) {
      loginLoading.value = true;
      const success = await userStore.login({
        username: loginForm.value.username,
        password: loginForm.value.password,
        remember: rememberMe.value,
      });

      if (success) {
        ElMessage.success("登录成功");
        router.push("/");
      } else {
        ElMessage.error("登录失败，请检查用户名和密码");
      }
    }
  } catch (error) {
    console.error("登录失败:", error);
    ElMessage.error("登录失败，请重试");
  } finally {
    loginLoading.value = false;
  }
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    const valid = await registerFormRef.value.validate();
    if (valid) {
      registerLoading.value = true;
      const success = await userStore.register({
        username: registerForm.value.username,
        password: registerForm.value.password,
        email: registerForm.value.email,
        phone: registerForm.value.phone,
        verificationCode: registerForm.value.verificationCode,
      });

      if (success) {
        ElMessage.success("注册成功");
        activeTab.value = "login"; // 注册成功后切换到登录面板
      } else {
        ElMessage.error("注册失败，请重试");
      }
    }
  } catch (error) {
    console.error("注册失败:", error);
    ElMessage.error("注册失败，请重试");
  } finally {
    registerLoading.value = false;
  }
};

// 处理发送验证码
const handleSendVerificationCode = async () => {
  if (countdown.value > 0 || !isPhoneValid.value) return;

  try {
    sendingCode.value = true;
    const success = await userStore.sendVerificationCode(
      registerForm.value.phone,
    );

    if (success) {
      ElMessage.success("验证码已发送");
      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      ElMessage.error("发送验证码失败，请重试");
    }
  } catch (error) {
    console.error("发送验证码失败:", error);
    ElMessage.error("发送验证码失败，请重试");
  } finally {
    sendingCode.value = false;
  }
};

// 处理忘记密码
const handleForgotPassword = () => {
  // TODO: 实现忘记密码逻辑
  ElMessage.info("忘记密码功能开发中");
};
</script>

<style scoped>
.auth-container {
  min-height: calc(100vh - 120px);
  padding: 40px 20px;
}

.auth-card {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

@media screen and (max-width: 768px) {
  .auth-container {
    padding: 20px 16px;
    min-height: calc(100vh - 80px);
  }

  .auth-card {
    padding: 20px 16px;
  }

  .auth-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
