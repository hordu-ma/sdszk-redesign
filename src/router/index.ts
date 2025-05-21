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
  // 用户相关路由
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
