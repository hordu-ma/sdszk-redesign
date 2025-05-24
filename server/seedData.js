// 种子数据 - 用于测试API功能
import mongoose from 'mongoose'
import { NewsCategory, News, User } from './models/index.js'

const seedData = async () => {
  try {
    // 连接到MongoDB
    await mongoose.connect('mongodb://localhost:27017/sdszk-redesign')
    console.log('MongoDB连接成功')

    // 清空现有数据
    await User.deleteMany({})
    await NewsCategory.deleteMany({})
    await News.deleteMany({})
    console.log('清空现有数据')

    // 创建系统用户
    const systemUser = await User.create({
      username: 'system',
      email: 'system@sdszk.com',
      password: 'password123',
      realName: '系统管理员',
      role: 'admin',
      status: 'active',
    })
    console.log('创建系统用户成功:', systemUser._id)

    // 创建新闻分类
    const categories = await NewsCategory.insertMany([
      {
        name: '思政要闻',
        key: 'szyw',
        description: '思想政治教育要闻',
        order: 1,
        isActive: true,
        createdBy: systemUser._id,
      },
      {
        name: '教学资源',
        key: 'jxzy',
        description: '思政课教学资源',
        order: 2,
        isActive: true,
        createdBy: systemUser._id,
      },
      {
        name: '理论研究',
        key: 'llyj',
        description: '思政理论研究',
        order: 3,
        isActive: true,
        createdBy: systemUser._id,
      },
      {
        name: '实践活动',
        key: 'sjhd',
        description: '思政实践活动',
        order: 4,
        isActive: true,
        createdBy: systemUser._id,
      },
      {
        name: '政策解读',
        key: 'zcjd',
        description: '教育政策解读',
        order: 5,
        isActive: true,
        createdBy: systemUser._id,
      },
    ])

    console.log('创建新闻分类成功:', categories.length)

    // 创建示例新闻
    const newsData = []
    const categoryIds = categories.map(cat => cat._id)

    for (let i = 1; i <= 20; i++) {
      const randomCategoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)]
      const category = categories.find(cat => cat._id.equals(randomCategoryId))

      newsData.push({
        title: `思政课建设重要文章标题 ${i}`,
        summary: `这是第${i}篇关于思政课建设的重要文章摘要，内容涵盖了思想政治教育的核心理念和实践方法。`,
        content: `
          <h2>思政课建设的重要意义</h2>
          <p>思想政治理论课是落实立德树人根本任务的关键课程，承担着引导学生扣好人生第一粒扣子的重要使命。第${i}篇文章将从以下几个方面进行深入探讨：</p>
          
          <h3>一、思政课程的核心目标</h3>
          <p>思政课程旨在培养学生正确的世界观、人生观、价值观，增强学生的政治认同、思想认同、理论认同、情感认同。</p>
          
          <h3>二、教学方法创新</h3>
          <p>通过案例教学、实践教学、网络教学等多种形式，提高思政课的针对性和实效性。</p>
          
          <h3>三、师资队伍建设</h3>
          <p>加强思政课教师队伍建设，提升教师的理论水平和教学能力。</p>
          
          <p>思政课建设是一项系统工程，需要全社会的共同努力和支持。</p>
        `,
        category: randomCategoryId,
        categoryName: category.name,
        author: `编辑部${Math.ceil(i / 4)}`,
        source: {
          name: ['山东省教育厅', '教育部', '人民日报', '光明日报', '中国教育报'][
            Math.floor(Math.random() * 5)
          ],
          url: `https://example.com/source${i}`,
        },
        publishDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机过去30天内的日期
        isPublished: true,
        isSticky: i <= 3, // 前3篇置顶
        viewCount: Math.floor(Math.random() * 1000) + 100,
        tags: ['思政教育', '立德树人', '教学改革'].slice(0, Math.floor(Math.random() * 3) + 1),
        createdBy: systemUser._id,
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
