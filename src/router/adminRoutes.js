// adminRoutes.js - 管理系统路由配置

// 使用懒加载导入组件
const AdminLayout = () => import("../views/admin/AdminLayout.vue");
const AdminLogin = () => import("../views/admin/AdminLogin.vue");
const AdminDashboard = () => import("../views/admin/AdminDashboard.vue");

// 路由守卫
import { useUserStore } from "../stores/user";

// 路由配置
const adminRoutes = [
  {
    path: "/admin/login",
    name: "AdminLogin",
    component: AdminLogin,
    meta: {
      title: "登录 - 内容管理系统",
      requiresAuth: false,
    },
  },
  {
    path: "/admin",
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: AdminDashboard,
        meta: {
          title: "控制面板",
          icon: "dashboard",
        },
      },
      // 资讯管理路由
      {
        path: "news",
        redirect: "/admin/news/list",
        meta: {
          title: "资讯管理",
          icon: "read",
        },
        children: [
          {
            path: "list",
            name: "NewsList",
            component: () => import("../views/admin/news/NewsList.vue"),
            meta: {
              title: "资讯列表",
              icon: "unordered-list",
            },
          },
          {
            path: "create",
            name: "NewsCreate",
            component: () => import("../views/admin/news/NewsForm.vue"),
            meta: {
              title: "添加资讯",
              icon: "file-add",
              roles: ["admin", "editor"],
            },
          },
          {
            path: "edit/:id",
            name: "NewsEdit",
            component: () => import("../views/admin/news/NewsForm.vue"),
            props: true,
            meta: {
              title: "编辑资讯",
              icon: "edit",
              roles: ["admin", "editor"],
            },
          },
        ],
      },
      // 资源管理路由
      {
        path: "resources",
        redirect: "/admin/resources/list",
        meta: {
          title: "资源管理",
          icon: "folder",
        },
        children: [
          {
            path: "list",
            name: "ResourceList",
            component: () =>
              import("../views/admin/resources/ResourceList.vue"),
            meta: {
              title: "资源列表",
              icon: "unordered-list",
            },
          },
          {
            path: "categories",
            name: "ResourceCategories",
            component: () =>
              import("../views/admin/resources/ResourceCategories.vue"),
            meta: {
              title: "资源分类",
              icon: "bars",
              roles: ["admin", "editor"],
            },
          },
          {
            path: "create",
            name: "ResourceCreate",
            component: () =>
              import("../views/admin/resources/ResourceForm.vue"),
            meta: {
              title: "添加资源",
              icon: "file-add",
              roles: ["admin", "editor"],
            },
          },
          {
            path: "edit/:id",
            name: "ResourceEdit",
            component: () =>
              import("../views/admin/resources/ResourceForm.vue"),
            props: true,
            meta: {
              title: "编辑资源",
              icon: "edit",
              roles: ["admin", "editor"],
            },
          },
        ],
      },
      // 活动管理路由
      {
        path: "activities",
        redirect: "/admin/activities/list",
        meta: {
          title: "活动管理",
          icon: "calendar",
        },
        children: [
          {
            path: "list",
            name: "ActivitiesList",
            component: () =>
              import("../views/admin/activities/ActivitiesList.vue"),
            meta: {
              title: "活动列表",
              icon: "unordered-list",
            },
          },
          {
            path: "create",
            name: "ActivityCreate",
            component: () =>
              import("../views/admin/activities/ActivityForm.vue"),
            meta: {
              title: "添加活动",
              icon: "file-add",
              roles: ["admin", "editor"],
            },
          },
          {
            path: "edit/:id",
            name: "ActivityEdit",
            component: () =>
              import("../views/admin/activities/ActivityForm.vue"),
            props: true,
            meta: {
              title: "编辑活动",
              icon: "edit",
              roles: ["admin", "editor"],
            },
          },
        ],
      },
      // 用户管理路由
      {
        path: "users",
        name: "UsersManagement",
        component: () => import("../views/admin/UsersManagement.vue"),
        meta: {
          title: "用户管理",
          icon: "team",
          roles: ["admin"],
        },
      },
      // 系统设置路由
      {
        path: "settings",
        name: "Settings",
        component: () => import("../views/admin/Settings.vue"),
        meta: {
          title: "系统设置",
          icon: "setting",
          roles: ["admin"],
        },
        children: [
          {
            path: "general",
            name: "GeneralSettings",
            component: () =>
              import("../views/admin/settings/GeneralSettings.vue"),
            meta: {
              title: "基本设置",
              icon: "setting",
              roles: ["admin"],
            },
          },
        ],
      },
      // 暂时移除个人资料路由
      // {
      //   path: "profile",
      //   name: "UserProfile",
      //   component: () => import("../views/admin/users/UserProfile.vue"),
      //   meta: {
      //     title: "个人资料",
      //     icon: "user",
      //   },
      // },
    ],
  },
];

// 路由守卫中间件
export function setupAdminRouteGuards(router) {
  router.beforeEach((to, from, next) => {
    // 获取用户状态
    const userStore = useUserStore();

    // 更新页面标题
    if (to.meta.title) {
      document.title = to.meta.title;
    }

    // 检查路由是否需要认证
    if (to.matched.some((record) => record.meta.requiresAuth !== false)) {
      // 如果没有登录且不是登录页，则重定向到登录页
      if (!userStore.isLoggedIn) {
        next({
          path: "/admin/login",
          query: { redirect: to.fullPath },
        });
        return;
      }

      // 检查角色权限
      if (to.meta.roles && !to.meta.roles.includes(userStore.userRole)) {
        next({ path: "/admin", replace: true });
        return;
      }
    } else if (to.path === "/admin/login" && userStore.isLoggedIn) {
      // 如果已登录且尝试访问登录页，则重定向到管理面板
      next({ path: "/admin" });
      return;
    }

    // 继续导航
    next();
  });
}

export default adminRoutes;
