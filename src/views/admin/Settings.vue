<template>
  <div class="settings-container">
    <el-tabs
      v-model="activeTab"
      type="border-card"
      class="settings-tabs"
      @tab-click="handleTabClick"
    >
      <el-tab-pane label="基本设置" name="general">
        <router-view v-if="activeTab === 'general'" />
      </el-tab-pane>

      <el-tab-pane label="其他设置" name="other" disabled>
        <div class="coming-soon">
          <el-icon><setting /></el-icon>
          <p>更多设置正在开发中...</p>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Setting } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const activeTab = ref("general");

const handleTabClick = (tab) => {
  if (tab.props.name === "general") {
    router.push("/admin/settings/general");
  }
};

onMounted(() => {
  // 根据当前路由设置活动标签
  const path = route.path;
  if (path.includes("/general")) {
    activeTab.value = "general";
  }

  // 如果直接访问 /admin/settings，重定向到基本设置
  if (path === "/admin/settings") {
    router.push("/admin/settings/general");
  }
});
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-tabs {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.coming-soon {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.coming-soon i {
  font-size: 48px;
  margin-bottom: 16px;
}

.coming-soon p {
  font-size: 16px;
  margin: 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style>
