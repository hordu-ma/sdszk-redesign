import mongoose from 'mongoose'
import axios from 'axios'

console.log('开始完整登录测试...')

const mongoUri = 'mongodb://localhost:27017/sdszk'
co    const testNews = {
      title: `测试新闻 - ${new Date().toLocaleString()}`,
      content: '这是一条测试新闻，用于验证API功能是否正常。',
      summary: '测试新闻摘要',
      category: '6743c8b52fc34c773e9911a4', // 使用正确的字段名
      status: 'published',
      tags: ['测试', 'API']
    };g('连接数据库:', mongoUri)

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ 数据库连接成功')
    testCompleteLoginFlow()
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err)
    process.exit(1)
  })

async function testCompleteLoginFlow() {
  try {
    console.log('\n=== 完整登录流程测试 ===')

    // 步骤1: 测试登录API
    console.log('\n步骤1: 测试管理员登录')
    const loginResponse = await testLogin('admin', 'admin123')

    if (!loginResponse.success) {
      console.log('❌ 登录失败，停止测试')
      return
    }

    const token = loginResponse.token
    console.log('✅ 登录成功，获得token:', token.substring(0, 20) + '...')

    // 步骤2: 测试新闻列表API
    console.log('\n步骤2: 测试新闻列表API')
    const newsListResponse = await testNewsList(token)

    if (newsListResponse.success) {
      console.log('✅ 新闻列表API测试成功')
      console.log('- 新闻总数:', newsListResponse.total)
      console.log('- 返回条数:', newsListResponse.count)
    }

    // 步骤3: 测试新闻创建API
    console.log('\n步骤3: 测试新闻创建API')
    const createResponse = await testNewsCreate(token)

    if (createResponse.success) {
      console.log('✅ 新闻创建API测试成功')
      console.log('- 新创建的新闻ID:', createResponse.newsId)
    }

    // 步骤4: 再次获取新闻列表验证新闻是否创建成功
    console.log('\n步骤4: 验证新闻是否创建成功')
    const finalNewsListResponse = await testNewsList(token)

    if (finalNewsListResponse.success) {
      console.log('✅ 验证成功')
      console.log('- 最新新闻总数:', finalNewsListResponse.total)
      console.log('- 比之前增加了:', finalNewsListResponse.total - newsListResponse.total, '条')

      // 显示最新的几条新闻
      if (finalNewsListResponse.data && finalNewsListResponse.data.length > 0) {
        console.log('\n最新的3条新闻:')
        finalNewsListResponse.data.slice(0, 3).forEach((news, index) => {
          console.log(`${index + 1}. ${news.title} (ID: ${news._id})`)
        })
      }
    }

    console.log('\n🎉 完整测试流程完成！')
  } catch (error) {
    console.error('❌ 测试过程出错:', error)
  } finally {
    mongoose.connection.close()
    console.log('\n数据库连接已关闭')
  }
}

async function testLogin(username, password) {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: username,
      password: password,
    })

    console.log('  ✅ 登录请求成功')
    console.log('  - 状态码:', response.status)
    console.log('  - 用户信息:', response.data.user?.username)

    return {
      success: true,
      token: response.data.token,
      user: response.data.user,
    }
  } catch (error) {
    console.log('  ❌ 登录请求失败')
    if (error.response) {
      console.log('  - 状态码:', error.response.status)
      console.log('  - 错误信息:', error.response.data?.message || error.response.data)
    } else {
      console.log('  - 网络错误:', error.message)
    }
    return { success: false }
  }
}

async function testNewsList(token) {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/news?page=1&pageSize=10', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log('  ✅ 新闻列表请求成功')
    console.log('  - 状态码:', response.status)

    return {
      success: true,
      total: response.data.total || response.data.data?.length || 0,
      count: response.data.data?.length || 0,
      data: response.data.data,
    }
  } catch (error) {
    console.log('  ❌ 新闻列表请求失败')
    if (error.response) {
      console.log('  - 状态码:', error.response.status)
      console.log('  - 错误信息:', error.response.data?.message || error.response.data)
    } else {
      console.log('  - 网络错误:', error.message)
    }
    return { success: false }
  }
}

async function testNewsCreate(token) {
  try {
    const testNews = {
      title: `测试新闻 - ${new Date().toLocaleString()}`,
      content: '这是一条测试新闻，用于验证API功能是否正常。',
      summary: '测试新闻摘要',
      categoryId: '6743c8b52fc34c773e9911a4', // 使用已知的分类ID
      status: 'published',
      tags: ['测试', 'API'],
    }

    const response = await axios.post('http://localhost:3000/api/admin/news', testNews, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('  ✅ 新闻创建请求成功')
    console.log('  - 状态码:', response.status)
    console.log('  - 新闻标题:', response.data.title)

    return {
      success: true,
      newsId: response.data._id || response.data.id,
    }
  } catch (error) {
    console.log('  ❌ 新闻创建请求失败')
    if (error.response) {
      console.log('  - 状态码:', error.response.status)
      console.log('  - 错误信息:', error.response.data?.message || error.response.data)
    } else {
      console.log('  - 网络错误:', error.message)
    }
    return { success: false }
  }
}
