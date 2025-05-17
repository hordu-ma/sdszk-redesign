import mongoose from 'mongoose'
import News from '../models/News.js'
import NewsCategory from '../models/NewsCategory.js'

export const migrateLegacyCategories = async () => {
  try {
    // 1. 创建默认分类
    const defaultCategories = [
      {
        name: '中心概况',
        key: 'center',
        description: '中心相关信息',
        order: 1,
        color: '#1890ff',
        icon: 'info-circle',
        isActive: true,
      },
      {
        name: '通知公告',
        key: 'notice',
        description: '重要通知与公告',
        order: 2,
        color: '#52c41a',
        icon: 'notification',
        isActive: true,
      },
      {
        name: '政策法规',
        key: 'policy',
        description: '相关政策与法规',
        order: 3,
        color: '#722ed1',
        icon: 'file-text',
        isActive: true,
      },
    ]

    // 2. 插入默认分类并获取它们的ID
    const categoryMap = new Map()
    for (const category of defaultCategories) {
      const newCategory = await NewsCategory.findOneAndUpdate(
        { key: category.key },
        { ...category },
        { upsert: true, new: true }
      )
      categoryMap.set(category.key, newCategory._id)
    }

    // 3. 更新所有现有新闻的分类
    const cursor = News.find({}).cursor()

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const oldCategory = doc.category
      const newCategoryId = categoryMap.get(oldCategory)

      if (newCategoryId) {
        doc.legacyCategory = oldCategory
        doc.category = newCategoryId
        await doc.save()
      }
    }

    console.log('新闻分类迁移完成')
    return true
  } catch (error) {
    console.error('新闻分类迁移失败:', error)
    throw error
  }
}

export const rollbackCategoryMigration = async () => {
  try {
    const cursor = News.find({}).cursor()

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      if (doc.legacyCategory) {
        doc.category = doc.legacyCategory
        doc.legacyCategory = undefined
        await doc.save()
      }
    }

    // 删除所有创建的分类
    await NewsCategory.deleteMany({})

    console.log('新闻分类回滚完成')
    return true
  } catch (error) {
    console.error('新闻分类回滚失败:', error)
    throw error
  }
}
