// resourceController.js - 资源控制器
import Resource from '../models/Resource.js'
import ActivityLog from '../models/ActivityLog.js'
import ResourceCategory from '../models/ResourceCategory.js'

// 字段映射函数：前端字段名 -> 后端字段名
const mapFrontendToBackend = data => {
  const mapped = { ...data }

  // 字段名映射
  if (mapped.description !== undefined) {
    mapped.content = mapped.description
    delete mapped.description
  }

  if (mapped.categoryId !== undefined) {
    mapped.category = mapped.categoryId
    delete mapped.categoryId
  }

  if (mapped.isFeatured !== undefined) {
    mapped.featured = mapped.isFeatured
    delete mapped.isFeatured
  }

  if (mapped.fileType !== undefined) {
    mapped.mimeType = mapped.fileType
    delete mapped.fileType
  }

  // status 到 isPublished 的转换
  if (mapped.status !== undefined) {
    mapped.isPublished = mapped.status === 'published'
    delete mapped.status
  }

  return mapped
}

// 字段映射函数：后端字段名 -> 前端字段名
const mapBackendToFrontend = data => {
  if (!data) return data

  const mapped = { ...(data.toObject ? data.toObject() : data) }

  // 字段名映射
  if (mapped.content !== undefined) {
    mapped.description = mapped.content
    delete mapped.content
  }

  if (mapped.category !== undefined) {
    mapped.categoryId = mapped.category
    delete mapped.category
  }

  if (mapped.featured !== undefined) {
    mapped.isFeatured = mapped.featured
    delete mapped.featured
  }

  if (mapped.mimeType !== undefined) {
    mapped.fileType = mapped.mimeType
    delete mapped.mimeType
  }

  // isPublished 到 status 的转换
  if (mapped.isPublished !== undefined) {
    mapped.status = mapped.isPublished ? 'published' : 'draft'
    delete mapped.isPublished
  }

  return mapped
}

