<template>
  <div class="persistence-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <h2>🔄 Pinia 状态持久化演示</h2>
          <p class="subtitle">测试不同状态的持久化行为</p>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 用户状态演示 -->
        <el-col :span="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <h3>👤 用户状态 (user store)</h3>
            </template>

            <div class="state-section">
              <h4>🔐 持久化状态</h4>
              <div class="state-item">
                <label>Token:</label>
                <el-input
                  v-model="userToken"
                  placeholder="输入测试 token"
                  @input="updateUserToken"
                />
              </div>
              <div class="state-item">
                <label>用户信息:</label>
                <el-input
                  v-model="userName"
                  placeholder="输入用户名"
                  @input="updateUserInfo"
                />
              </div>
            </div>

            <el-divider />

            <div class="state-section">
              <h4>⚡ 临时状态 (不持久化)</h4>
              <div class="state-item">
                <label>Loading状态:</label>
                <el-switch
                  v-model="userStore.loading"
                  active-text="加载中"
                  inactive-text="空闲"
                />
              </div>
              <div class="state-item">
                <label>用户已认证:</label>
                <el-switch
                  v-model="userStore.isAuthenticated"
                  active-text="已登录"
                  inactive-text="未登录"
                  disabled
                />
              </div>
            </div>

            <div class="action-buttons">
              <el-button @click="clearUserAuth" type="danger" size="small">
                清除认证状态
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 状态对比演示 -->
        <el-col :span="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <h3>📊 状态对比演示</h3>
            </template>

            <div class="state-section">
              <h4>🔍 当前状态值预览</h4>
              <div class="state-preview">
                <div class="preview-item">
                  <label>Token (持久化):</label>
                  <code>{{ userStore.token || "null" }}</code>
                </div>
                <div class="preview-item">
                  <label>用户名 (持久化):</label>
                  <code>{{ userStore.userInfo?.name || "null" }}</code>
                </div>
                <div class="preview-item">
                  <label>用户角色 (持久化):</label>
                  <code>{{ userStore.userInfo?.role || "null" }}</code>
                </div>
                <div class="preview-item">
                  <label>Loading (临时):</label>
                  <code :class="{ 'temp-state': true }">{{
                    userStore.loading
                  }}</code>
                </div>
                <div class="preview-item">
                  <label>已认证 (计算属性):</label>
                  <code :class="{ 'computed-state': true }">{{
                    userStore.isAuthenticated
                  }}</code>
                </div>
              </div>
            </div>

            <el-divider />

            <div class="state-section">
              <h4>🧪 测试操作</h4>
              <div class="test-actions">
                <el-button @click="simulateLogin" type="success" size="small">
                  模拟登录
                </el-button>
                <el-button @click="simulateLoading" type="warning" size="small">
                  模拟加载
                </el-button>
                <el-button @click="clearUserAuth" type="danger" size="small">
                  清除数据
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 演示说明 -->
      <el-card
        shadow="never"
        class="demo-instructions"
        style="margin-top: 20px"
      >
        <template #header>
          <h3>📖 演示说明</h3>
        </template>

        <el-alert
          title="测试持久化行为"
          type="info"
          show-icon
          :closable="false"
        >
          <template #default>
            <ol>
              <li>
                <strong>修改上述状态值</strong> - 在输入框和选择器中进行修改
              </li>
              <li><strong>刷新页面</strong> - 按 F5 或点击浏览器刷新按钮</li>
              <li>
                <strong>观察结果</strong>：
                <ul>
                  <li>✅ <strong>持久化状态</strong>会在刷新后保持原值</li>
                  <li>❌ <strong>临时状态</strong>会在刷新后恢复默认值</li>
                </ul>
              </li>
            </ol>
          </template>
        </el-alert>

        <div class="current-state" style="margin-top: 15px">
          <h4>🔍 当前持久化数据预览:</h4>
          <el-row :gutter="10">
            <el-col :span="24">
              <div class="persistence-preview">
                <h5>User Store (localStorage: 'user')</h5>
                <pre>{{ userPersistenceData }}</pre>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="refresh-reminder" style="margin-top: 15px">
          <el-button
            @click="refreshPage"
            type="warning"
            size="large"
            style="width: 100%"
          >
            🔄 刷新页面测试持久化效果
          </el-button>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useUserStore } from "@/stores/user";

