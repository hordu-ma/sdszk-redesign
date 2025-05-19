// adminRoutes.ts - 管理系统路由配置
import type { RouteRecordRaw } from 'vue-router'

// 使用懒加载导入组件
const AdminLayout = () => import('../views/admin/AdminLayout.vue')
const AdminLogin = () => import('../views/admin/AdminLogin.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const NewsCategoryList = () => import('../views/admin/categories/NewsCategoryList.vue')

// 路由配置
const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: {
      title: '登录 - 内容管理系统',
      requiresAuth: false,
    },
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {
          title: '仪表盘 - 内容管理系统',
          icon: 'dashboard',
        },
      },
      {
        path: 'news',
        name: 'AdminNewsManagement',
        component: () => import('../views/admin/news/NewsList.vue'),
        meta: {
          title: '资讯管理 - 内容管理系统',
          icon: 'document',
          permissions: ['news.read'],
        },
      },
      {
        path: 'news/add',
        name: 'AdminNewsAdd',
        component: () => import('../views/admin/news/NewsForm.vue'),
        meta: {
          title: '添加资讯 - 内容管理系统',
          icon: 'plus',
          parent: 'AdminNewsManagement',
          permissions: ['news.create'],
        },
      },
      {
        path: 'news/edit/:id',
        name: 'AdminNewsEdit',
        component: () => import('../views/admin/news/NewsForm.vue'),
        props: true,
        meta: {
          title: '编辑资讯 - 内容管理系统',
          icon: 'edit',
          parent: 'AdminNewsManagement',
          permissions: ['news.update'],
        },
      },
      {
        path: 'resources',
        name: 'AdminResourcesManagement',
        component: () => import('../views/admin/ResourcesManagement.vue'),
        meta: {
          title: '资源管理 - 内容管理系统',
          icon: 'files',
          permissions: ['resources.read'],
        },
      },
      {
        path: 'resources/add',
        name: 'AdminResourceAdd',
        component: () => import('../views/admin/resources/ResourceForm.vue'),
        meta: {
          title: '添加资源 - 内容管理系统',
          icon: 'plus',
          parent: 'AdminResourcesManagement',
          permissions: ['resources.create'],
        },
      },
      {
        path: 'resources/edit/:id',
        name: 'AdminResourceEdit',
        component: () => import('../views/admin/resources/ResourceForm.vue'),
        props: true,
        meta: {
          title: '编辑资源 - 内容管理系统',
          icon: 'edit',
          parent: 'AdminResourcesManagement',
          permissions: ['resources.update'],
        },
      },
      {
        path: 'activities',
        name: 'AdminActivitiesManagement',
        component: () => import('../views/admin/activities/ActivitiesList.vue'),
        meta: {
          title: '活动管理 - 内容管理系统',
          icon: 'calendar',
          permissions: ['activities.read'],
        },
      },
      {
        path: 'activities/add',
        name: 'AdminActivityAdd',
        component: () => import('../views/admin/activities/ActivityForm.vue'),
        meta: {
          title: '添加活动 - 内容管理系统',
          icon: 'plus',
          parent: 'AdminActivitiesManagement',
          permissions: ['activities.create'],
        },
      },
      {
        path: 'activities/edit/:id',
        name: 'AdminActivityEdit',
        component: () => import('../views/admin/activities/ActivityForm.vue'),
        props: true,
        meta: {
          title: '编辑活动 - 内容管理系统',
          icon: 'edit',
          parent: 'AdminActivitiesManagement',
          permissions: ['activities.update'],
        },
      },
      {
        path: 'users',
        name: 'AdminUsersManagement',
        component: () => import('../views/admin/UsersManagement.vue'),
        meta: {
          title: '用户管理 - 内容管理系统',
          icon: 'user',
          adminOnly: true,
        },
      },
      {
        path: 'categories',
        name: 'NewsCategories',
        component: NewsCategoryList,
        meta: {
          title: '分类管理',
          requiresAuth: true,
          permissions: ['news.category.view'],
        },
      },
      {
        path: 'categories/core',
        name: 'CoreCategories',
        component: NewsCategoryList,
        meta: {
          title: '核心分类',
          requiresAuth: true,
          permissions: ['news.category.manage'],
          query: { mode: 'core' },
        },
      },
    ],
  },
]

export default adminRoutes
