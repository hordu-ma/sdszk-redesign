// activityLogs.js - 活动日志路由
import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// 所有日志路由都需要管理员权限
router.use(protect, restrictTo("admin"));

// 获取日志列表
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      startDate,
      endDate,
    } = req.query;

    // 构建查询条件
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    // 日期筛选
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // 执行查询
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "username name avatar");

    // 获取总数
    const total = await ActivityLog.countDocuments(query);

    res.json({
      status: "success",
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 获取单个日志详情
router.get("/:id", async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id).populate(
      "userId",
      "username name avatar"
    );

    if (!log) {
      return res.status(404).json({
        status: "fail",
        message: "日志不存在",
      });
    }

    res.json({
      status: "success",
      data: log,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 获取用户活动统计
router.get("/stats/users", async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          lastActivity: { $max: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          count: 1,
          lastActivity: 1,
          username: "$user.username",
          name: "$user.name",
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 获取操作类型统计
router.get("/stats/actions", async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 清除旧日志（保留最近30天）
router.delete("/cleanup", restrictTo("admin"), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: thirtyDaysAgo },
    });

    res.json({
      status: "success",
      message: `已删除 ${result.deletedCount} 条旧日志记录`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

export default router;
