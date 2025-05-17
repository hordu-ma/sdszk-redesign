import NewsCategory from '../models/NewsCategory.js'
import ActivityLog from '../models/ActivityLog.js'
import { NotFoundError, ForbiddenError } from '../utils/appError.js'

// 获取所有新闻分类
export const getCategories = async (req, res) => {
  try {
    const { includeInactive = false } = req.query
    const query = includeInactive ? {} : { isActive: true }

    const categories = await NewsCategory.find(query)
      .sort({ order: 1, name: 1 })
      .select('-createdBy -updatedBy')

    // 标记核心分类
    const formattedCategories = categories.map(cat => ({
      ...cat.toObject(),
      isEditable: !cat.isCore,
    }))

    res.json({
      status: 'success',
      data: formattedCategories,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取单个分类
export const getCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id)
    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    res.json({
      status: 'success',
      data: category,
    })
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取核心分类
export const getCoreCategories = async (req, res) => {
  try {
    const coreCategories = await NewsCategory.getCoreCategories()

    res.json({
      status: 'success',
      data: coreCategories,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 创建新闻分类
export const createCategory = async (req, res) => {
  try {
    // 设置创建者
    req.body.createdBy = req.user._id

    // 禁止创建核心分类
    if (req.body.isCore) {
      throw new ForbiddenError('不能手动创建核心分类')
    }

    const category = new NewsCategory(req.body)
    const savedCategory = await category.save()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'create',
      entityType: 'newsCategory',
      entityId: savedCategory._id,
      details: {
        name: savedCategory.name,
        key: savedCategory.key,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.status(201).json({
      status: 'success',
      data: savedCategory,
    })
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 更新新闻分类
export const updateCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id)

    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    // 检查是否是核心分类
    if (category.isCore) {
      // 核心分类只允许更新某些字段
      const allowedUpdates = ['description', 'color', 'icon']
      const updates = Object.keys(req.body)
      const isValidOperation = updates.every(update => allowedUpdates.includes(update))

      if (!isValidOperation) {
        throw new ForbiddenError('核心分类只能更新描述、颜色和图标')
      }
    }

    // 设置更新者
    req.body.updatedBy = req.user._id

    const updatedCategory = await NewsCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'update',
      entityType: 'newsCategory',
      entityId: updatedCategory._id,
      details: {
        name: updatedCategory.name,
        key: updatedCategory.key,
        changes: req.body,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      data: updatedCategory,
    })
  } catch (err) {
    res.status(err.statusCode || 400).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 删除新闻分类
export const deleteCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id)

    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    // 软删除：将isActive设为false
    category.isActive = false
    category.updatedBy = req.user._id
    await category.save()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'delete',
      entityType: 'newsCategory',
      entityId: category._id,
      details: {
        name: category.name,
        key: category.key,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: '分类已删除',
    })
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 更新分类排序
export const updateCategoryOrder = async (req, res) => {
  try {
    const { categories } = req.body

    // 批量更新分类顺序
    await Promise.all(
      categories.map(item =>
        NewsCategory.findByIdAndUpdate(
          item.id,
          { order: item.order, updatedBy: req.user._id },
          { new: true }
        )
      )
    )

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'reorder',
      entityType: 'newsCategory',
      details: {
        count: categories.length,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: '分类排序已更新',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}
