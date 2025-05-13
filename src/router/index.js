import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./adminRoutes";
import { useUserStore } from "../stores/user";

// 获取基础路径，根据环境变量或meta信息确定
const getBase = () => {
  // 检查是否有环境变量
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }
  // 否则使用默认的BASE_URL
  return import.meta.env.BASE_URL || "/";
};

const router = createRouter({
  history: createWebHistory(getBase()),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/Home.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/About.vue"),
    },
    {
      path: "/news",
      name: "news",
      component: () => import("../views/News.vue"),
    },
    {
      path: "/news/detail/:id",
      name: "newsDetail",
      component: () => import("../views/NewsDetail.vue"),
      props: true,
    },
    {
      path: "/activities",
      name: "activities",
      component: () => import("../views/Activities.vue"),
    },
    {
      path: "/resources",
      name: "resources",
      component: () => import("../views/Resources.vue"),
    },
    {
      path: "/ai",
      name: "ai",
      component: () => import("../views/AI.vue"),
    },
    // 添加管理系统路由
    ...adminRoutes,
  ],
});

// 导航守卫
router.beforeEach((to, from, next) => {
  // 处理需要验证的路由
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const userStore = useUserStore();
    if (!userStore.isAuthenticated) {
      next({
        path: "/admin/login",
        query: { redirect: to.fullPath },
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