// Store 实例
const userStore = useUserStore();

// 响应式数据
const userToken = ref(userStore.token || "");
const userName = ref(userStore.userInfo?.name || "");

// 计算属性 - 持久化数据预览
const userPersistenceData = computed(() => {
  try {
    const data = localStorage.getItem("user");
    return data ? JSON.stringify(JSON.parse(data), null, 2) : "暂无数据";
  } catch {
    return "数据格式错误";
  }
});

// 方法
const updateUserToken = (value: string) => {
  userStore.token = value || null;
};

const updateUserInfo = (value: string) => {
  if (value) {
    userStore.userInfo = {
      id: "1",
      username: "demo-user",
      name: value,
      role: "user",
      permissions: ["read"],
    };
  } else {
    userStore.userInfo = null;
  }
};

const clearUserAuth = () => {
  userStore.token = null;
  userStore.userInfo = null;
  userToken.value = "";
  userName.value = "";
};

const simulateLogin = () => {
  userStore.token = "demo-token-" + Date.now();
  userStore.userInfo = {
    id: "demo-id",
    username: "demo-user",
    name: "演示用户",
    role: "user",
    permissions: ["read"],
  };
};

const simulateLoading = () => {
  userStore.loading = true;
  setTimeout(() => {
    userStore.loading = false;
  }, 2000);
};

const refreshPage = () => {
  window.location.reload();
};

// 监听 store 变化并同步到本地变量
watch(
  () => userStore.token,
  (newToken) => {
    userToken.value = newToken || "";
  },
);

watch(
  () => userStore.userInfo?.name,
  (newName) => {
    userName.value = newName || "";
  },
);
</script>

<style lang="scss" scoped>
.persistence-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .demo-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    text-align: center;

    h2 {
      margin: 0 0 5px 0;
      color: #303133;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .inner-card {
    height: 100%;

    .el-card__header {
      background-color: #f8f9fa;

      h3 {
        margin: 0;
        font-size: 16px;
        color: #409eff;
      }
    }
  }

  .state-section {
    margin-bottom: 15px;

    h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #606266;
      border-left: 3px solid #409eff;
      padding-left: 8px;
    }

    .state-item {
      margin-bottom: 10px;

      label {
        display: block;
        margin-bottom: 5px;
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }

      .data-count {
        color: #67c23a;
        font-weight: bold;
      }
    }
  }

  .action-buttons {
    margin-top: 15px;
    text-align: center;
  }

  .demo-instructions {
    .el-card__header {
      background-color: #f0f9ff;
    }

    ol {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.5;

        strong {
          color: #409eff;
        }

        ul {
          margin-top: 5px;
          padding-left: 20px;

          li {
            margin-bottom: 5px;
          }
        }
      }
    }
  }

  .current-state {
    h4 {
      margin: 0 0 10px 0;
      color: #606266;
    }

    .persistence-preview {
      background-color: #f8f9fa;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      padding: 10px;

      h5 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #909399;
      }

      pre {
        margin: 0;
        font-family: "Courier New", monospace;
        font-size: 11px;
        color: #303133;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 150px;
        overflow-y: auto;
      }
    }
  }

  .refresh-reminder {
    border-top: 1px solid #e4e7ed;
    padding-top: 15px;
  }

  .state-preview {
    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px;
      background-color: #fafafa;
      border-radius: 4px;

      label {
        font-weight: 500;
        color: #606266;
        margin: 0;
      }

      code {
        background-color: #e4e7ed;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;

        &.temp-state {
          background-color: #fdf6ec;
          color: #e6a23c;
        }

        &.computed-state {
          background-color: #f0f9ff;
          color: #409eff;
        }
      }
    }
  }

  .test-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.el-divider {
  margin: 15px 0;
}
</style>
