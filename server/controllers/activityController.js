// activityController.js - 活动控制器
import Activity from "../models/Activity.js";
import ActivityLog from "../models/ActivityLog.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../utils/appError.js";

// 获取活动列表
export const getActivityList = async (req, res, next) => {
  try {
    const { category, status, page = 1, limit = 10, search } = req.query;

    // 构建查询条件
    const query = {};

    // 按类别筛选
    if (category) {
      query.category = category;
    }

    // 按状态筛选
    if (status) {
      query.status = status;
    } else {
      // 默认显示未结束的活动
      query.status = { $in: ["upcoming", "ongoing"] };
    }

    // 全文搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 默认只返回已发布的活动，除非明确请求所有活动
    if (req.query.all !== "true") {
      query.isPublished = true;
    }

    // 执行查询
    const activities = await Activity.find(query)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "username name")
      .populate("updatedBy", "username name");

    // 获取总数
    const total = await Activity.countDocuments(query);

    res.json({
      status: "success",
      data: activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// 获取单个活动
export const getActivityById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("createdBy", "username name")
      .populate("updatedBy", "username name");

    if (!activity) {
      return next(new NotFoundError("活动不存在"));
    }

    // 如果活动未发布，只有创建者或管理员可以查看
    if (
      !activity.isPublished &&
      (!req.user ||
        (req.user._id.toString() !== activity.createdBy._id.toString() &&
          req.user.role !== "admin"))
    ) {
      return next(new ForbiddenError("您没有权限查看此活动"));
    }

    // 更新浏览量
    activity.viewCount += 1;
    await activity.save({ validateBeforeSave: false });

    res.json({
      status: "success",
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};

// 创建活动
export const createActivity = async (req, res, next) => {
  try {
    // 设置创建者
    req.body.createdBy = req.user._id;

    // 根据开始和结束日期自动设置状态
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const now = new Date();

    if (now < startDate) {
      req.body.status = "upcoming";
    } else if (now >= startDate && now <= endDate) {
      req.body.status = "ongoing";
    } else {
      req.body.status = "completed";
    }

    const activity = new Activity(req.body);
    const savedActivity = await activity.save();

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "create",
      entityType: "activity",
      entityId: savedActivity._id,
      details: {
        title: savedActivity.title,
        category: savedActivity.category,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      status: "success",
      data: savedActivity,
    });
  } catch (err) {
    next(err);
  }
};

// 更新活动
export const updateActivity = async (req, res, next) => {
  try {
    // 设置更新者
    req.body.updatedBy = req.user._id;

    // 如果有开始和结束日期，更新状态
    if (req.body.startDate || req.body.endDate) {
      const existingActivity = await Activity.findById(req.params.id);

      if (!existingActivity) {
        return next(new NotFoundError("活动不存在"));
      }

      const startDate = new Date(
        req.body.startDate || existingActivity.startDate,
      );
      const endDate = new Date(req.body.endDate || existingActivity.endDate);
      const now = new Date();

      if (now < startDate) {
        req.body.status = "upcoming";
      } else if (now >= startDate && now <= endDate) {
        req.body.status = "ongoing";
      } else {
        req.body.status = "completed";
      }
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedActivity) {
      return next(new NotFoundError("活动不存在"));
    }

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "update",
      entityType: "activity",
      entityId: updatedActivity._id,
      details: {
        title: updatedActivity.title,
        category: updatedActivity.category,
        fields: Object.keys(req.body),
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      status: "success",
      data: updatedActivity,
    });
  } catch (err) {
    next(err);
  }
};

// 删除活动
export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return next(new NotFoundError("活动不存在"));
    }

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "delete",
      entityType: "activity",
      entityId: activity._id,
      details: {
        title: activity.title,
        category: activity.category,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await activity.deleteOne();

    res.json({
      status: "success",
      message: "活动已删除",
    });
  } catch (err) {
    next(err);
  }
};

// 发布/取消发布活动
export const togglePublishStatus = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return next(new NotFoundError("活动不存在"));
    }

    activity.isPublished = !activity.isPublished;
    activity.updatedBy = req.user._id;
    await activity.save();

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: activity.isPublished ? "publish" : "unpublish",
      entityType: "activity",
      entityId: activity._id,
      details: {
        title: activity.title,
        category: activity.category,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      status: "success",
      data: activity,
      message: activity.isPublished ? "活动已发布" : "活动已取消发布",
    });
  } catch (err) {
    next(err);
  }
};

// 设置/取消设置为精选活动
export const toggleFeaturedStatus = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return next(new NotFoundError("活动不存在"));
    }

    activity.isFeatured = !activity.isFeatured;
    activity.updatedBy = req.user._id;
    await activity.save();

    res.json({
      status: "success",
      data: activity,
      message: activity.isFeatured ? "已设为精选活动" : "已取消精选活动",
    });
  } catch (err) {
    next(err);
  }
};

// 获取即将开始的活动（首页展示用）
export const getUpcomingActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const activities = await Activity.find({
      isPublished: true,
      status: "upcoming",
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .select("title summary poster startDate endDate location category");

    res.json({
      status: "success",
      results: activities.length,
      data: activities,
    });
  } catch (err) {
    next(err);
  }
};

// 更新活动参与者数量
export const updateAttendeeCount = async (req, res, next) => {
  try {
    const { count } = req.body;

    if (typeof count !== "number") {
      return next(new BadRequestError("参与者数量必须是数字"));
    }

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return next(new NotFoundError("活动不存在"));
    }

    activity.currentAttendees = count;
    activity.updatedBy = req.user._id;
    await activity.save();

    res.json({
      status: "success",
      data: {
        currentAttendees: activity.currentAttendees,
      },
    });
  } catch (err) {
    next(err);
  }
};
