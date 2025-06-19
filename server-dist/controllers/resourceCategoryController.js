// resourceCategoryController.js - 资源分类控制器
import ResourceCategory from '../models/ResourceCategory.js'
import ActivityLog from '../models/ActivityLog.js'
import { NotFoundError } from '../utils/appError.js'

// 获取所有资源分类
export const getCategories = async (req, res) => {
  try {
    const { includeInactive = false } = req.query
    const query = includeInactive ? {} : { isActive: true }

    const categories = await ResourceCategory.find(query)
      .sort({ order: 1, name: 1 })
      .populate('resourceCount')
      .select('-createdBy -updatedBy')

    res.json({
      status: 'success',
      data: categories,
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
    const category = await ResourceCategory.findById(req.params.id).populate('resourceCount')

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

// 创建资源分类
export const createCategory = async (req, res) => {
  try {
    // 设置创建者
    req.body.createdBy = req.user._id

    const category = new ResourceCategory(req.body)
    const savedCategory = await category.save()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'create',
      entityType: 'resourceCategory',
      entityId: savedCategory._id,
      details: {
        name: savedCategory.name,
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

// 更新资源分类
export const updateCategory = async (req, res) => {
  try {
    const category = await ResourceCategory.findById(req.params.id)

    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    // 设置更新者
    req.body.updatedBy = req.user._id

    const updatedCategory = await ResourceCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'update',
      entityType: 'resourceCategory',
      entityId: updatedCategory._id,
      details: {
        name: updatedCategory.name,
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
    res.status(400).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 删除资源分类
export const deleteCategory = async (req, res) => {
  try {
    const category = await ResourceCategory.findById(req.params.id)

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
      entityType: 'resourceCategory',
      entityId: category._id,
      details: {
        name: category.name,
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
        ResourceCategory.findByIdAndUpdate(
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
      entityType: 'resourceCategory',
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
