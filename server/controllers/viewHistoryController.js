// viewHistoryController.js - 浏览历史控制器
import ViewHistory from "../models/ViewHistory.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

// 记录浏览历史
export const recordView = catchAsync(async (req, res, next) => {
  const { itemType, itemId, duration, source } = req.body;
  const userId = req.user.id;

  // 从请求中获取设备信息
  const userAgent = req.get("User-Agent");
  const ip = req.ip || req.connection.remoteAddress;

  // 简单的设备检测
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  const viewRecord = await ViewHistory.recordView(userId, itemType, itemId, {
    duration,
    source,
    device,
    userAgent,
    ip,
  });

  res.status(200).json({
    status: "success",
    message: "浏览记录已保存",
    data: {
      viewRecord,
    },
  });
});

// 获取用户浏览历史
export const getUserHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const {
    itemType,
    page = 1,
    limit = 20,
    sort = "-lastViewedAt",
    startDate,
    endDate,
  } = req.query;

  const dateRange =
    startDate && endDate ? { start: startDate, end: endDate } : null;

  const result = await ViewHistory.getUserHistory(userId, {
    itemType,
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    dateRange,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// 清理用户浏览历史
export const clearUserHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { itemType, olderThan } = req.body;

  const deletedCount = await ViewHistory.clearUserHistory(userId, {
    itemType,
    olderThan,
  });

  res.status(200).json({
    status: "success",
    message: `成功清理 ${deletedCount} 条浏览记录`,
    data: {
      deletedCount,
    },
  });
});

// 获取热门内容
export const getPopularItems = catchAsync(async (req, res, next) => {
  const { itemType, timeRange = 7, limit = 10 } = req.query;

  const popular = await ViewHistory.getPopularItems({
    itemType,
    timeRange: parseInt(timeRange),
    limit: parseInt(limit),
  });

  res.status(200).json({
    status: "success",
    data: {
      popular,
    },
  });
});

// 获取推荐内容
export const getRecommendations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { limit = 10 } = req.query;

  const recommendations = await ViewHistory.getRecommendations(userId, {
    limit: parseInt(limit),
  });

  res.status(200).json({
    status: "success",
    data: {
      recommendations,
    },
  });
});

// 获取浏览统计
export const getViewStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { timeRange = 30 } = req.query;

  const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

  // 总浏览量统计
  const totalViews = await ViewHistory.countDocuments({
    user: userId,
    lastViewedAt: { $gte: startDate },
  });

  // 按类型统计
  const typeStats = await ViewHistory.aggregate([
    {
      $match: {
        user: userId,
        lastViewedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$itemType",
        count: { $sum: "$viewCount" },
        uniqueItems: { $addToSet: "$itemId" },
      },
    },
    {
      $addFields: {
        uniqueItemCount: { $size: "$uniqueItems" },
      },
    },
  ]);

  // 按日期统计
  const dailyStats = await ViewHistory.aggregate([
    {
      $match: {
        user: userId,
        lastViewedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$lastViewedAt",
          },
        },
        count: { $sum: "$viewCount" },
        uniqueItems: { $addToSet: "$itemId" },
      },
    },
    {
      $addFields: {
        uniqueItemCount: { $size: "$uniqueItems" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 设备统计
  const deviceStats = await ViewHistory.aggregate([
    {
      $match: {
        user: userId,
        lastViewedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$device",
        count: { $sum: "$viewCount" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalViews,
      typeStats,
      dailyStats,
      deviceStats,
      timeRange,
    },
  });
});

// 删除特定浏览记录
export const deleteViewRecord = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await ViewHistory.deleteOne({
    _id: id,
    user: userId,
  });

  if (result.deletedCount === 0) {
    return next(new AppError("浏览记录不存在", 404));
  }

  res.status(200).json({
    status: "success",
    message: "浏览记录已删除",
  });
});

// 批量删除浏览记录
export const batchDeleteViewRecords = catchAsync(async (req, res, next) => {
  const { recordIds } = req.body;
  const userId = req.user.id;

  const result = await ViewHistory.deleteMany({
    _id: { $in: recordIds },
    user: userId,
  });

  res.status(200).json({
    status: "success",
    message: `成功删除 ${result.deletedCount} 条浏览记录`,
    data: {
      deletedCount: result.deletedCount,
    },
  });
});
