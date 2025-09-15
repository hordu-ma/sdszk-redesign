import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { message } from "ant-design-vue";
import { useUserStore } from "../stores/user";
import { startRouteTimer, endRouteTimer } from "../utils/performance";

// 核心页面同步导入，提升首屏渲染速度
import Home from "../views/Home.vue";
import AuthPage from "../views/auth/AuthPage.vue";
import AdminLogin from "../views/admin/auth/AdminLogin.vue";

// 预加载函数 - 在空闲时预加载重要组件
const preloadComponents = () => {
  // 确保在浏览器环境中运行
  if (typeof window === "undefined") return;

  try {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        try {
          // 预加载常用页面
          import("../views/News.vue").catch(console.warn);
          import("../views/Resources.vue").catch(console.warn);
          import("../views/user/UserLayout.vue").catch(console.warn);
        } catch (error) {
          console.warn("预加载组件失败:", error);
        }
      });

      // 延迟预加载管理后台组件
      requestIdleCallback(
        () => {
          try {
            import("../components/admin/AdminLayout.vue").catch(console.warn);
            import("../views/admin/dashboard/AdminDashboard.vue").catch(
              console.warn,
            );
          } catch (error) {
            console.warn("预加载管理后台组件失败:", error);
          }
        },
        { timeout: 2000 },
      );
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(() => {
        try {
          import("../views/News.vue").catch(console.warn);
          import("../views/Resources.vue").catch(console.warn);
          import("../views/user/UserLayout.vue").catch(console.warn);
        } catch (error) {
          console.warn("预加载组件失败:", error);
        }
      }, 1000);
    }
  } catch (error) {
    console.warn("预加载初始化失败:", error);
  }
};

// 扩展路由元数据类型
declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    adminOnly?: boolean;
    permissions?: string[];
    keepAlive?: boolean;
    title?: string;
  }
}

