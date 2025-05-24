const mongoose = require('mongoose')

// 直接定义简单的模型
const newsCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
})

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: String,
  content: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsCategory' },
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

const NewsCategory = mongoose.model('NewsCategory', newsCategorySchema)
const News = mongoose.model('News', newsSchema)

async function seedData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sdszk-redesign')
    console.log('MongoDB连接成功')

    // 清空现有数据
    await NewsCategory.deleteMany({})
    await News.deleteMany({})
    console.log('清空现有数据')

    // 创建新闻分类
    const categories = await NewsCategory.insertMany([
      { name: '思政要闻', key: 'szyw', description: '思想政治教育要闻', order: 1, isActive: true },
      { name: '教学资源', key: 'jxzy', description: '思政课教学资源', order: 2, isActive: true },
      { name: '理论研究', key: 'llyj', description: '思政理论研究', order: 3, isActive: true },
      { name: '实践活动', key: 'sjhd', description: '思政实践活动', order: 4, isActive: true },
      { name: '政策解读', key: 'zcjd', description: '教育政策解读', order: 5, isActive: true },
    ])

    console.log('创建新闻分类成功:', categories.length)

    // 创建示例新闻
    const newsData = []
    for (let i = 1; i <= 20; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]

      newsData.push({
        title: `思政课建设重要文章标题 ${i}`,
        summary: `这是第${i}篇关于思政课建设的重要文章摘要，内容涵盖了思想政治教育的核心理念和实践方法。`,
        content: `<h2>思政课建设的重要意义</h2><p>思想政治理论课是落实立德树人根本任务的关键课程。第${i}篇文章探讨思政课程的核心目标、教学方法创新和师资队伍建设。</p>`,
        category: randomCategory._id,
        categoryName: randomCategory.name,
        author: `编辑部${Math.ceil(i / 4)}`,
        source: {
          name: ['山东省教育厅', '教育部', '人民日报', '光明日报', '中国教育报'][
            Math.floor(Math.random() * 5)
          ],
          url: `https://example.com/source${i}`,
        },
        publishDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        isPublished: true,
        isSticky: i <= 3,
        viewCount: Math.floor(Math.random() * 1000) + 100,
        tags: ['思政教育', '立德树人', '教学改革'].slice(0, Math.floor(Math.random() * 3) + 1),
      })
    }

    const news = await News.insertMany(newsData)
    console.log('创建示例新闻成功:', news.length)

    console.log('种子数据初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('种子数据初始化失败:', error)
    process.exit(1)
  }
}

seedData()
