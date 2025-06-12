// 测试登录和访问新闻列表API的脚本
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testLoginAndNewsApi() {
  try {
    console.log('🚀 开始测试登录流程...')

    // 1. 登录
    console.log('\n1. 测试登录...')
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    })

    const loginData = await loginResponse.json()
    console.log('登录响应状态:', loginResponse.status)
    console.log('登录响应数据:', JSON.stringify(loginData, null, 2))

    if (loginResponse.status !== 200 || !loginData.token) {
      console.log('❌ 登录失败')
      return
    }

    const token = loginData.token
    console.log('✅ 登录成功，获得token:', token.substring(0, 20) + '...')

    // 2. 测试获取新闻列表API
    console.log('\n2. 测试获取新闻列表API...')
    const newsResponse = await fetch(`${BASE_URL}/api/admin/news?page=1&limit=20`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('新闻API响应状态:', newsResponse.status)
    const newsData = await newsResponse.json()
    console.log('新闻API响应数据:', JSON.stringify(newsData, null, 2))

    // 3. 测试获取分类列表API
    console.log('\n3. 测试获取分类列表API...')
    const categoryResponse = await fetch(`${BASE_URL}/api/news/categories`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('分类API响应状态:', categoryResponse.status)
    const categoryData = await categoryResponse.json()
    console.log('分类API响应数据:', JSON.stringify(categoryData, null, 2))
  } catch (error) {
    console.error('测试过程中出错:', error)
  }
}

testLoginAndNewsApi()
