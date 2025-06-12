// 简单的前端API测试
async function testFrontendAPI() {
  console.log('=== 前端API测试 ===')

  try {
    // 1. 测试登录
    console.log('\n1. 测试登录API')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    })

    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log('✅ 登录成功:', loginData.status)

    const token = loginData.token
    console.log('Token:', token.substring(0, 20) + '...')

    // 2. 测试新闻列表API
    console.log('\n2. 测试新闻列表API')
    const newsResponse = await fetch('http://localhost:3000/api/admin/news?page=1&limit=3', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!newsResponse.ok) {
      throw new Error(`新闻列表请求失败: ${newsResponse.status}`)
    }

    const newsData = await newsResponse.json()
    console.log('✅ 新闻列表获取成功')
    console.log('状态:', newsData.status)
    console.log('总数:', newsData.data?.pagination?.total || '未知')
    console.log('当前页:', newsData.data?.data?.length || 0, '条')

    // 3. 检查第一条数据结构
    if (newsData.data?.data?.length > 0) {
      const firstNews = newsData.data.data[0]
      console.log('\n3. 第一条新闻数据结构')
      console.log('ID:', firstNews._id)
      console.log('标题:', firstNews.title)
      console.log('分类:', firstNews.category)
      console.log('作者:', firstNews.author)
    }

    // 4. 更新localStorage
    console.log('\n4. 更新本地存储')
    localStorage.setItem('token', token)
    console.log('✅ Token已保存到localStorage')

    return { success: true, token, newsData }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 在控制台中运行测试
console.log('请在浏览器控制台中运行: testFrontendAPI()')

// 导出到全局
window.testFrontendAPI = testFrontendAPI
