import mongoose from 'mongoose'
import News from './models/News.js'
import NewsCategory from './models/NewsCategory.js'
import User from './models/User.js'

console.log('检查新闻数据...')

mongoose
  .connect('mongodb://localhost:27017/sdszk')
  .then(() => {
    console.log('✅ 数据库连接成功')
    checkNews()
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err)
    process.exit(1)
  })

async function checkNews() {
  try {
    console.log('\n=== 新闻数据检查 ===')

    // 获取新闻总数
    const totalCount = await News.countDocuments()
    console.log('📊 新闻总数:', totalCount)

    // 获取最新的5条新闻
    const latestNews = await News.find()
      .populate('category', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5)

    console.log('\n📰 最新5条新闻:')
    latestNews.forEach((news, index) => {
      console.log(`${index + 1}. ${news.title}`)
      console.log(`   - ID: ${news._id}`)
      console.log(`   - 状态: ${news.status}`)
      console.log(`   - 分类: ${news.category?.name || '未知'}`)
      console.log(`   - 作者: ${news.createdBy?.username || '未知'}`)
      console.log(`   - 创建时间: ${news.createdAt}`)
      console.log('')
    })

    // 检查分类
    const categories = await NewsCategory.find()
    console.log('\n📂 新闻分类:')
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat._id})`)
    })
  } catch (error) {
    console.error('❌ 检查过程出错:', error)
  } finally {
    mongoose.connection.close()
    console.log('\n数据库连接已关闭')
  }
}
