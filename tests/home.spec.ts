import { test, expect } from '@playwright/test'

test.describe('首页六大区块前后端联动', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('通知公告区块应正常显示', async ({ page }) => {
    const noticeBlock = page.locator('.info-block.notice')
    await expect(noticeBlock).toBeVisible()
    await expect(noticeBlock.locator('.info-title')).not.toHaveCount(0)
  })

  test('政策文件区块应正常显示', async ({ page }) => {
    const policyBlock = page.locator('.info-block.policy')
    await expect(policyBlock).toBeVisible()
    await expect(policyBlock.locator('.info-title')).not.toHaveCount(0)
  })

  test('理论前沿区块应正常显示', async ({ page }) => {
    const theoryBlock = page.locator('.info-block.theory')
    await expect(theoryBlock).toBeVisible()
    await expect(theoryBlock.locator('.info-title')).not.toHaveCount(0)
    // 测试"更多"跳转
    await theoryBlock.locator('.more-link').click()
    await expect(page).toHaveURL(/\/resources\/category\/theory/)
  })

  test('教学研究区块应正常显示', async ({ page }) => {
    const teachingBlock = page.locator('.info-block.teaching')
    await expect(teachingBlock).toBeVisible()
    await expect(teachingBlock.locator('.info-title')).not.toHaveCount(0)
    // 测试"更多"跳转
    await teachingBlock.locator('.more-link').click()
    await expect(page).toHaveURL(/\/resources\/category\/teaching/)
  })

  test('影像思政区块应正常显示', async ({ page }) => {
    const videoBlock = page.locator('.video-section')
    await expect(videoBlock).toBeVisible()
    await expect(videoBlock.locator('.video-card')).not.toHaveCount(0)
    // 测试"更多"跳转
    await videoBlock.locator('.more-link').click()
    await expect(page).toHaveURL(/\/resources\/category\/video/)
  })

  test('资源详情页跳转与内容', async ({ page }) => {
    // 点击理论前沿第一个资源
    const firstTheory = page.locator('.info-block.theory .info-link').first()
    await firstTheory.click()
    await expect(page).toHaveURL(/\/resources\/detail\//)
    // 检查详情页标题
    await expect(page.locator('.resource-header h2')).toBeVisible()
  })
})
