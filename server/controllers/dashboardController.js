// dashboardController.js - 仪表盘数据控制器
import User from '../models/User.js'
import News from '../models/News.js'
import Resource from '../models/Resource.js'
import Activity from '../models/Activity.js'
import ActivityLog from '../models/ActivityLog.js'

// 获取总体统计数据
export const getOverviewStats = async (req, res) => {
  try {
    // 获取各模块的总数
    const [userCount, newsCount, resourceCount, activityCount] = await Promise.all([
      User.countDocuments(),
      News.countDocuments(),
      Resource.countDocuments(),
      Activity.countDocuments(),
    ])

    // 获取今日数据
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayUsers, todayNews, todayResources, todayActivities] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today } }),
      News.countDocuments({ createdAt: { $gte: today } }),
      Resource.countDocuments({ createdAt: { $gte: today } }),
      Activity.countDocuments({ createdAt: { $gte: today } }),
    ])

    // 获取最近7天的活动日志统计
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const activityLogs = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    res.json({
      success: true,
      data: {
        overview: {
          users: {
            total: userCount,
            today: todayUsers,
          },
          news: {
            total: newsCount,
            today: todayNews,
          },
          resources: {
            total: resourceCount,
            today: todayResources,
          },
          activities: {
            total: activityCount,
            today: todayActivities,
          },
        },
        activityTrend: activityLogs,
      },
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取仪表盘数据失败',
    })
  }
}

// 获取最近活动日志
export const getRecentActivities = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'username')
      .lean()

    res.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error('获取最近活动失败:', error)
    res.status(500).json({
      success: false,
      message: '获取最近活动失败',
    })
  }
}
