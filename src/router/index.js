import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
  ],
});

export default router;
