// dashboardController.js - 仪表盘数据控制器
import User from "../models/User.js";
import News from "../models/News.js";
import Resource from "../models/Resource.js";
import ActivityLog from "../models/ActivityLog.js";
import NewsCategory from "../models/NewsCategory.js";
import ResourceCategory from "../models/ResourceCategory.js";
import { AppError, BadRequestError, NotFoundError } from "../utils/appError.js";
import os from "os";
import fs from "fs";
import path from "path";

// 获取总体统计数据
export const getOverviewStats = async (req, res, next) => {
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
    next(error);
  }
};

// 获取访问量趋势
export const getVisitTrends = async (req, res, next) => {
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
    next(error);
  }
};

// 获取内容分布
export const getContentDistribution = async (req, res, next) => {
  try {
    const type = req.query.type || "category";

    let distribution = [];

    if (type === "category") {
      // 按分类统计新闻和资源
      const [newsByCategory, resourcesByCategory] = await Promise.all([
        News.aggregate([
          {
            $lookup: {
              from: "newscategories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              categoryName: { $first: "$categoryInfo.name" },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Resource.aggregate([
          {
            $lookup: {
              from: "resourcecategories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              categoryName: { $first: "$categoryInfo.name" },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

      distribution = [
        ...newsByCategory.map((item) => ({
          name: item.categoryName?.[0] || "未分类",
          value: item.count,
          percentage: 0, // 稍后计算
        })),
        ...resourcesByCategory.map((item) => ({
          name: item.categoryName?.[0] || "未分类",
          value: item.count,
          percentage: 0, // 稍后计算
        })),
      ];
    } else if (type === "status") {
      // 按状态统计
      const [newsByStatus, resourcesByStatus] = await Promise.all([
        News.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Resource.aggregate([
          {
            $group: {
              _id: "$isPublished",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

      distribution = [
        ...newsByStatus.map((item) => ({
          name: getStatusText(item._id),
          value: item.count,
          percentage: 0,
        })),
        ...resourcesByStatus.map((item) => ({
          name: item._id ? "已发布" : "草稿",
          value: item.count,
          percentage: 0,
        })),
      ];
    }

    // 计算百分比
    const total = distribution.reduce((sum, item) => sum + item.value, 0);
    distribution = distribution.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("获取内容分布失败:", error);
    next(error);
  }
};

// 获取最新动态
export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 获取最新的活动日志
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "username avatar")
      .lean();

    // 转换为前端期望的格式
    const formattedActivities = activities.map((activity) => ({
      id: activity._id,
      user: {
        id: activity.user?._id,
        username: activity.user?.username || "未知用户",
        avatar: activity.user?.avatar || "",
      },
      action: getActionText(activity.action, activity.entityType),
      target: activity.entityName || "未知对象",
      targetType: activity.entityType || "system",
      createdAt: activity.createdAt,
    }));

    // 如果没有活动数据，返回一些默认的系统活动
    if (formattedActivities.length === 0) {
      const defaultActivities = [
        {
          id: "system-1",
          user: {
            id: "system",
            username: "系统",
            avatar: "",
          },
          action: "系统启动",
          target: "CMS系统",
          targetType: "system",
          createdAt: new Date(),
        },
        {
          id: "system-2",
          user: {
            id: "system",
            username: "系统",
            avatar: "",
          },
          action: "数据库连接",
          target: "MongoDB",
          targetType: "system",
          createdAt: new Date(Date.now() - 60000), // 1分钟前
        },
      ];

      res.json({
        success: true,
        data: {
          items: defaultActivities,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        items: formattedActivities,
      },
    });
  } catch (error) {
    console.error("获取最新动态失败:", error);
    next(error);
  }
};

// 获取系统状态
export const getSystemStatus = async (req, res, next) => {
  try {
    // 检查数据库连接
    const dbStatus = await checkDatabaseStatus();

    // 检查存储空间
    const storageStatus = await checkStorageStatus();

    // 检查内存使用
    const memoryStatus = await checkMemoryStatus();

    const systemStatus = {
      overall: "healthy",
      items: [
        {
          key: "server",
          label: "服务器状态",
          value: "运行正常",
          status: "healthy",
        },
        {
          key: "database",
          label: "数据库连接",
          value: dbStatus.message,
          status: dbStatus.status,
        },
        {
          key: "storage",
          label: "存储空间",
          value: storageStatus.message,
          status: storageStatus.status,
        },
        {
          key: "memory",
          label: "内存使用",
          value: memoryStatus.message,
          status: memoryStatus.status,
        },
      ],
    };

    // 确定整体状态
    const hasError = systemStatus.items.some((item) => item.status === "error");
    const hasWarning = systemStatus.items.some(
      (item) => item.status === "warning"
    );

    if (hasError) {
      systemStatus.overall = "error";
    } else if (hasWarning) {
      systemStatus.overall = "warning";
    }

    res.json({
      success: true,
      data: systemStatus,
    });
  } catch (error) {
    console.error("获取系统状态失败:", error);
    next(error);
  }
};

// 获取性能指标
export const getPerformanceMetrics = async (req, res, next) => {
  try {
    // 获取系统性能指标
    const cpuUsage = os.loadavg()[0] * 100; // CPU使用率
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    // 获取磁盘使用情况
    const diskUsage = await getDiskUsage();

    // 模拟网络延迟（实际项目中应该从监控系统获取）
    const networkLatency = Math.random() * 20 + 5; // 5-25ms

    const metrics = [
      {
        key: "cpu",
        label: "CPU使用率",
        value: `${Math.round(cpuUsage)}%`,
        percent: Math.round(cpuUsage),
        status:
          cpuUsage > 80 ? "exception" : cpuUsage > 60 ? "normal" : "success",
        color:
          cpuUsage > 80 ? "#fa541c" : cpuUsage > 60 ? "#1890ff" : "#52c41a",
      },
      {
        key: "memory",
        label: "内存使用率",
        value: `${Math.round(memoryUsage)}%`,
        percent: Math.round(memoryUsage),
        status:
          memoryUsage > 80
            ? "exception"
            : memoryUsage > 60
              ? "normal"
              : "success",
        color:
          memoryUsage > 80
            ? "#fa541c"
            : memoryUsage > 60
              ? "#1890ff"
              : "#52c41a",
      },
      {
        key: "disk",
        label: "磁盘使用率",
        value: `${Math.round(diskUsage)}%`,
        percent: Math.round(diskUsage),
        status:
          diskUsage > 80 ? "exception" : diskUsage > 60 ? "normal" : "success",
        color:
          diskUsage > 80 ? "#fa541c" : diskUsage > 60 ? "#1890ff" : "#52c41a",
      },
      {
        key: "network",
        label: "网络延迟",
        value: `${Math.round(networkLatency)}ms`,
        percent: Math.min((networkLatency / 50) * 100, 100), // 假设50ms为100%
        status:
          networkLatency > 30
            ? "exception"
            : networkLatency > 15
              ? "normal"
              : "success",
        color:
          networkLatency > 30
            ? "#fa541c"
            : networkLatency > 15
              ? "#1890ff"
              : "#52c41a",
      },
    ];

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("获取性能指标失败:", error);
    next(error);
  }
};

// 导出报告
export const exportReport = async (req, res, next) => {
  try {
    const { type, content, format } = req.body;

    // 这里应该实现实际的报告生成逻辑
    // 目前返回模拟的下载链接
    const downloadUrl = `/api/admin/dashboard/download-report?type=${type}&format=${format}`;

    res.json({
      success: true,
      data: {
        downloadUrl,
      },
    });
  } catch (error) {
    console.error("导出报告失败:", error);
    next(error);
  }
};

// 辅助函数：获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    draft: "草稿",
    published: "已发布",
    archived: "已归档",
  };
  return statusMap[status] || status;
};

// 辅助函数：获取操作文本
const getActionText = (action, entityType) => {
  const actionMap = {
    create: "创建了",
    update: "更新了",
    delete: "删除了",
    publish: "发布了",
    login: "登录了系统",
    logout: "退出了系统",
  };
  return actionMap[action] || action;
};

// 辅助函数：检查数据库状态
const checkDatabaseStatus = async () => {
  try {
    // 简单的数据库连接测试
    await User.findOne().limit(1);
    return {
      status: "healthy",
      message: "连接正常",
    };
  } catch (error) {
    return {
      status: "error",
      message: "连接异常",
    };
  }
};

// 辅助函数：检查存储状态
const checkStorageStatus = async () => {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");

    // 检查目录是否存在
    if (!fs.existsSync(uploadsDir)) {
      return {
        status: "healthy",
        message: "0% (0GB/10GB)",
      };
    }

    // 计算目录大小
    const calculateDirSize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          totalSize += calculateDirSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    };

    const totalSize = calculateDirSize(uploadsDir);
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    const usagePercent = (totalSize / maxSize) * 100;

    if (usagePercent > 80) {
      return {
        status: "error",
        message: `${Math.round(usagePercent)}% (${(totalSize / 1024 / 1024 / 1024).toFixed(1)}GB/10GB)`,
      };
    } else if (usagePercent > 60) {
      return {
        status: "warning",
        message: `${Math.round(usagePercent)}% (${(totalSize / 1024 / 1024 / 1024).toFixed(1)}GB/10GB)`,
      };
    } else {
      return {
        status: "healthy",
        message: `${Math.round(usagePercent)}% (${(totalSize / 1024 / 1024 / 1024).toFixed(1)}GB/10GB)`,
      };
    }
  } catch (error) {
    console.error("存储状态检查失败:", error);
    return {
      status: "error",
      message: "检查失败",
    };
  }
};

// 辅助函数：检查内存状态
const checkMemoryStatus = async () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    if (usagePercent > 80) {
      return {
        status: "error",
        message: `${Math.round(usagePercent)}% (${(usedMemory / 1024 / 1024 / 1024).toFixed(1)}GB/${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB)`,
      };
    } else if (usagePercent > 60) {
      return {
        status: "warning",
        message: `${Math.round(usagePercent)}% (${(usedMemory / 1024 / 1024 / 1024).toFixed(1)}GB/${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB)`,
      };
    } else {
      return {
        status: "healthy",
        message: `${Math.round(usagePercent)}% (${(usedMemory / 1024 / 1024 / 1024).toFixed(1)}GB/${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB)`,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: "检查失败",
    };
  }
};

// 辅助函数：获取磁盘使用情况
const getDiskUsage = async () => {
  try {
    // 使用 Node.js 的 fs 模块获取磁盘使用情况
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // 在 Linux/Unix 系统上使用 df 命令
    if (process.platform !== "win32") {
      const { stdout } = await execAsync("df -h / | tail -1");
      const parts = stdout.trim().split(/\s+/);
      const usageStr = parts[4]; // 使用率百分比
      const usage = parseInt(usageStr.replace("%", ""));
      return usage || 50; // 如果解析失败，返回默认值
    } else {
      // Windows 系统返回模拟数据
      return Math.random() * 30 + 50; // 50-80%
    }
  } catch (error) {
    console.error("磁盘使用检查失败:", error);
    // 返回模拟数据作为后备
    return Math.random() * 30 + 50; // 50-80%
  }
};
