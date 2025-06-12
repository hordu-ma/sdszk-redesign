// 调试重启后的问题
import axios from 'axios'

async function debugIssue() {
  console.log('🔍 调试重启后的问题...')

  try {
    // 1. 测试登录
    console.log('\n1️⃣ 测试登录')
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    })

    console.log('登录响应状态:', loginResponse.status)
    console.log('登录响应结构:', Object.keys(loginResponse.data))
    console.log('完整登录响应:', JSON.stringify(loginResponse.data, null, 2))

    if (loginResponse.data.status !== 'success') {
      console.log('❌ 登录失败:', loginResponse.data)
      return
    }

    // 根据实际响应结构获取token
    const token = loginResponse.data.token || loginResponse.data.data?.token
    if (!token) {
      console.log('❌ 无法获取token:', loginResponse.data)
      return
    }
    console.log('✅ Token获取成功:', token.substring(0, 20) + '...')

    // 2. 测试获取新闻列表
    console.log('\n2️⃣ 测试获取新闻列表')
    const newsResponse = await axios.get('http://localhost:3000/api/admin/news?page=1&limit=3', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('新闻列表响应状态:', newsResponse.status)
    console.log('响应数据结构:', Object.keys(newsResponse.data))

    if (newsResponse.data.status !== 'success') {
      console.log('❌ 获取新闻列表失败:', newsResponse.data)
      return
    }

    const newsData = newsResponse.data.data
    console.log('✅ 新闻数据获取成功')
    console.log('总数:', newsData.pagination.total)
    console.log('当前页数量:', newsData.data.length)

    // 3. 检查数据结构
    if (newsData.data.length > 0) {
      console.log('\n3️⃣ 检查第一条新闻数据结构')
      const news = newsData.data[0]
      console.log('新闻字段:', Object.keys(news))
      console.log('ID:', news._id)
      console.log('标题:', news.title)
      console.log('状态:', news.status)
      console.log('分类字段类型:', typeof news.category)
      console.log('分类数据:', news.category)
      console.log('作者字段类型:', typeof news.author)
      console.log('作者数据:', news.author)

      // 4. 模拟前端数据处理
      console.log('\n4️⃣ 模拟前端数据处理')
      const processedNews = {
        ...news,
        id: news._id,
        categoryName: typeof news.category === 'object' ? news.category.name : '未知分类',
      }
      console.log('处理后的数据:', {
        id: processedNews.id,
        title: processedNews.title,
        status: processedNews.status,
        categoryName: processedNews.categoryName,
      })
    }

    console.log('\n✅ 调试完成，后端API工作正常')
  } catch (error) {
    console.error('\n❌ 调试过程中出错:')
    console.error('错误类型:', error.constructor.name)
    console.error('错误信息:', error.message)
    if (error.response) {
      console.error('HTTP状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
}

debugIssue()
