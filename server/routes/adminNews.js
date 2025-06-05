import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { checkPermission } from '../middleware/permissionMiddleware.js'
import News from '../models/News.js'
import { catchAsync } from '../utils/catchAsync.js'
import { NotFoundError } from '../utils/appError.js'

const router = express.Router()

// 获取新闻列表（管理员版）
router.get(
  '/',
  authenticateToken,
  checkPermission('news', 'read'),
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      keyword,
      categoryId,
      status,
      startDate,
      endDate,
      isTop,
      isFeatured,
    } = req.query

    // 构建查询条件
    const query = {}

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ]
    }

    if (categoryId) {
      query.categoryId = categoryId
    }

    if (status) {
      query.status = status
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (isTop !== undefined) {
      query.isTop = isTop === 'true'
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true'
    }

    // 执行查询
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username')

    const total = await News.countDocuments(query)

    res.json({
      status: 'success',
      data: {
        data: news,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    })
  })
)

// 获取单个新闻详情（管理员版）
router.get(
  '/:id',
  authenticateToken,
  checkPermission('news', 'read'),
  catchAsync(async (req, res) => {
    const news = await News.findById(req.params.id).populate('author', 'username')
    if (!news) {
      throw new NotFoundError('新闻不存在')
    }
    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 创建新闻
router.post(
  '/',
  authenticateToken,
  checkPermission('news', 'create'),
  catchAsync(async (req, res) => {
    const newsData = {
      ...req.body,
      author: req.user.id,
    }

    const news = new News(newsData)
    const savedNews = await news.save()

    res.status(201).json({
      status: 'success',
      data: savedNews,
    })
  })
)

// 更新新闻
router.put(
  '/:id',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('author', 'username')

    if (!news) {
      throw new NotFoundError('新闻不存在')
    }

    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 删除新闻
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('news', 'delete'),
  catchAsync(async (req, res) => {
    const news = await News.findByIdAndDelete(req.params.id)
    if (!news) {
      throw new NotFoundError('新闻不存在')
    }
    res.json({
      status: 'success',
      message: '新闻已删除',
    })
  })
)

// 批量删除新闻
router.post(
  '/batch-delete',
  authenticateToken,
  checkPermission('news', 'delete'),
  catchAsync(async (req, res) => {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('无效的ID列表')
    }

    await News.deleteMany({ _id: { $in: ids } })

    res.json({
      status: 'success',
      message: `已删除${ids.length}条新闻`,
    })
  })
)

// 切换新闻发布状态
router.patch(
  '/:id/toggle-publish',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const news = await News.findById(req.params.id)

    if (!news) {
      throw new NotFoundError('新闻不存在')
    }

    news.status = news.status === 'published' ? 'draft' : 'published'
    await news.save()

    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 切换新闻置顶状态
router.patch(
  '/:id/toggle-top',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const news = await News.findById(req.params.id)

    if (!news) {
      throw new NotFoundError('新闻不存在')
    }

    news.isTop = !news.isTop
    await news.save()

    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 切换新闻精选状态
router.patch(
  '/:id/toggle-featured',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const news = await News.findById(req.params.id)

    if (!news) {
      throw new NotFoundError('新闻不存在')
    }

    news.isFeatured = !news.isFeatured
    await news.save()

    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 批量更新新闻
router.patch(
  '/batch-update',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const { ids, updates } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('无效的ID列表')
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('无效的更新数据')
    }

    const result = await News.updateMany(
      { _id: { $in: ids } },
      { $set: { ...updates, updatedBy: req.user.id } }
    )

    res.json({
      status: 'success',
      message: `已更新${result.modifiedCount}条新闻`,
    })
  })
)

// 更新新闻排序
router.patch(
  '/:id/update-order',
  authenticateToken,
  checkPermission('news', 'update'),
  catchAsync(async (req, res) => {
    const { order } = req.body
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { $set: { order, updatedBy: req.user.id } },
      { new: true }
    )

    if (!news) {
      throw new NotFoundError('新闻不存在')
    }

    res.json({
      status: 'success',
      data: news,
    })
  })
)

// 获取新闻统计信息
router.get(
  '/stats/overview',
  authenticateToken,
  checkPermission('news', 'read'),
  catchAsync(async (req, res) => {
    const stats = await News.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const totalViews = await News.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
        },
      },
    ])

    const categoryStats = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'newscategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $project: {
          categoryName: '$categoryInfo.name',
          count: 1,
          _id: 0,
        },
      },
    ])

    res.json({
      status: 'success',
      data: {
        statusStats: stats.reduce((acc, curr) => {
          acc[curr._id] = curr.count
          return acc
        }, {}),
        totalViews: totalViews[0]?.totalViews || 0,
        categoryStats,
      },
    })
  })
)

// 获取新闻趋势数据
router.get(
  '/stats/trends',
  authenticateToken,
  checkPermission('news', 'read'),
  catchAsync(async (req, res) => {
    const { days = 7 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    const trends = await News.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
          views: { $sum: '$viewCount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    res.json({
      status: 'success',
      data: trends,
    })
  })
)

export default router
