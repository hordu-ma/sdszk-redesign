<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="../../assets/images/logo.png" alt="Logo" class="login-logo" />
        <h2>思政课程教学研究中心</h2>
        <h3>管理员登录</h3>
      </div>
      <a-form
        :model="formState"
        name="basic"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
        autocomplete="off"
        @finish="onFinish"
        @finishFailed="onFinishFailed"
      >
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名!' }]"
        >
          <a-input v-model:value="formState.username">
            <template #prefix>
              <user-outlined class="site-form-item-icon" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="formState.password">
            <template #prefix>
              <lock-outlined class="site-form-item-icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item name="remember" :wrapper-col="{ offset: 8, span: 16 }">
          <a-checkbox v-model:checked="formState.remember">记住我</a-checkbox>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
          <a-button type="primary" html-type="submit" :loading="loading"
            >登录</a-button
          >
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);

const formState = reactive({
  username: "",
  password: "",
  remember: true,
});

const onFinish = async (values) => {
  loading.value = true;
  try {
    // 这里应该是实际的API调用
    // await login(values)
    // 模拟登录成功
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (values.username === "admin" && values.password === "admin") {
      userStore.login({
        username: values.username,
        role: "admin",
      });
      message.success("登录成功");
      router.push("/admin/dashboard");
    } else {
      message.error("用户名或密码错误");
    }
  } catch (error) {
    message.error("登录失败");
  } finally {
    loading.value = false;
  }
};

const onFinishFailed = (errorInfo) => {
  console.log("Failed:", errorInfo);
  message.error("请检查输入");
};
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  background-image: url("../../assets/images/login-bg.jpg");
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  width: 84px;
  margin-bottom: 16px;
}

.login-header h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 8px;
}

.login-header h3 {
  color: #666;
  font-size: 16px;
  font-weight: normal;
}

:deep(.ant-input-prefix) {
  color: rgba(0, 0, 0, 0.25);
}

.ant-btn {
  width: 100%;
}
</style>
