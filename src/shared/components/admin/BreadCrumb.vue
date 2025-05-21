<!-- BreadCrumb.vue - 面包屑导航组件 -->
<template>
  <a-breadcrumb class="admin-breadcrumb">
    <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index">
      <router-link :to="item.path" v-if="index < breadcrumbItems.length - 1">
        {{ item.title }}
      </router-link>
      <span v-else>{{ item.title }}</span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";

export default {
  name: "BreadCrumb",

  setup() {
    const route = useRoute();

    // 面包屑映射表
    const breadcrumbMap = {
      "/admin": { title: "首页", icon: "home" },
      "/admin/news": { title: "资讯管理", icon: "read" },
      "/admin/news/list": { title: "资讯列表", icon: "unordered-list" },
      "/admin/news/categories": { title: "资讯分类", icon: "bars" },
      "/admin/news/create": { title: "添加资讯", icon: "file-add" },
      "/admin/news/edit": { title: "编辑资讯", icon: "edit" },
      "/admin/resources": { title: "资源管理", icon: "folder" },
      "/admin/resources/list": { title: "资源列表", icon: "unordered-list" },
      "/admin/resources/categories": { title: "资源分类", icon: "bars" },
      "/admin/resources/create": { title: "添加资源", icon: "file-add" },
      "/admin/resources/edit": { title: "编辑资源", icon: "edit" },
      "/admin/activities": { title: "活动管理", icon: "calendar" },
      "/admin/activities/list": { title: "活动列表", icon: "unordered-list" },
      "/admin/activities/create": { title: "添加活动", icon: "file-add" },
      "/admin/activities/edit": { title: "编辑活动", icon: "edit" },
      "/admin/users": { title: "用户管理", icon: "team" },
      "/admin/users/create": { title: "添加用户", icon: "user-add" },
      "/admin/users/edit": { title: "编辑用户", icon: "edit" },
      "/admin/settings": { title: "系统设置", icon: "setting" },
      "/admin/settings/general": { title: "基本设置", icon: "tool" },
      "/admin/settings/appearance": { title: "外观设置", icon: "bg-colors" },
      "/admin/settings/logs": { title: "系统日志", icon: "exception" },
    };

    // 动态计算面包屑
    const breadcrumbItems = computed(() => {
      const { path, meta, params } = route;
      const pathSnippets = path.split("/").filter((i) => i);
      const breadcrumbs = [];

      // 始终添加首页
      breadcrumbs.push({
        title: "首页",
        path: "/admin",
      });

      // 生成路径
      let currentPath = "";
      for (let i = 0; i < pathSnippets.length; i++) {
        const snippet = pathSnippets[i];

        if (i === 0 && snippet === "admin") {
          continue; // 跳过首页，已添加
        }

        currentPath += `/${snippet}`;

        // 检查是否是编辑页面
        if (snippet === "edit" && params.id) {
          const parentPath = currentPath.substring(
            0,
            currentPath.lastIndexOf("/")
          );
          const parentInfo = breadcrumbMap[parentPath];

          if (parentInfo) {
            breadcrumbs.push({
              title: parentInfo.title,
              path: parentPath,
            });
          }

          breadcrumbs.push({
            title: `编辑 #${params.id}`,
            path: currentPath,
          });

          break; // 编辑页面是最终页面
        }

        // 常规页面
        const fullPath = `/admin${currentPath}`;
        const pageInfo = breadcrumbMap[fullPath];

        if (pageInfo) {
          breadcrumbs.push({
            title: pageInfo.title,
            path: fullPath,
          });
        }
      }

      // 使用路由元数据中的标题覆盖最后一项
      if (meta && meta.title && breadcrumbs.length > 0) {
        breadcrumbs[breadcrumbs.length - 1].title = meta.title;
      }

      return breadcrumbs;
    });

    return {
      breadcrumbItems,
    };
  },
};
</script>

<style scoped>
.admin-breadcrumb {
  margin-left: 8px;
}
</style>
