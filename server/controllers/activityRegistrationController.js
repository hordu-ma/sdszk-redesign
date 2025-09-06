// server/controllers/activityRegistrationController.js - 活动报名控制器
import ActivityRegistration from "../models/ActivityRegistration.js";
import Activity from "../models/Activity.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../utils/appError.js";

/**
 * @description 创建一个新的活动报名
 * @route POST /api/activity-registrations
 * @access Private
 */
export const createActivityRegistration = async (req, res, next) => {
  try {
    const {
      activityId,
      name,
      gender,
      organization,
      schoolType,
      position,
      professionalTitle,
      educationLevel,
      phone,
      email,
      attachmentPath,
      notes,
    } = req.body;
    const userId = req.user._id;

    // 检查活动是否存在且处于可报名状态
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return next(new NotFoundError("目标活动不存在"));
    }
    if (activity.status !== "upcoming" && activity.status !== "ongoing") {
      return next(new BadRequestError("该活动当前不可报名"));
    }

    // 检查用户是否已报名
    const existingRegistration = await ActivityRegistration.findOne({
      activity: activityId,
      user: userId,
    });
    if (existingRegistration) {
      return next(new BadRequestError("您已经报名参加此活动，请勿重复提交"));
    }

    // 创建报名记录
    const registration = await ActivityRegistration.create({
      activity: activityId,
      user: userId,
      name,
      gender,
      organization,
      schoolType,
      position,
      professionalTitle,
      educationLevel,
      phone,
      email,
      attachmentPath,
      notes,
    });

    // 更新活动报名人数 (如果需要)
    // await Activity.findByIdAndUpdate(activityId, { $inc: { currentAttendees: 1 } });

    res.status(201).json({
      status: "success",
      data: registration,
      message: "活动报名成功！",
    });
  } catch (err) {
    // 处理Mongoose唯一索引冲突错误
    if (err.code === 11000) {
      return next(new BadRequestError("您已经报名参加此活动，请勿重复提交。"));
    }
    next(err);
  }
};

/**
 * @description 获取指定活动的所有报名记录
 * @route GET /api/activities/:activityId/registrations
 * @access Private (Admin/Editor)
 */
export const getActivityRegistrations = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    // 权限检查：只有管理员或活动创建者可以查看报名列表
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return next(new NotFoundError("目标活动不存在"));
    }
    if (
      req.user.role !== "admin" &&
      activity.createdBy.toString() !== req.user._id.toString()
    ) {
      return next(new ForbiddenError("您没有权限查看此活动的报名列表"));
    }

    const registrations = await ActivityRegistration.find({
      activity: activityId,
    }).populate("user", "username name avatar");

    res.json({
      status: "success",
      results: registrations.length,
      data: registrations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description 获取当前用户的所有报名记录
 * @route GET /api/my-registrations
 * @access Private
 */
export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await ActivityRegistration.find({
      user: req.user._id,
    })
      .populate("activity", "title startDate status")
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      results: registrations.length,
      data: registrations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description 用户取消自己的一个报名
 * @route DELETE /api/activity-registrations/:id
 * @access Private
 */
export const cancelMyRegistration = async (req, res, next) => {
  try {
    const registration = await ActivityRegistration.findById(req.params.id);

    if (!registration) {
      return next(new NotFoundError("该报名记录不存在"));
    }

    // 确认是用户本人在操作
    if (registration.user.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError("您没有权限取消他人的报名"));
    }

    // 逻辑删除或直接删除，这里我们直接删除
    await registration.deleteOne();

    // 如果有统计报名人数，可以在这里减一
    // await Activity.findByIdAndUpdate(registration.activity, { $inc: { currentAttendees: -1 } });

    res.status(200).json({
      status: "success",
      message: "报名已成功取消",
    });
  } catch (err) {
    next(err);
  }
};
