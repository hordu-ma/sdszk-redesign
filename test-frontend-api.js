// 测试前端API调用
async function testFrontendAPIs() {
  const token =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDNjOGI0MmZjMzRjNzczZTk5MTE5ZSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjU1NTg3OTQsImV4cCI6MTc2NTU2MjM5NH0.y5kTKYUlCEhf14xBSQO5J_1YmvKAPaGLYJHNpCMsL-s'

  console.log('🧪 测试前端API调用')
  console.log('====================')

  try {
    // 1. 测试获取新闻分类
    console.log('\n1️⃣ 测试获取新闻分类 /api/news-categories')
    const categoriesResponse = await fetch('http://localhost:3000/api/news-categories')
    const categoriesData = await categoriesResponse.json()
    console.log('✅ 分类API响应:', categoriesData)

    // 2. 测试获取新闻列表（管理员）
    console.log('\n2️⃣ 测试获取新闻列表（管理员）/api/admin/news')
    const newsResponse = await fetch('http://localhost:3000/api/admin/news?page=1&limit=5', {
      headers: { Authorization: token },
    })
    const newsData = await newsResponse.json()
    console.log('✅ 新闻列表API响应:', JSON.stringify(newsData, null, 2))

    // 3. 测试创建新闻
    console.log('\n3️⃣ 测试创建新闻')
    const createResponse = await fetch('http://localhost:3000/api/admin/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        title: '前端API测试新闻',
        content: '这是通过前端API创建的测试新闻内容。',
        summary: '前端API测试摘要',
        category: categoriesData.data[0]._id,
        status: 'published',
        tags: ['测试', 'API'],
      }),
    })
    const createData = await createResponse.json()
    console.log('✅ 创建新闻API响应:', JSON.stringify(createData, null, 2))

    // 4. 再次获取新闻列表验证
    console.log('\n4️⃣ 验证新闻列表更新')
    const updatedNewsResponse = await fetch('http://localhost:3000/api/admin/news?page=1&limit=5', {
      headers: { Authorization: token },
    })
    const updatedNewsData = await updatedNewsResponse.json()
    console.log('✅ 更新后的新闻列表:', JSON.stringify(updatedNewsData, null, 2))
  } catch (error) {
    console.error('❌ 测试过程出错:', error)
  }
}

// 在浏览器环境中运行测试
testFrontendAPIs()
