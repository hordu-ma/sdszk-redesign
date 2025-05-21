import mongoose from 'mongoose'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const ADMIN_ID = '68222f1ad400a6677a773301'

const DEFAULT_CATEGORIES = [
  {
    name: '理论知识',
    description: '理论相关的教学资源',
    oldValue: 'theory',
    order: 1,
  },
  {
    name: '教学资源',
    description: '教学相关的资源材料',
    oldValue: 'teaching',
    order: 2,
  },
  {
    name: '视频资料',
    description: '教学视频资源',
    oldValue: 'video',
    order: 3,
  },
]

async function migrate() {
  const db = await mongoose.connect('mongodb://localhost:27017/sdszk')
  console.log('已连接到数据库')

  try {
    const existingCategories = await db.connection
      .collection('resourcecategories')
      .find({})
      .toArray()
    console.log(`发现 ${existingCategories.length} 个现有分类`)

    const categoryMap = new Map()

    // 创建或更新分类
    for (const category of DEFAULT_CATEGORIES) {
      const existing = existingCategories.find(c => c.name === category.name)

      if (existing) {
        console.log(`更新分类: ${category.name}`)
        categoryMap.set(category.oldValue, existing._id)
      } else {
        console.log(`创建分类: ${category.name}`)
        const result = await db.connection.collection('resourcecategories').insertOne({
          name: category.name,
          description: category.description,
          order: category.order,
          isActive: true,
          createdBy: new mongoose.Types.ObjectId(ADMIN_ID),
          updatedBy: new mongoose.Types.ObjectId(ADMIN_ID),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        categoryMap.set(category.oldValue, result.insertedId)
      }
    }

    // 更新资源引用
    const resources = await db.connection.collection('resources').find({}).toArray()
    console.log(`找到 ${resources.length} 个资源需要更新`)

    let updatedCount = 0
    for (const resource of resources) {
      if (typeof resource.category === 'string' && categoryMap.has(resource.category)) {
        await db.connection
          .collection('resources')
          .updateOne(
            { _id: resource._id },
            { $set: { category: categoryMap.get(resource.category) } }
          )
        updatedCount++
      }
    }

    console.log(`成功更新 ${updatedCount} 个资源的分类引用`)
  } catch (error) {
    console.error('迁移失败:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('数据库连接已关闭')
  }
}

migrate().catch(error => {
  console.error(error)
  process.exit(1)
})