// 获取资源列表
export const getResourceList = async (req, res) => {
  try {
    let { category, page = 1, limit = 10, search, featured } = req.query

    // 构建查询条件
    const query = {}

    // 按类别筛选
    if (category) {
      // 如果不是合法 ObjectId，则尝试用 key 查找
      if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
        const cat = await ResourceCategory.findOne({ key: category })
        if (cat) {
          query.category = cat._id
        } else {
          return res.status(400).json({ status: 'error', message: '无效的资源分类' })
        }
      } else {
        query.category = category
      }
    }

    // 按特色筛选
    if (featured === 'true') {
      query.featured = true
    }

    // 全文搜索
    if (search) {
      query.$text = { $search: search }
    }

    // 默认只返回已发布的资源，除非明确请求所有资源
    if (req.query.all !== 'true') {
      query.isPublished = true
    }

    // 执行查询
    const resources = await Resource.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'username name')
      .populate('updatedBy', 'username name')

    // 获取总数
    const total = await Resource.countDocuments(query)

    // 映射返回数据
    const mappedResources = resources.map(resource => mapBackendToFrontend(resource))

    res.json({
      status: 'success',
      data: mappedResources,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取单个资源
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('createdBy', 'username name')
      .populate('updatedBy', 'username name')
      .populate('relatedResources', 'title thumbnail category')

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    // 如果资源未发布，只有创建者或管理员可以查看
    if (
      !resource.isPublished &&
      (!req.user ||
        (req.user._id.toString() !== resource.createdBy._id.toString() &&
          req.user.role !== 'admin'))
    ) {
      return res.status(403).json({
        status: 'fail',
        message: '您没有权限查看此资源',
      })
    }

    // 更新浏览量
    resource.viewCount += 1
    await resource.save({ validateBeforeSave: false })

    // 返回映射后的数据
    const responseData = mapBackendToFrontend(resource)

    res.json({
      status: 'success',
      data: responseData,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 创建资源
export const createResource = async (req, res) => {
  try {
    // 字段映射：前端 -> 后端
    const mappedData = mapFrontendToBackend(req.body)

    // 设置创建者和作者信息
    mappedData.createdBy = req.user._id
    mappedData.author = req.user.name || req.user.username // 使用用户名作为作者

    const resource = new Resource(mappedData)
    const savedResource = await resource.save()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'create',
      entityType: 'resource',
      entityId: savedResource._id,
      details: {
        title: savedResource.title,
        category: savedResource.category,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    // 返回映射后的数据
    const responseData = mapBackendToFrontend(savedResource)

    res.status(201).json({
      status: 'success',
      data: responseData,
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 更新资源
export const updateResource = async (req, res) => {
  try {
    // 字段映射：前端 -> 后端
    const mappedData = mapFrontendToBackend(req.body)

    // 设置更新者
    mappedData.updatedBy = req.user._id

    const resource = await Resource.findByIdAndUpdate(req.params.id, mappedData, {
      new: true,
      runValidators: true,
    })

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'update',
      entityType: 'resource',
      entityId: resource._id,
      details: {
        title: resource.title,
        category: resource.category,
        fields: Object.keys(req.body),
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    // 返回映射后的数据
    const responseData = mapBackendToFrontend(resource)

    res.json({
      status: 'success',
      data: responseData,
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 删除资源
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'delete',
      entityType: 'resource',
      entityId: resource._id,
      details: {
        title: resource.title,
        category: resource.category,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    await resource.deleteOne()

    res.json({
      status: 'success',
      message: '资源已删除',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 发布/取消发布资源
export const togglePublishStatus = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    resource.isPublished = !resource.isPublished
    resource.updatedBy = req.user._id
    await resource.save()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: resource.isPublished ? 'publish' : 'unpublish',
      entityType: 'resource',
      entityId: resource._id,
      details: {
        title: resource.title,
        category: resource.category,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      data: mapBackendToFrontend(resource),
      message: resource.isPublished ? '资源已发布' : '资源已取消发布',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 设置/取消设置为精选资源
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    resource.featured = !resource.featured
    resource.updatedBy = req.user._id
    await resource.save()

    res.json({
      status: 'success',
      data: mapBackendToFrontend(resource),
      message: resource.featured ? '已设为精选资源' : '已取消精选资源',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 设置/取消置顶资源
export const toggleTopStatus = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    resource.isTop = !resource.isTop
    resource.updatedBy = req.user._id
    await resource.save()

    res.json({
      status: 'success',
      data: mapBackendToFrontend(resource),
      message: resource.isTop ? '已设为置顶资源' : '已取消置顶资源',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取相关资源
export const getRelatedResources = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    // 基于类别和标签查找相关资源
    const relatedResources = await Resource.find({
      _id: { $ne: resource._id },
      isPublished: true,
      $or: [{ category: resource.category }, { tags: { $in: resource.tags } }],
    })
      .limit(4)
      .select('title thumbnail category tags viewCount')

    res.json({
      status: 'success',
      results: relatedResources.length,
      data: relatedResources,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取每个类别的最新资源
export const getLatestByCategory = async (req, res) => {
  try {
    const categories = ['theory', 'teaching', 'video']
    const limit = parseInt(req.query.limit) || 3

    const result = {}

    for (const category of categories) {
      const resources = await Resource.find({
        category,
        isPublished: true,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title thumbnail summary viewCount createdAt')

      result[category] = resources
    }

    res.json({
      status: 'success',
      data: result,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 增加资源下载次数
export const incrementDownloadCount = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: '资源不存在',
      })
    }

    resource.downloadCount += 1
    await resource.save({ validateBeforeSave: false })

    res.json({
      status: 'success',
      data: {
        downloadCount: resource.downloadCount,
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取资源统计信息
export const getResourceStats = async (req, res) => {
  try {
    const stats = {
      totalCount: await Resource.countDocuments(),
      categoryCount: {},
      featuredCount: await Resource.countDocuments({ featured: true }),
    }

    // 按类别统计
    const categoryStats = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ])

    categoryStats.forEach(stat => {
      stats.categoryCount[stat._id] = stat.count
    })

    res.json({
      status: 'success',
      data: stats,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 批量删除资源
export const batchDeleteResources = async (req, res) => {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: '请提供要删除的资源ID列表',
      })
    }

    // 查找要删除的资源
    const resources = await Resource.find({ _id: { $in: ids } })

    if (resources.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: '未找到指定的资源',
      })
    }

    // 执行删除操作
    await Resource.deleteMany({ _id: { $in: ids } })

    // 记录批量删除活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'batch_delete',
      entityType: 'resource',
      details: {
        count: resources.length,
        resourceTitles: resources.map(r => r.title),
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: `成功删除 ${resources.length} 个资源`,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 批量更新资源
export const batchUpdateResources = async (req, res) => {
  try {
    const { ids, ...updateData } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: '请提供要更新的资源ID列表',
      })
    }

    // 更新前查找资源
    const resources = await Resource.find({ _id: { $in: ids } })

    if (resources.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: '未找到指定的资源',
      })
    }

    // 设置更新者
    updateData.updatedBy = req.user._id

    // 执行批量更新
    await Resource.updateMany({ _id: { $in: ids } }, { $set: updateData })

    // 记录批量更新活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'batch_update',
      entityType: 'resource',
      details: {
        count: resources.length,
        resourceTitles: resources.map(r => r.title),
        updatedFields: Object.keys(updateData),
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: `成功更新 ${resources.length} 个资源`,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}
