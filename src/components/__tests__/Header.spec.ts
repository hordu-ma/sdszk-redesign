import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { ElDropdown, ElButton, ElInput, ElIcon, ElAvatar } from 'element-plus'
import Header from '../Header.vue'
import { useUserStore } from '../../stores/user'

interface UserInfo {
  id: string
  username: string
  name: string
  role: string
  permissions: string[]
  avatar?: string
}

type UserStore = ReturnType<typeof useUserStore>

// 创建测试用的路由实例
const createTestRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: {} },
      { path: '/about', component: {} },
      { path: '/news', component: {} },
      { path: '/resources', component: {} },
      { path: '/ai', component: {} },
      { path: '/auth', component: {} },
    ],
  })

// 模拟组件
vi.mock('element-plus', () => ({
  ElDropdown: { name: 'ElDropdown' },
  ElButton: { name: 'ElButton' },
  ElInput: { name: 'ElInput' },
  ElIcon: { name: 'ElIcon' },
  ElAvatar: { name: 'ElAvatar' },
}))

describe('Header Component', () => {
  let wrapper: VueWrapper<any>
  let store: UserStore
  const mountComponent = (options = {}) => {
    const router = createTestRouter()
    return mount(Header, {
      global: {
        plugins: [router, createPinia()],
        components: {
          ElDropdown,
          ElButton,
          ElInput,
          ElIcon,
          ElAvatar,
        },
        stubs: {
          'router-link': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
        },
      },
      ...options,
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUserStore()
    wrapper = mountComponent()
  })

  describe('基本渲染', () => {
    it('应该正确渲染logo和中心名称', () => {
      expect(wrapper.find('.logo').exists()).toBe(true)
      expect(wrapper.find('.center-name').exists()).toBe(true)
      expect(wrapper.find('.full-name').text()).toBe('山东省大中小学思政课一体化中心')
    })

    it('应该渲染所有导航链接', () => {
      const navLinks = wrapper.findAll('.nav-item')
      expect(navLinks).toHaveLength(6) // 首页、平台简介、资讯中心、活动中心、资源中心、AI思政
    })

    it('应该渲染搜索框', () => {
      expect(wrapper.find('.search-input').exists()).toBe(true)
    })
  })

  describe('响应式行为', () => {
    it('滚动时应该正确更新header样式', async () => {
      // 模拟滚动事件
      window.scrollY = 100
      await window.dispatchEvent(new Event('scroll'))
      expect(wrapper.classes()).toContain('header-scrolled')

      window.scrollY = 0
      await window.dispatchEvent(new Event('scroll'))
      expect(wrapper.classes()).not.toContain('header-scrolled')
    })

    it('应该正确切换移动端菜单', async () => {
      const menuTrigger = wrapper.find('.mobile-menu-trigger')
      await menuTrigger.trigger('click')
      expect(wrapper.find('.mobile-menu').classes()).toContain('menu-open')

      const closeButton = wrapper.find('.mobile-menu-close')
      await closeButton.trigger('click')
      expect(wrapper.find('.mobile-menu').classes()).not.toContain('menu-open')
    })
  })

  describe('搜索功能', () => {
    it('应该正确处理搜索操作', async () => {
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('测试搜索')
      await searchInput.trigger('keyup.enter')

      // 验证路由是否正确更新
      expect(wrapper.vm.$router.currentRoute.value.query.keyword).toBe('测试搜索')
    })
  })

  describe('用户认证状态', () => {
    it('未登录时应该显示登录按钮', () => {
      expect(wrapper.find('.auth-button').exists()).toBe(true)
      expect(wrapper.find('.user-menu').exists()).toBe(false)
    })

    it('登录后应该显示用户菜单', async () => {
      // 模拟用户登录状态
      await store.setUserInfo({
        id: '1',
        username: 'testuser',
        name: '测试用户',
        role: 'user',
        permissions: ['read'],
        avatar: 'test.jpg',
      })
      await store.setToken('test-token')

      wrapper = mountComponent()

      expect(wrapper.find('.auth-button').exists()).toBe(false)
      expect(wrapper.find('.user-menu').exists()).toBe(true)
      expect(wrapper.find('.user-dropdown-link').text()).toContain('测试用户')
    })

    it('应该正确处理退出登录', async () => {
      // 模拟用户登录状态
      await store.setUserInfo({
        id: '1',
        username: 'testuser',
        name: '测试用户',
        role: 'user',
        permissions: ['read'],
        avatar: 'test.jpg',
      })
      await store.setToken('test-token')

      wrapper = mountComponent()

      // 模拟下拉菜单命令
      await wrapper.vm.$emit('command', 'logout')
      expect(store.isAuthenticated).toBe(false)
      expect(store.userInfo).toBeNull()
    })
  })
})
