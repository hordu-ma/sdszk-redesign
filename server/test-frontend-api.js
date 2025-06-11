// 测试前端API调用
import axios from 'axios'

const testFrontendAPI = async () => {
  console.log('🔍 测试前端新闻列表API调用...')

  try {
    // 1. 测试基础新闻列表API
    console.log('\n1. 测试新闻列表API:')
    const response1 = await axios.get('http://localhost:3000/api/admin/news', {
      params: {
        page: 1,
        limit: 20,
      },
    })

    console.log('✅ API调用成功')
    console.log(`状态码: ${response1.status}`)
    console.log(`数据结构:`, JSON.stringify(response1.data, null, 2))

    if (response1.data.status === 'success') {
      const newsData = response1.data.data
      console.log(`✅ 返回的新闻数量: ${newsData.data?.length || 0}`)
      console.log(`✅ 总记录数: ${newsData.pagination?.total || 0}`)

      if (newsData.data && newsData.data.length > 0) {
        console.log('前3条新闻:')
        newsData.data.slice(0, 3).forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title} - ${news.status}`)
        })
      }
    }

    // 2. 测试带认证的API调用
    console.log('\n2. 测试认证状态:')

    // 检查token
    const token = process.env.TEST_TOKEN || 'no-token'
    console.log(`当前测试token: ${token.substring(0, 20)}...`)

    const response2 = await axios.get('http://localhost:3000/api/admin/news', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 1,
        limit: 5,
      },
    })

    console.log('✅ 带认证的API调用成功')
    console.log(`返回数据量: ${response2.data.data?.data?.length || 0}`)
  } catch (error) {
    console.error('❌ API调用失败:')
    if (error.response) {
      console.error(`状态码: ${error.response.status}`)
      console.error(`响应数据:`, error.response.data)
    } else {
      console.error(`错误信息: ${error.message}`)
    }
  }
}

testFrontendAPI()
