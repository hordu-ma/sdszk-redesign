import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BackToTop from '../BackToTop.vue'

describe('BackToTop Component', () => {
  beforeEach(() => {
    // 模拟 window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    })

    // 模拟 window.scrollTo
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    // 清除所有事件监听器
    window.scrollY = 0
  })

  it('初始状态下按钮应该是隐藏的', () => {
    const wrapper = mount(BackToTop)
    expect(wrapper.classes()).not.toContain('visible')
  })

  it('当滚动超过300px时按钮应该显示', async () => {
    const wrapper = mount(BackToTop)

    // 模拟滚动事件
    window.scrollY = 301
    await window.dispatchEvent(new Event('scroll'))

    expect(wrapper.classes()).toContain('visible')
  })

  it('当滚动小于300px时按钮应该隐藏', async () => {
    const wrapper = mount(BackToTop)

    // 先滚动到显示位置
    window.scrollY = 301
    await window.dispatchEvent(new Event('scroll'))

    // 再滚动回隐藏位置
    window.scrollY = 299
    await window.dispatchEvent(new Event('scroll'))

    expect(wrapper.classes()).not.toContain('visible')
  })

  it('点击按钮应该调用scrollTo方法', async () => {
    const wrapper = mount(BackToTop)

    await wrapper.trigger('click')

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  it('组件卸载时应该移除滚动事件监听器', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(BackToTop)

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('组件应该正确渲染图标', () => {
    const wrapper = mount(BackToTop)
    expect(wrapper.find('i.fas.fa-arrow-up').exists()).toBe(true)
  })

  it('组件应该有正确的样式类', () => {
    const wrapper = mount(BackToTop)
    expect(wrapper.classes()).toContain('back-to-top')
  })
})
