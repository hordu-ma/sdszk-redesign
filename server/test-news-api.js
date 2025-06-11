import axios from 'axios'

async function testNewsAPI() {
  try {
    // 首先登录获取token
    console.log('🔐 执行登录...')
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    })

    const token = loginResponse.data.token
    console.log('✅ 登录成功')

    // 测试新闻列表API
    console.log('\n📰 测试新闻列表API...')
    const response = await axios.get('http://localhost:3000/api/admin/news?page=1&limit=5', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log('✅ API响应成功')
    console.log('- 状态码:', response.status)
    console.log('- 响应结构:', Object.keys(response.data))

    if (response.data.data) {
      console.log('- data结构:', Object.keys(response.data.data))
      console.log('- 新闻列表长度:', response.data.data.data?.length || 0)
      console.log('- 分页信息:', response.data.data.pagination)

      if (response.data.data.data && response.data.data.data.length > 0) {
        console.log('\n📄 第一条新闻详情:')
        const firstNews = response.data.data.data[0]
        console.log('- 标题:', firstNews.title)
        console.log('- ID:', firstNews._id)
        console.log('- 状态:', firstNews.status)
        console.log('- 创建时间:', firstNews.createdAt)
        console.log('- 分类ID:', firstNews.category)
        console.log('- 作者ID:', firstNews.author)
        console.log('- 创建者ID:', firstNews.createdBy)
      }
    }

    console.log('\n完整响应数据:')
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message)
  }
}

testNewsAPI()
