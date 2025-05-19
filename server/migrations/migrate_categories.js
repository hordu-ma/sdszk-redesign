// 迁移资源分类
const adminId = ObjectId('68222f1ad400a6677a773301')

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

// 创建或更新分类
const categoryMap = new Map()

for (const category of DEFAULT_CATEGORIES) {
  const existing = db.resourcecategories.findOne({ name: category.name })

  if (existing) {
    print(`更新分类: ${category.name}`)
    categoryMap.set(category.oldValue, existing._id)
  } else {
    print(`创建分类: ${category.name}`)
    const result = db.resourcecategories.insertOne({
      name: category.name,
      description: category.description,
      order: category.order,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    categoryMap.set(category.oldValue, result.insertedId)
  }
}

// 更新资源引用
const resources = db.resources.find({}).toArray()
print(`找到 ${resources.length} 个资源需要更新`)

let updatedCount = 0
for (const resource of resources) {
  if (typeof resource.category === 'string' && categoryMap.has(resource.category)) {
    db.resources.updateOne(
      { _id: resource._id },
      { $set: { category: categoryMap.get(resource.category) } }
    )
    updatedCount++
  }
}

print(`成功更新 ${updatedCount} 个资源的分类引用`)
