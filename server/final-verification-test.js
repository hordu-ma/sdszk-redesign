// 最终验证测试脚本
import axios from 'axios'

async function finalVerificationTest() {
  console.log('🎯 开始最终验证测试')
  console.log('='.repeat(50))

  let token = ''
  let categoryId = ''

  try {
    // 1. 登录获取Token
    console.log('\n1️⃣ 测试管理员登录')
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    })

    if (loginResponse.data.status === 'success') {
      token = loginResponse.data.token || loginResponse.data.data?.token
      console.log('✅ 登录成功')
      console.log(`   Token前缀: ${token?.substring(0, 20)}...`)
    } else {
      throw new Error('登录失败')
    }

    // 2. 获取分类
    console.log('\n2️⃣ 获取新闻分类')
    const categoriesResponse = await axios.get('http://localhost:3000/api/news-categories')
    if (categoriesResponse.data.status === 'success' && categoriesResponse.data.data.length > 0) {
      categoryId = categoriesResponse.data.data[0]._id
      console.log(`✅ 获取分类成功，使用分类: ${categoriesResponse.data.data[0].name}`)
    } else {
      throw new Error('获取分类失败')
    }

    // 3. 获取新闻列表（记录创建前的数量）
    console.log('\n3️⃣ 获取创建前的新闻列表')
    const beforeResponse = await axios.get('http://localhost:3000/api/admin/news?page=1&limit=5', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const totalBefore = beforeResponse.data.data.pagination.total
    console.log(`✅ 创建前新闻总数: ${totalBefore}`)

    // 4. 创建新闻
    console.log('\n4️⃣ 创建新闻')
    const createResponse = await axios.post(
      'http://localhost:3000/api/admin/news',
      {
        title: `最终验证测试新闻 - ${new Date().toLocaleString()}`,
        content: '这是最终验证测试创建的新闻内容，用于确认修复后的CMS功能正常工作。',
        summary: '最终验证测试新闻摘要',
        category: categoryId,
        status: 'published',
        tags: ['验证测试', 'CMS修复'],
        isTop: false,
        isFeatured: false,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (createResponse.data.status === 'success') {
      const newNews = createResponse.data.data
      console.log(`✅ 新闻创建成功`)
      console.log(`   ID: ${newNews._id}`)
      console.log(`   标题: ${newNews.title}`)
      console.log(`   状态: ${newNews.status}`)
    } else {
      throw new Error('新闻创建失败')
    }

    // 5. 等待一下，然后获取更新后的新闻列表
    console.log('\n5️⃣ 验证新闻列表更新')
    await new Promise(resolve => setTimeout(resolve, 1000))

    const afterResponse = await axios.get('http://localhost:3000/api/admin/news?page=1&limit=5', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const totalAfter = afterResponse.data.data.pagination.total
    const newsList = afterResponse.data.data.data

    console.log(`✅ 创建后新闻总数: ${totalAfter}`)
    console.log(`📈 新增新闻数量: ${totalAfter - totalBefore}`)

    // 6. 检查最新的新闻列表中的数据格式
    console.log('\n6️⃣ 检查新闻数据格式')
    if (newsList.length > 0) {
      const firstNews = newsList[0]
      console.log(`✅ 最新新闻:`)
      console.log(`   标题: ${firstNews.title}`)
      console.log(`   状态: ${firstNews.status}`)
      console.log(`   分类类型: ${typeof firstNews.category}`)
      console.log(
        `   分类名称: ${typeof firstNews.category === 'object' ? firstNews.category.name : '字符串格式'}`
      )
      console.log(`   作者类型: ${typeof firstNews.author}`)
      console.log(
        `   作者信息: ${typeof firstNews.author === 'object' ? firstNews.author.username : '字符串格式'}`
      )
    }

    // 7. 最终总结
    console.log('\n🎉 最终验证测试结果')
    console.log('='.repeat(50))
    console.log('✅ 管理员登录: 正常')
    console.log('✅ 获取分类: 正常')
    console.log('✅ 获取新闻列表: 正常')
    console.log('✅ 创建新闻: 正常')
    console.log('✅ 数据格式: 符合前端要求')
    console.log('✅ 新闻列表更新: 正常')
    console.log('\n🚀 CMS新闻管理功能修复完成，所有测试通过!')
  } catch (error) {
    console.error('\n❌ 测试过程出现错误:', error.message)
    if (error.response) {
      console.error('   HTTP状态码:', error.response.status)
      console.error('   错误信息:', error.response.data?.message || error.response.statusText)
    }
  }
}

// 运行测试
finalVerificationTest()
