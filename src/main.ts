import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import Antd from "ant-design-vue";

// 样式导入 - 修改导入顺序确保样式正确应用
import "./style.css";
import "element-plus/dist/index.css";
import "ant-design-vue/dist/reset.css";
import "./styles/preview-fix.css"; // 添加预览模式修复样式

import App from "./App.vue";
import router from "./router";
import { initFavicon } from "./utils/favicon";

const app = createApp(App);

// 创建 Pinia 实例并配置持久化插件
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(Antd);

// 导入并注册权限指令
import permissions from "./directives";
app.use(permissions);

// 初始化用户状态
import { useUserStore } from "./stores/user";

// 应用挂载前初始化用户状态
const initializeApp = async () => {
  try {
    const userStore = useUserStore();

    // 如果有存储的token，则初始化用户信息
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      console.log("🔄 正在初始化用户状态...");
      await userStore.initUserInfo();
      console.log("✅ 用户状态初始化完成");
    }
  } catch (error) {
    console.error("⚠️ 用户状态初始化失败:", error);
    // 即使初始化失败也要继续挂载应用
  }

  app.mount("#app");

  // 初始化动态favicon
  initFavicon();
};

// 启动应用
initializeApp();