// 获取基础路径，根据环境变量或meta信息确定
const getBase = (): string => {
  // 检查是否有环境变量
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }
  // 否则使用默认的BASE_URL
  return import.meta.env.BASE_URL || "/";
};

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: Home, // 同步加载首页
    meta: {
      title: "首页",
      keepAlive: true,
    },
  },
  {
    path: "/auth",
    name: "auth",
    component: AuthPage, // 同步加载登录页
    meta: {
      requiresAuth: false,
      title: "用户登录",
    },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/About.vue"),
    meta: {
      title: "关于我们",
      keepAlive: true,
    },
  },
  {
    path: "/news",
    name: "news",
    component: () => import("../views/News.vue"),
    meta: {
      title: "新闻资讯",
      keepAlive: true,
    },
  },
  {
    path: "/news/detail/:id",
    name: "newsDetail",
    component: () => import("../views/NewsDetail.vue"),
    props: true,
    meta: {
      title: "新闻详情",
      keepAlive: false,
    },
  },
  {
    path: "/activities",
    name: "activities",
    component: () => import("../views/Activities.vue"),
    meta: {
      title: "萌新磨课",
      keepAlive: true,
    },
  },
  {
    path: "/activity-signup",
    name: "activity-signup",
    component: () => import("../views/ActivitySignupView.vue"),
    meta: {
      title: "活动报名",
    },
  },
  {
    path: "/resources",
    name: "resources",
    component: () => import("../views/Resources.vue"),
    meta: {
      title: "教学资源",
      keepAlive: true,
    },
  },
  {
    path: "/resources/detail/:id",
    name: "resourceDetail",
    component: () => import("../views/resources/ResourceDetail.vue"),
    props: true,
    meta: {
      title: "资源详情",
      keepAlive: false,
    },
  },
  {
    path: "/ai",
    name: "ai",
    component: () => import("../views/AI.vue"),
    meta: {
      title: "AI助手",
      keepAlive: true,
    },
  },
  {
    path: "/community",
    name: "community",
    component: () => import("../views/Community.vue"),
    meta: {
      title: "一体化共同体",
      keepAlive: true,
    },
  },
  // 个人中心路由 - 移除强制认证，改为组件内部处理
  {
    path: "/user",
    component: () => import("../views/user/UserLayout.vue"),
    meta: {
      title: "个人中心",
    },
    children: [
      {
        path: "",
        redirect: "/user/profile",
      },
      {
        path: "profile",
        name: "userProfile",
        component: () => import("../views/user/UserProfile.vue"),
        meta: {
          title: "个人资料",
        },
      },
      {
        path: "favorites",
        name: "userFavorites",
        component: () => import("../views/user/UserFavorites.vue"),
        meta: {
          title: "我的收藏",
        },
      },
      {
        path: "history",
        name: "userHistory",
        component: () => import("../views/user/UserHistory.vue"),
        meta: {
          title: "浏览历史",
        },
      },
      {
        path: "settings",
        name: "userSettings",
        component: () => import("../views/user/UserSettings.vue"),
        meta: {
          title: "账户设置",
        },
      },
    ],
  },
  // 管理后台路由
  {
    path: "/admin/login",
    name: "adminLogin",
    component: AdminLogin, // 同步加载管理员登录页
    meta: {
      requiresAuth: false,
      title: "管理员登录",
    },
  },
  {
    path: "/admin",
    component: () => import("../components/admin/AdminLayout.vue"),
    meta: {
      requiresAuth: true,
      adminOnly: true,
    },
    children: [
      {
        path: "",
        redirect: "/admin/dashboard",
      },
      {
        path: "dashboard",
        name: "adminDashboard",
        component: () => import("../views/admin/dashboard/AdminDashboard.vue"),
        meta: {
          keepAlive: true,
          title: "仪表板",
        },
      },
      // 新闻管理路由
      {
        path: "news",
        children: [
          {
            path: "list",
            name: "adminNewsList",
            component: () => import("../views/admin/news/NewsList.vue"),
            meta: {
              keepAlive: true,
              permissions: ["news:read"],
              title: "新闻列表",
            },
          },
          {
            path: "create",
            name: "adminNewsCreate",
            component: () => import("../views/admin/news/NewsCreate.vue"),
            meta: {
              keepAlive: false,
              permissions: ["news:create"],
              title: "发布新闻",
            },
          },
          {
            path: "edit/:id",
            name: "adminNewsEdit",
            component: () => import("../views/admin/news/NewsEdit.vue"),
            props: true,
            meta: {
              keepAlive: false,
              permissions: ["news:update"],
              title: "编辑新闻",
            },
          },
          {
            path: "categories",
            name: "adminNewsCategories",
            component: () => import("../views/admin/news/NewsCategories.vue"),
            meta: {
              keepAlive: true,
              permissions: ["news:category"],
              title: "分类管理",
            },
          },
        ],
      },
      // 资源管理路由
      {
        path: "resources",
        children: [
          {
            path: "list",
            name: "adminResourcesList",
            component: () =>
              import("../views/admin/resources/ResourcesList.vue"),
            meta: {
              permissions: ["resource:read"],
            },
          },
          {
            path: "create",
            name: "adminResourcesCreate",
            component: () =>
              import("../views/admin/resources/ResourcesCreate.vue"),
            meta: {
              permissions: ["resource:create"],
            },
          },
          {
            path: "edit/:id",
            name: "adminResourcesEdit",
            component: () =>
              import("../views/admin/resources/ResourcesEdit.vue"),
            props: true,
            meta: {
              permissions: ["resource:update"],
            },
          },
          {
            path: "categories",
            name: "adminResourcesCategories",
            component: () =>
              import("../views/admin/resources/ResourcesCategories.vue"),
            meta: {
              permissions: ["resource:category"],
            },
          },
        ],
      },
      // 用户管理路由
      {
        path: "users",
        children: [
          {
            path: "list",
            name: "adminUsersList",
            component: () => import("../views/admin/users/UsersList.vue"),
            meta: {
              permissions: ["user:read"],
            },
          },
          {
            path: "roles",
            name: "adminUserRoles",
            component: () => import("../views/admin/users/UserRoles.vue"),
            meta: {
              permissions: ["user:role"],
            },
          },
          {
            path: "permissions",
            name: "adminUserPermissions",
            component: () => import("../views/admin/users/UserPermissions.vue"),
            meta: {
              permissions: ["user:permission"],
            },
          },
        ],
      },
      // 管理员个人资料路由
      {
        path: "profile",
        name: "adminProfile",
        component: () => import("../views/admin/profile/AdminProfile.vue"),
        meta: {
          keepAlive: false,
          title: "个人资料",
        },
      },
      // 系统设置路由
      {
        path: "settings",
        name: "adminSettings",
        component: () => import("../views/admin/settings/SystemSettings.vue"),
        meta: {
          permissions: ["settings:update"],
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(getBase()),
  routes,
});

// 启动预加载
preloadComponents();

// 导航守卫
router.beforeEach(async (to, _from, next) => {
  // 开始路由性能计时
  startRouteTimer();

  const userStore = useUserStore();

  // 如果需要验证
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!userStore.isAuthenticated) {
      // 未登录，根据路径判断重定向到不同的登录页
      const isAdminRoute = to.path.startsWith("/admin");
      const loginPath = isAdminRoute ? "/admin/login" : "/auth";

      return next({
        path: loginPath,
        query: { redirect: to.fullPath },
      });
    }

    // 检查路由是否需要管理员权限
    if (to.meta.adminOnly && !userStore.canAccessAdmin) {
      message.error("您没有访问该页面的权限");
      return next({ path: "/admin/dashboard" });
    }

    // 检查路由是否需要特定权限
    if (to.meta.permissions) {
      const requiredPermissions = to.meta.permissions as string[];
      const hasPermission = requiredPermissions.some((permission) =>
        userStore.hasPermission(permission),
      );

      if (!hasPermission) {
        message.error("您没有访问该页面的权限");
        return next({ path: "/admin/dashboard" });
      }
    }
  }

  next();
});

// 添加路由后置守卫，用于设置页面标题和结束性能计时
router.afterEach((to) => {
  // 结束路由性能计时
  endRouteTimer();

  // 设置页面标题
  const title = to.meta?.title as string;
  if (title) {
    document.title = `${title} - 山东省大中小学思政课一体化中心平台`;
  } else {
    document.title = "山东省大中小学思政课一体化中心平台";
  }

  // 在开发环境下输出性能日志
  if (process.env.NODE_ENV === "development") {
    // 延迟一小段时间让组件完全加载后再输出报告
    setTimeout(() => {
      import("../utils/performance")
        .then(({ logPerformanceReport }) => {
          logPerformanceReport?.();
        })
        .catch(() => {
          // 静默处理性能监控加载失败
        });
    }, 100);
  }
});

export default router;
