// authTest.ts - 认证状态检查测试工具
import { useUserStore } from '@/stores/user'

interface AuthTestResult {
  testName: string
  passed: boolean
  details: string
  timestamp: string
}

/**
 * 认证状态测试套件
 */
export class AuthTestSuite {
  private results: AuthTestResult[] = []
  private userStore = useUserStore()

  /**
   * 运行所有认证测试
   */
  async runAllTests(): Promise<AuthTestResult[]> {
    console.log('🧪 开始运行认证状态测试套件...')
    this.results = []

    await this.testBasicAuthCheck()
    await this.testSafeAuthCheck()
    await this.testAuthGuard()
    await this.testTokenRecovery()
    await this.testConcurrentAuthCheck()

    this.logResults()
    return this.results
  }

  /**
   * 测试基本认证检查
   */
  private async testBasicAuthCheck(): Promise<void> {
    try {
      const isAuth = this.userStore.isAuthenticated
      const hasToken = !!localStorage.getItem('token')
      const hasUserInfo = !!this.userStore.userInfo

      const passed = typeof isAuth === 'boolean'

      this.addResult('基本认证检查', passed,
        `认证状态: ${isAuth}, Token存在: ${hasToken}, 用户信息: ${hasUserInfo}`)
    } catch (error) {
      this.addResult('基本认证检查', false, `错误: ${error}`)
    }
  }

  /**
   * 测试安全认证检查
   */
  private async testSafeAuthCheck(): Promise<void> {
    try {
      const safeCheck = this.userStore.checkAuthenticationSafely()
      const validCheck = this.userStore.isAuthenticationValid()

      const passed = typeof safeCheck === 'boolean' && typeof validCheck === 'boolean'

      this.addResult('安全认证检查', passed,
        `安全检查: ${safeCheck}, 有效性检查: ${validCheck}`)
    } catch (error) {
      this.addResult('安全认证检查', false, `错误: ${error}`)
    }
  }

  /**
   * 测试认证守卫
   */
  private async testAuthGuard(): Promise<void> {
    try {
      const { requireAuth, isReady } = this.userStore.useAuthGuard()

      // 测试是否正确返回函数
      const hasRequireAuth = typeof requireAuth === 'function'
      const readyState = isReady.value

      this.addResult('认证守卫', hasRequireAuth,
        `requireAuth函数: ${hasRequireAuth}, 准备状态: ${readyState}`)
    } catch (error) {
      this.addResult('认证守卫', false, `错误: ${error}`)
    }
  }

  /**
   * 测试Token恢复机制
   */
  private async testTokenRecovery(): Promise<void> {
    try {
      const originalToken = this.userStore.token
      const storedToken = localStorage.getItem('token')

      // 检查token一致性
      const tokensMatch = originalToken === storedToken

      this.addResult('Token恢复机制', tokensMatch,
        `Store Token与存储Token一致: ${tokensMatch}`)
    } catch (error) {
      this.addResult('Token恢复机制', false, `错误: ${error}`)
    }
  }

  /**
   * 测试并发认证检查
   */
  private async testConcurrentAuthCheck(): Promise<void> {
    try {
      // 同时进行多个认证检查
      const promises = Array(5).fill(0).map(() =>
        this.userStore.checkAuthenticationSafely()
      )

      const results = await Promise.all(promises)
      const allSame = results.every(result => result === results[0])

      this.addResult('并发认证检查', allSame,
        `5个并发检查结果一致: ${allSame}, 结果: [${results.join(', ')}]`)
    } catch (error) {
      this.addResult('并发认证检查', false, `错误: ${error}`)
    }
  }

  /**
   * 添加测试结果
   */
  private addResult(testName: string, passed: boolean, details: string): void {
    this.results.push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 输出测试结果
   */
  private logResults(): void {
    console.log('\n📊 认证测试结果总结:')
    console.log('='.repeat(50))

    let passedCount = 0
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.testName}: ${result.details}`)
      if (result.passed) passedCount++
    })

    console.log('='.repeat(50))
    console.log(`总计: ${passedCount}/${this.results.length} 测试通过`)

    const allPassed = passedCount === this.results.length
    console.log(`🎯 测试套件状态: ${allPassed ? '全部通过' : '有失败项'}`)
  }

  /**
   * 获取测试报告
   */
  getReport(): {
    summary: { total: number; passed: number; failed: number }
    results: AuthTestResult[]
  } {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.length - passed

    return {
      summary: { total: this.results.length, passed, failed },
      results: this.results
    }
  }
}

/**
 * 快速测试函数 - 可在浏览器控制台调用
 */
export async function quickAuthTest(): Promise<void> {
  const testSuite = new AuthTestSuite()
  await testSuite.runAllTests()

    // 将结果暴露到全局以便调试
    ; (window as any).authTestResults = testSuite.getReport()
  console.log('💡 测试结果已保存到 window.authTestResults')
}

/**
 * 模拟认证问题并测试恢复
 */
export async function simulateAuthIssue(): Promise<void> {
  console.log('🔧 模拟认证问题...')

  const userStore = useUserStore()
  const originalToken = userStore.token

  try {
    // 模拟token丢失
    userStore.token = null
    console.log('⚠️ 已模拟token丢失')

    // 测试恢复机制
    const recovered = userStore.checkAuthenticationSafely()
    console.log(`🔄 恢复尝试结果: ${recovered}`)

    // 等待一段时间后检查
    setTimeout(() => {
      const finalState = userStore.isAuthenticated
      console.log(`✅ 最终认证状态: ${finalState}`)
    }, 1000)

  } catch (error) {
    console.error('❌ 模拟测试失败:', error)
    // 恢复原始状态
    userStore.token = originalToken
  }
}

// 将测试函数暴露到全局以便在浏览器控制台中调用
if (typeof window !== 'undefined') {
  ; (window as any).quickAuthTest = quickAuthTest
    ; (window as any).simulateAuthIssue = simulateAuthIssue
  console.log('🛠️ 认证测试工具已加载，可在控制台调用:')
  console.log('  - quickAuthTest(): 运行完整测试套件')
  console.log('  - simulateAuthIssue(): 模拟认证问题')
}
