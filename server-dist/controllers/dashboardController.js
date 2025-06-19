// dashboardController.js - 仪表盘数据控制器
import User from "../models/User.js";
import News from "../models/News.js";
import Resource from "../models/Resource.js";
import ActivityLog from "../models/ActivityLog.js";

// 获取总体统计数据
export const getOverviewStats = async (req, res) => {
  try {
    // 获取当前时间和时间范围
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    // 获取各模块的总数
    const [userCount, newsCount, resourceCount] = await Promise.all([
      User.countDocuments(),
      News.countDocuments(),
      Resource.countDocuments(),
    ]);

    // 获取上周的数据用于计算增长率
    const [lastWeekUsers, lastWeekNews, lastWeekResources] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: lastWeek } }),
      News.countDocuments({ createdAt: { $lte: lastWeek } }),
      Resource.countDocuments({ createdAt: { $lte: lastWeek } }),
    ]);

    // 计算总访问量（新闻和资源的访问量之和）
    const [newsViews, resourceViews] = await Promise.all([
      News.aggregate([
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      Resource.aggregate([
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
    ]);

    const totalViews =
      (newsViews[0]?.total || 0) + (resourceViews[0]?.total || 0);

    // 计算上周的访问量用于增长率计算
    const [lastWeekNewsViews, lastWeekResourceViews] = await Promise.all([
      News.aggregate([
        { $match: { createdAt: { $lte: lastWeek } } },
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      Resource.aggregate([
        { $match: { createdAt: { $lte: lastWeek } } },
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
    ]);

    const lastWeekTotalViews =
      (lastWeekNewsViews[0]?.total || 0) +
      (lastWeekResourceViews[0]?.total || 0);

    // 计算增长率（与上周相比）
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const newsGrowth = calculateGrowth(newsCount, lastWeekNews);
    const resourceGrowth = calculateGrowth(resourceCount, lastWeekResources);
    const userGrowth = calculateGrowth(userCount, lastWeekUsers);
    const viewsGrowth = calculateGrowth(totalViews, lastWeekTotalViews);

    // 返回前端期望的扁平化数据格式
    res.json({
      success: true,
      data: {
        newsCount,
        resourceCount,
        userCount,
        totalViews,
        newsGrowth,
        resourceGrowth,
        userGrowth,
        viewsGrowth,
      },
    });
  } catch (error) {
    console.error("获取仪表盘数据失败:", error);
    res.status(500).json({
      success: false,
      message: "获取仪表盘数据失败",
      error: error.message,
    });
  }
};

// 获取访问量趋势
export const getVisitTrends = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    startDate.setHours(0, 0, 0, 0);

    // 生成日期数组，确保每一天都有数据（即使是0）
    const dateArray = [];
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateArray.push(date.toISOString().split("T")[0]);
    }

    // 从新闻和资源访问历史中获取访问量趋势
    // 这里我们使用创建时间作为访问时间的近似值，实际项目中应该有专门的访问记录
    const [newsVisits, resourceVisits] = await Promise.all([
      News.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            viewCount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: "$viewCount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Resource.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            viewCount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: "$viewCount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // 合并新闻和资源的访问量
    const visitMap = new Map();

    // 初始化所有日期为0
    dateArray.forEach((date) => {
      visitMap.set(date, 0);
    });

    // 添加新闻访问量
    newsVisits.forEach((item) => {
      const current = visitMap.get(item._id) || 0;
      visitMap.set(item._id, current + item.count);
    });

    // 添加资源访问量
    resourceVisits.forEach((item) => {
      const current = visitMap.get(item._id) || 0;
      visitMap.set(item._id, current + item.count);
    });

    // 转换为前端期望的格式
    const trends = dateArray.map((date) => ({
      date,
      visits: visitMap.get(date) || 0,
    }));

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("getVisitTrends error:", error);
    res.status(500).json({
      success: false,
      message: "获取访问量趋势失败",
      error: error.message,
    });
  }
};

// 获取最新动态
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 获取最新的活动日志
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username name")
      .lean();

    // 转换为前端期望的格式
    const formattedActivities = activities.map((activity, index) => ({
      id: activity._id || index,
      user: {
        id: activity.userId?._id || activity.userId,
        username: activity.userId?.username || activity.username || "未知用户",
        avatar: activity.userId?.avatar || "",
      },
      action: getActionText(activity.action, activity.entityType),
      target: activity.details?.title || activity.entityId || "未知",
      targetType: activity.entityType || "system",
      createdAt: activity.createdAt,
    }));

    res.json({
      success: true,
      data: {
        items: formattedActivities,
      },
    });
  } catch (error) {
    console.error("getRecentActivities error:", error);
    res.status(500).json({
      success: false,
      message: "获取最新动态失败",
      error: error.message,
    });
  }
};

// 辅助函数：将操作类型转换为友好的文本
const getActionText = (action, entityType) => {
  const actionMap = {
    create: "创建了",
    update: "更新了",
    delete: "删除了",
    publish: "发布了",
    archive: "归档了",
  };

  const entityMap = {
    news: "新闻",
    resource: "资源",
    user: "用户",
    category: "分类",
  };

  const actionText = actionMap[action] || action;
  const entityText = entityMap[entityType] || entityType;

  return `${actionText}${entityText}`;
};
