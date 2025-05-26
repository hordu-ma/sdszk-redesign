// userController.js - 用户控制器
import User from '../models/User.js'

// 获取所有用户
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v')
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取单个用户
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v')

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: '未找到此用户',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 更新用户
export const updateUser = async (req, res) => {
  try {
    // 确保不能通过此路由更新密码
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: '此路由不用于密码更新，请使用 /updatePassword',
      })
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v')

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: '未找到此用户',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 删除用户
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: '未找到此用户',
      })
    }

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 更新当前登录用户的密码
export const updatePassword = async (req, res) => {
  try {
    // 1) 获取当前用户
    const user = await User.findById(req.user._id).select('+password')

    // 2) 检查提交的当前密码是否正确
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: '当前密码不正确',
      })
    }

    // 3) 如果是正确的，则更新密码
    user.password = req.body.newPassword
    await user.save()

    // 4) 重新登录用户，发送新JWT
    res.status(200).json({
      status: 'success',
      message: '密码更新成功',
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 获取当前登录的用户信息
export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  })
}

// 更新当前用户个人信息
export const updateMyProfile = async (req, res) => {
  try {
    // 过滤掉不允许更新的字段
    const filteredBody = {}
    const allowedFields = ['name', 'email', 'phone', 'department', 'position', 'avatar']

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key]
      }
    })

    // 确保不能通过此路由更新密码、角色等敏感信息
    if (req.body.password || req.body.role || req.body.permissions) {
      return res.status(400).json({
        status: 'fail',
        message: '此路由不允许更新密码、角色或权限信息',
      })
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
      new: true,
      runValidators: true,
    }).select('-password -__v')

    res.status(200).json({
      status: 'success',
      message: '个人信息更新成功',
      data: {
        user: updatedUser,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 上传用户头像
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: '请选择要上传的头像文件',
      })
    }

    // 构建头像URL
    const avatarUrl = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`

    // 更新用户头像
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password -__v')

    res.status(200).json({
      status: 'success',
      message: '头像上传成功',
      data: {
        user: updatedUser,
        avatarUrl,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 获取用户统计信息
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id

    // 导入需要的模型
    const { Favorite, ViewHistory } = await import('../models/index.js')

    // 获取收藏统计
    const favoriteStats = await Favorite.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
        },
      },
    ])

    // 获取浏览历史统计
    const viewStats = await ViewHistory.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$itemType',
          totalViews: { $sum: '$viewCount' },
          uniqueItems: { $addToSet: '$itemId' },
        },
      },
      {
        $addFields: {
          uniqueItemCount: { $size: '$uniqueItems' },
        },
      },
    ])

    // 获取最近浏览
    const recentViews = await ViewHistory.find({ user: userId })
      .sort('-lastViewedAt')
      .limit(5)
      .populate('itemId', 'title')
      .lean()

    // 获取最近收藏
    const recentFavorites = await Favorite.find({ user: userId })
      .sort('-createdAt')
      .limit(5)
      .populate('itemId', 'title')
      .lean()

    res.status(200).json({
      status: 'success',
      data: {
        favoriteStats,
        viewStats,
        recentViews,
        recentFavorites,
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取用户活动日志
export const getMyActivityLog = async (req, res) => {
  try {
    const userId = req.user._id
    const { page = 1, limit = 20 } = req.query

    const { ActivityLog } = await import('../models/index.js')

    const activities = await ActivityLog.find({ userId })
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()

    const total = await ActivityLog.countDocuments({ userId })

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 删除用户账号（软删除）
export const deleteMyAccount = async (req, res) => {
  try {
    const { password } = req.body

    // 验证密码
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: '密码不正确',
      })
    }

    // 软删除用户账号
    await User.findByIdAndUpdate(req.user._id, {
      active: false,
      deletedAt: new Date(),
    })

    res.status(200).json({
      status: 'success',
      message: '账号已成功删除',
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}
