import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../stores/user'

// 扩展路由元数据类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    adminOnly?: boolean
    permissions?: string[]
  }
}

// 获取基础路径，根据环境变量或meta信息确定
const getBase = (): string => {
  // 检查是否有环境变量
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL
  }
  // 否则使用默认的BASE_URL
  return import.meta.env.BASE_URL || '/'
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/auth/AuthPage.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/About.vue'),
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('../views/News.vue'),
  },
  {
    path: '/news/detail/:id',
    name: 'newsDetail',
    component: () => import('../views/NewsDetail.vue'),
    props: true,
  },
  {
    path: '/activities',
    name: 'activities',
    component: () => import('../views/Activities.vue'),
  },
  {
    path: '/resources',
    name: 'resources',
    component: () => import('../views/Resources.vue'),
  },
  {
    path: '/resources/detail/:id',
    name: 'resourceDetail',
    component: () => import('../views/resources/ResourceDetail.vue'),
    props: true,
  },
  {
    path: '/ai',
    name: 'ai',
    component: () => import('../views/AI.vue'),
  },
  // 个人中心路由
  {
    path: '/user',
    component: () => import('../views/user/UserLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/user/profile',
      },
      {
        path: 'profile',
        name: 'userProfile',
        component: () => import('../views/user/UserProfile.vue'),
      },
      {
        path: 'favorites',
        name: 'userFavorites',
        component: () => import('../views/user/UserFavorites.vue'),
      },
      {
        path: 'history',
        name: 'userHistory',
        component: () => import('../views/user/UserHistory.vue'),
      },
      {
        path: 'settings',
        name: 'userSettings',
        component: () => import('../views/user/UserSettings.vue'),
      },
    ],
  },
  // 管理后台路由
  {
    path: '/admin/login',
    name: 'adminLogin',
    component: () => import('../views/admin/auth/AdminLogin.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/admin',
    component: () => import('../components/admin/AdminLayout.vue'),
    meta: {
      requiresAuth: true,
      adminOnly: true,
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'adminDashboard',
        component: () => import('../views/admin/dashboard/AdminDashboard.vue'),
      },
      // 新闻管理路由
      {
        path: 'news',
        children: [
          {
            path: 'list',
            name: 'adminNewsList',
            component: () => import('../views/admin/news/NewsList.vue'),
            meta: {
              permissions: ['news:read'],
            },
          },
          {
            path: 'create',
            name: 'adminNewsCreate',
            component: () => import('../views/admin/news/NewsCreate.vue'),
            meta: {
              permissions: ['news:create'],
            },
          },
          {
            path: 'edit/:id',
            name: 'adminNewsEdit',
            component: () => import('../views/admin/news/NewsEdit.vue'),
            props: true,
            meta: {
              permissions: ['news:update'],
            },
          },
          {
            path: 'categories',
            name: 'adminNewsCategories',
            component: () => import('../views/admin/news/NewsCategories.vue'),
            meta: {
              permissions: ['news:category'],
            },
          },
        ],
      },
      // 资源管理路由
      {
        path: 'resources',
        children: [
          {
            path: 'list',
            name: 'adminResourcesList',
            component: () => import('../views/admin/resources/ResourcesList.vue'),
            meta: {
              permissions: ['resource:read'],
            },
          },
          {
            path: 'create',
            name: 'adminResourcesCreate',
            component: () => import('../views/admin/resources/ResourcesCreate.vue'),
            meta: {
              permissions: ['resource:create'],
            },
          },
          {
            path: 'edit/:id',
            name: 'adminResourcesEdit',
            component: () => import('../views/admin/resources/ResourcesEdit.vue'),
            props: true,
            meta: {
              permissions: ['resource:update'],
            },
          },
          {
            path: 'categories',
            name: 'adminResourcesCategories',
            component: () => import('../views/admin/resources/ResourcesCategories.vue'),
            meta: {
              permissions: ['resource:category'],
            },
          },
        ],
      },
      // 用户管理路由
      {
        path: 'users',
        children: [
          {
            path: 'list',
            name: 'adminUsersList',
            component: () => import('../views/admin/users/UsersList.vue'),
            meta: {
              permissions: ['user:read'],
            },
          },
          {
            path: 'roles',
            name: 'adminUserRoles',
            component: () => import('../views/admin/users/UserRoles.vue'),
            meta: {
              permissions: ['user:role'],
            },
          },
          {
            path: 'permissions',
            name: 'adminUserPermissions',
            component: () => import('../views/admin/users/UserPermissions.vue'),
            meta: {
              permissions: ['user:permission'],
            },
          },
        ],
      },
      // 系统设置路由
      {
        path: 'settings',
        name: 'adminSettings',
        component: () => import('../views/admin/settings/SystemSettings.vue'),
        meta: {
          permissions: ['system:setting'],
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(getBase()),
  routes,
})

// 导航守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 如果需要验证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!userStore.isAuthenticated) {
      // 未登录，重定向到登录页
      return next({
        path: '/admin/login',
        query: { redirect: to.fullPath },
      })
    }

    // 检查路由是否需要管理员权限
    if (to.meta.adminOnly && !userStore.isAdmin) {
      message.error('您没有访问该页面的权限')
      return next({ path: '/admin/dashboard' })
    }

    // 检查路由是否需要特定权限
    if (to.meta.permissions) {
      const requiredPermissions = to.meta.permissions as string[]
      const hasPermission = requiredPermissions.some(permission =>
        userStore.hasPermission(permission)
      )

      if (!hasPermission) {
        message.error('您没有访问该页面的权限')
        return next({ path: '/admin/dashboard' })
      }
    }
  }

  next()
})

export default router
