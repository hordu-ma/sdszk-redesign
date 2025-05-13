import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./adminRoutes";
import { useUserStore } from "../stores/user";

// 获取基础路径，与vite.config.js中的base保持一致
const base = import.meta.env.BASE_URL || "/";

const router = createRouter({
  history: createWebHistory(base),
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
