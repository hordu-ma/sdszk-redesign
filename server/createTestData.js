// 简化种子数据
const mongoose = require('mongoose')

// 简化的模型定义，不依赖复杂的验证
const simpleCategorySchema = new mongoose.Schema({
  name: String,
  key: String,
  description: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
})

const simpleNewsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'SimpleCategory' },
  categoryName: String,
  author: String,
  source: {
    name: String,
    url: String,
  },
  publishDate: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
  isSticky: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  tags: [String],
})

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sdszk-redesign')
    console.log('MongoDB连接成功')

    // 使用简化的模型
    const SimpleCategory = mongoose.model('SimpleCategory', simpleCategorySchema, 'newscategories')
    const SimpleNews = mongoose.model('SimpleNews', simpleNewsSchema, 'news')

    // 清空数据
    await SimpleCategory.deleteMany({})
    await SimpleNews.deleteMany({})
    console.log('清空现有数据')

    // 创建分类
    const categories = await SimpleCategory.insertMany([
      { name: '思政要闻', key: 'szyw', description: '思想政治教育要闻', order: 1 },
      { name: '教学资源', key: 'jxzy', description: '思政课教学资源', order: 2 },
      { name: '理论研究', key: 'llyj', description: '思政理论研究', order: 3 },
      { name: '实践活动', key: 'sjhd', description: '思政实践活动', order: 4 },
      { name: '政策解读', key: 'zcjd', description: '教育政策解读', order: 5 },
    ])
    console.log('分类创建成功:', categories.length)

    // 创建新闻
    const newsData = []
    for (let i = 1; i <= 15; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      newsData.push({
        title: `思政课建设重要文章标题 ${i}`,
        summary: `这是第${i}篇关于思政课建设的重要文章摘要，内容涵盖了思想政治教育的核心理念和实践方法。`,
        content: `<h2>思政课建设的重要意义</h2><p>第${i}篇文章，探讨思政课程的核心目标、教学方法创新和师资队伍建设。</p>`,
        category: category._id,
        categoryName: category.name,
        author: `编辑部${Math.ceil(i / 3)}`,
        source: {
          name: ['山东省教育厅', '教育部', '人民日报'][Math.floor(Math.random() * 3)],
          url: `https://example.com/source${i}`,
        },
        publishDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        isSticky: i <= 2,
        viewCount: Math.floor(Math.random() * 500) + 50,
        tags: ['思政教育', '立德树人'][Math.floor(Math.random() * 2) === 0 ? 'slice' : 'slice'](
          0,
          1
        ),
      })
    }

    const news = await SimpleNews.insertMany(newsData)
    console.log('新闻创建成功:', news.length)

    console.log('测试数据创建完成！')
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('创建失败:', error)
    process.exit(1)
  }
}

createTestData()
