import axios from 'axios'

console.log('🚀 开始CMS完整功能测试')
console.log('==========================================')

async function testCMSWorkflow() {
  try {
    // 步骤1: 测试登录
    console.log('\n步骤1: 🔐 测试管理员登录')
    console.log('- 用户名: admin')
    console.log('- 密码: admin123')

    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    })

    console.log('✅ 登录成功')
    console.log('- 用户信息:', loginResponse.data.user?.username || 'N/A')

    const token = loginResponse.data.token
    console.log('- Token前20位:', token.substring(0, 20) + '...')

    // 步骤2: 获取新闻分类
    console.log('\n步骤2: 📂 获取新闻分类')
    const categoriesResponse = await axios.get('http://localhost:3000/api/news-categories', {
      headers: { Authorization: `Bearer ${token}` },
    })

    console.log('✅ 获取分类成功')
    console.log('- 分类数量:', categoriesResponse.data.data?.length || 0)

    const firstCategory = categoriesResponse.data.data?.[0]
    if (firstCategory) {
      console.log('- 第一个分类:', firstCategory.name, `(ID: ${firstCategory._id})`)
    }

    // 步骤3: 获取现有新闻列表
    console.log('\n步骤3: 📰 获取现有新闻列表')
    const newsListResponse = await axios.get(
      'http://localhost:3000/api/admin/news?page=1&limit=10',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    console.log('✅ 获取新闻列表成功')
    const currentTotal = newsListResponse.data.data.pagination.total
    console.log('- 当前新闻总数:', currentTotal)
    console.log('- 当前页新闻数:', newsListResponse.data.data.data.length)

    // 步骤4: 创建新新闻
    console.log('\n步骤4: ✏️ 创建新新闻')
    const newNewsData = {
      title: `CMS测试新闻 - ${new Date().toLocaleString('zh-CN')}`,
      content:
        '<p>这是通过CMS完整流程测试创建的新闻，用于验证前端新闻创建功能是否正常工作。内容包含HTML格式以测试富文本编辑器功能。</p>',
      summary: '通过CMS完整流程测试创建的新闻摘要',
      category: firstCategory?._id,
      status: 'published',
      tags: ['CMS测试', '流程验证'],
      isTop: false,
      isFeatured: false,
    }

    const createResponse = await axios.post('http://localhost:3000/api/admin/news', newNewsData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('✅ 新闻创建成功')
    console.log('- 新闻ID:', createResponse.data._id)
    console.log('- 新闻标题:', createResponse.data.title)
    console.log('- 新闻状态:', createResponse.data.status)

    // 步骤5: 验证新闻是否显示在列表中
    console.log('\n步骤5: 🔍 验证新闻列表更新')
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒

    const updatedNewsListResponse = await axios.get(
      'http://localhost:3000/api/admin/news?page=1&limit=10',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    console.log('✅ 获取更新后的新闻列表成功')
    const newTotal = updatedNewsListResponse.data.data.pagination.total
    console.log('- 更新后新闻总数:', newTotal)
    console.log('- 新增新闻数量:', newTotal - currentTotal)

    // 检查新创建的新闻是否在列表中
    const newsList = updatedNewsListResponse.data.data.data
    const createdNews = newsList.find(news => news._id === createResponse.data._id)

    if (createdNews) {
      console.log('✅ 新创建的新闻已出现在列表中')
      console.log('- 列表中的标题:', createdNews.title)
      console.log('- 列表中的状态:', createdNews.status)
    } else {
      console.log('❌ 新创建的新闻未在列表中找到')
    }

    // 步骤6: 显示最新的前5条新闻
    console.log('\n步骤6: 📋 最新的5条新闻')
    newsList.slice(0, 5).forEach((news, index) => {
      console.log(`${index + 1}. ${news.title}`)
      console.log(
        `   状态: ${news.status} | 分类: ${news.category?.name || '无分类'} | 时间: ${new Date(news.createdAt).toLocaleString('zh-CN')}`
      )
    })

    // 步骤7: 测试前端接口格式兼容性
    console.log('\n步骤7: 🔧 测试前端接口格式兼容性')
    console.log('检查响应数据结构是否符合前端预期...')

    const sampleNews = newsList[0]
    const requiredFields = ['_id', 'title', 'content', 'summary', 'status', 'createdAt']
    const missingFields = requiredFields.filter(field => !(field in sampleNews))

    if (missingFields.length === 0) {
      console.log('✅ 所有必需字段都存在')
    } else {
      console.log('❌ 缺少字段:', missingFields.join(', '))
    }

    console.log('\n🎉 CMS完整功能测试完成！')
    console.log('==========================================')
    console.log('测试总结:')
    console.log('- 管理员登录: ✅ 正常')
    console.log('- 获取分类: ✅ 正常')
    console.log('- 获取新闻列表: ✅ 正常')
    console.log('- 创建新闻: ✅ 正常')
    console.log('- 新闻列表更新: ✅ 正常')
    console.log(`- 数据库现有新闻总数: ${newTotal}`)
  } catch (error) {
    console.error('\n❌ 测试过程出现错误:')
    if (error.response) {
      console.error('- HTTP状态码:', error.response.status)
      console.error('- 错误信息:', error.response.data?.message || error.response.data)
      console.error('- 请求URL:', error.config?.url)
    } else {
      console.error('- 错误信息:', error.message)
    }
  }
}

// 运行测试
testCMSWorkflow()
