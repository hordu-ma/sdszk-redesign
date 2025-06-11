// 数据库新闻创建调试脚本
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import News from './models/News.js'
import User from './models/User.js'
import NewsCategory from './models/NewsCategory.js'

dotenv.config()

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  }
}

const checkNewsCreation = async () => {
  await connectDB()

  console.log('\n🔍 检查新闻创建流程...')

  try {
    // 1. 检查是否有管理员用户
    console.log('\n1. 检查管理员用户:')
    const adminUser = await User.findOne({ role: 'admin' })
    if (adminUser) {
      console.log(`✅ 找到管理员用户: ${adminUser.username} (ID: ${adminUser._id})`)
    } else {
      console.log('❌ 未找到管理员用户')
      return
    }

    // 2. 检查是否有分类
    console.log('\n2. 检查新闻分类:')
    const categories = await NewsCategory.find({})
    console.log(`✅ 找到 ${categories.length} 个分类:`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat._id})`)
    })

    if (categories.length === 0) {
      console.log('❌ 没有新闻分类，无法创建新闻')
      return
    }

    // 3. 尝试创建测试新闻
    console.log('\n3. 尝试创建测试新闻:')
    const testNewsData = {
      title: '测试新闻 - ' + new Date().toLocaleString(),
      content:
        '这是一条测试新闻内容，用于验证新闻创建功能是否正常工作。内容长度必须超过50个字符才能通过验证规则。',
      summary: '测试新闻摘要',
      category: categories[0]._id, // 使用第一个分类
      status: 'published',
      author: adminUser._id,
      createdBy: adminUser._id,
      isTop: false,
      isFeatured: false,
      tags: ['测试', '调试'],
      publishDate: new Date(),
    }

    console.log('准备创建的新闻数据:')
    console.log(JSON.stringify(testNewsData, null, 2))

    const newNews = new News(testNewsData)
    const savedNews = await newNews.save()

    console.log('✅ 新闻创建成功!')
    console.log(`   新闻ID: ${savedNews._id}`)
    console.log(`   标题: ${savedNews.title}`)
    console.log(`   状态: ${savedNews.status}`)
    console.log(`   分类: ${savedNews.category}`)

    // 4. 验证新闻是否能被查询到
    console.log('\n4. 验证新闻查询:')
    const allNews = await News.find({}).populate('category', 'name').populate('author', 'username')
    console.log(`✅ 数据库中共有 ${allNews.length} 条新闻`)

    console.log('最近的5条新闻:')
    allNews.slice(-5).forEach((news, index) => {
      console.log(
        `   ${index + 1}. ${news.title} - ${news.status} - ${news.category?.name || '无分类'}`
      )
    })

    // 5. 检查刚创建的新闻
    const createdNews = await News.findById(savedNews._id)
      .populate('category', 'name')
      .populate('author', 'username')
    if (createdNews) {
      console.log('\n✅ 刚创建的新闻查询成功:')
      console.log(`   标题: ${createdNews.title}`)
      console.log(`   分类: ${createdNews.category?.name}`)
      console.log(`   作者: ${createdNews.author?.username}`)
      console.log(`   状态: ${createdNews.status}`)
      console.log(`   创建时间: ${createdNews.createdAt}`)
    } else {
      console.log('❌ 无法查询到刚创建的新闻')
    }
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message)
    console.error('完整错误信息:', error)
  } finally {
    mongoose.connection.close()
    console.log('\n📊 测试完成')
  }
}

checkNewsCreation()
