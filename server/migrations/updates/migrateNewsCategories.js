import mongoose from 'mongoose'
import News from '../models/News.js'
import NewsCategory from '../models/NewsCategory.js'

const CATEGORY_MAP = {
  center: '中心动态',
  notice: '通知公告',
  policy: '政策文件',
}

export async function up() {
  try {
    console.log('开始迁移新闻分类数据...')

    // 获取系统管理员用户
    const adminUser = await mongoose.model('User').findOne({ role: 'admin' })
    if (!adminUser) {
      throw new Error('未找到系统管理员用户')
    }

    // 获取所有新闻
    const news = await News.find({})
    console.log(`找到 ${news.length} 条新闻需要迁移`)

    // 获取核心分类
    const categories = await NewsCategory.find({ isCore: true })
    const categoryMap = categories.reduce((map, cat) => {
      map[cat.key] = cat._id
      return map
    }, {})

    // 更新每条新闻的分类
    let updated = 0
    for (const item of news) {
      const oldCategory = item.category
      const categoryId = categoryMap[oldCategory]

      if (categoryId) {
        await News.findByIdAndUpdate(item._id, {
          $set: {
            category: categoryId,
            legacyCategory: oldCategory,
            updatedBy: adminUser._id,
          },
        })
        updated++
      } else {
        console.warn(`无法找到对应的新分类: ${oldCategory}`)
      }
    }

    console.log(`成功更新 ${updated} 条新闻的分类信息`)
  } catch (error) {
    console.error('迁移新闻分类数据失败:', error)
    throw error
  }
}

export async function down() {
  try {
    console.log('开始回滚新闻分类数据...')

    const news = await News.find({})
    let updated = 0

    for (const item of news) {
      if (item.legacyCategory) {
        await News.findByIdAndUpdate(item._id, {
          $set: {
            category: item.legacyCategory,
          },
          $unset: {
            legacyCategory: 1,
          },
        })
        updated++
      }
    }

    console.log(`成功回滚 ${updated} 条新闻的分类信息`)
  } catch (error) {
    console.error('回滚新闻分类数据失败:', error)
    throw error
  }
}
