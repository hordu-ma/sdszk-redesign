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
        <el-alert
          v-if="loginError"
          :title="loginError"
          type="error"
          show-icon
          class="mb-4"
        />

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              size="large"
              placeholder="请输入用户名"
            >
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

          <el-form-item prop="captcha">
            <el-row :gutter="8">
              <el-col :span="16">
                <el-input
                  v-model="loginForm.captcha"
                  size="large"
                  placeholder="请输入验证码"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="8">
                <div class="captcha-container" @click="refreshCaptcha">
                  <img :src="captchaUrl" alt="验证码" class="captcha-image" />
                  <div class="captcha-refresh">点击刷新</div>
                </div>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-row justify="space-between" align="middle">
              <el-col>
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              </el-col>
              <el-col class="text-right">
                <el-tooltip
                  content="如果忘记密码，请联系系统管理员重置"
                  placement="top"
                >
                  <el-link type="primary" @click.prevent>忘记密码?</el-link>
                </el-tooltip>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              {{ loading ? "登录中..." : "登录" }}
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
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { User, Lock, Key } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import api from "@/utils/api";
import axios from "axios";

export default {
  name: "AdminLogin",

  components: {
    User,
    Lock,
    Key,
  },

  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const loginFormRef = ref(null);
    const loading = ref(false);
    const loginError = ref("");
    const rememberMe = ref(false);
    const captchaUrl = ref(
      `${api.defaults.baseURL}/api/auth/captcha?t=${Date.now()}`
    );

    const currentYear = computed(() => new Date().getFullYear());

    const loginForm = reactive({
      username: "",
      password: "",
      captcha: "",
    });

    // 表单验证规则
    const loginRules = {
      username: [
        {
          required: true,
          message: "请输入用户名",
          trigger: ["blur", "change"],
        },
      ],
      password: [
        {
          required: true,
          message: "请输入密码",
          trigger: ["blur", "change"],
        },
        {
          min: 6,
          message: "密码长度不能少于6个字符",
          trigger: "blur",
        },
      ],
      captcha: [
        {
          required: true,
          message: "请输入验证码",
          trigger: ["blur", "change"],
        },
      ],
    };

    // 刷新验证码
    const refreshCaptcha = async () => {
      try {
        const timestamp = Date.now();

        console.log("开始请求验证码");

        // 清空现有验证码输入
        loginForm.captcha = "";

        // 使用与登录相同的axios实例，确保共享相同的cookie
        const response = await api.get(`/api/auth/captcha`, {
          responseType: "arraybuffer", // 重要：表明我们需要二进制数据
          params: { t: timestamp },
        });

        console.log("验证码请求成功:", {
          status: response.status,
          headers: response.headers,
          dataType: typeof response.data,
          dataLength: response.data.byteLength,
        });

        // 使用Blob和URL.createObjectURL处理二进制数据
        const blob = new Blob([response.data], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        // 清理之前的blob URLs
        cleanupBlobUrls();

        // 保存新的blob URL到列表
        blobUrls.value.push(url);

        // 设置图片src为blob URL
        captchaUrl.value = url;

        console.log("验证码URL已设置:", url);

        // 记录图片加载完成
        console.log(
          "验证码图片URL设置完成:",
          captchaUrl.value.substring(0, 50) + "..."
        );

        // 清空验证码输入
        loginForm.captcha = "";

        // 让输入框获得焦点
        nextTick(() => {
          const captchaInput = document.querySelector('input[name="captcha"]');
          if (captchaInput) captchaInput.focus();
        });

        console.log("验证码已成功加载");
      } catch (error) {
        console.error("刷新验证码失败:", error);
        console.error("错误详情:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        ElMessage.error("验证码加载失败，请刷新页面或稍后重试");

        // 尝试使用备用方法加载验证码
        try {
          setTimeout(() => {
            captchaUrl.value = `${
              api.defaults.baseURL
            }/api/auth/captcha?t=${Date.now()}`;
            console.log("使用备用方法加载验证码");
          }, 500);
        } catch (e) {
          console.error("备用方法也失败了:", e);
        }
      }
    };

    // 处理登录操作
    const handleLogin = async () => {
      if (!loginFormRef.value) return;

      try {
        await loginFormRef.value.validate();
        loading.value = true;
        loginError.value = "";

        console.log("提交登录请求");
        const response = await api.post("/api/auth/login", {
          username: loginForm.username,
          password: loginForm.password,
          captcha: loginForm.captcha, // 服务端会将其转为小写进行比较
        });

        // 登录成功后的处理
        console.log("登录响应:", response);
        if (response.data && response.data.token) {
          // 保存token
          localStorage.setItem("token", response.data.token);

          // 如果选择记住用户名，则保存
          if (rememberMe.value) {
            localStorage.setItem("username", loginForm.username);
          }

          // 更新用户信息
          if (response.data.data && response.data.data.user) {
            await userStore.setUserInfo(response.data.data.user);
          }

          // 跳转到管理面板
          await router.push("/admin/dashboard");
          ElMessage.success("登录成功");
        } else {
          throw new Error("登录响应格式错误");
        }
      } catch (error) {
        console.error("登录失败:", error);
        // 根据错误类型显示不同的错误信息
        const errorData = error.response?.data;
        const errorMessage = errorData?.message;
        const errorCode = errorData?.code;

        if (
          errorCode === "CAPTCHA_EXPIRED" ||
          errorMessage?.includes("验证码已失效") ||
          errorMessage?.includes("验证码已过期")
        ) {
          loginError.value = errorMessage || "验证码已失效，请刷新";
          // 自动刷新验证码并聚焦
          refreshCaptcha();
        } else if (errorMessage?.includes("验证码")) {
          loginError.value = errorMessage;
          // 清空验证码输入，保留其他信息
          loginForm.captcha = "";
          // 自动聚焦到验证码输入框
          nextTick(() => {
            const captchaInput = document.querySelector(
              'input[name="captcha"]'
            );
            if (captchaInput) captchaInput.focus();
          });
        } else if (errorMessage?.includes("密码")) {
          loginError.value = errorMessage;
          // 清空密码和验证码
          loginForm.password = "";
          loginForm.captcha = "";
          refreshCaptcha();
        } else {
          loginError.value = errorMessage || "登录失败，请检查网络连接后重试";
          // 任何其他错误都刷新验证码
          refreshCaptcha();
        }
      } finally {
        loading.value = false;
      }
    };

    // 存储Blob URLs以便清理
    const blobUrls = ref([]);

    // 清理之前创建的blob URLs
    const cleanupBlobUrls = () => {
      blobUrls.value.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
          console.log("释放Blob URL:", url);
        } catch (e) {
          console.error("释放URL失败:", e);
        }
      });
      blobUrls.value = [];
    };

    // 检查本地存储的用户名并设置自动聚焦
    onMounted(() => {
      refreshCaptcha();
      // 如果记住了用户名，自动填充
      const savedUsername = localStorage.getItem("username");
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
      blobUrls,
      cleanupBlobUrls,
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

.captcha-container {
  height: 50px; /* 与服务器生成的验证码高度匹配 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  background-color: #f0f2f5;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f0f2f5;
  border-radius: 4px;
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
