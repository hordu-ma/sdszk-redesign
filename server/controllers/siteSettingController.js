// siteSettingController.js - 站点设置控制器
import SiteSetting from "../models/SiteSetting.js";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../utils/appError.js";
import ActivityLog from "../models/ActivityLog.js";
import cacheService from "../services/cacheService.js";

// 获取所有设置
export const getAllSettings = async (req, res, next) => {
  try {
    const cacheKey = "settings:all";

    // 使用缓存包装
    const groupedSettings = await cacheService.wrap(
      cacheKey,
      async () => {
        const settings = await SiteSetting.find().sort({ group: 1, key: 1 });

        // 将设置按组分类
        return settings.reduce((result, setting) => {
          if (!result[setting.group]) {
            result[setting.group] = [];
          }
          result[setting.group].push(setting);
          return result;
        }, {});
      },
      300, // 5分钟缓存
    );

    res.json({
      status: "success",
      data: groupedSettings,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

// 获取按组分类的设置
export const getSettingsByGroup = async (req, res, next) => {
  try {
    const { group } = req.params;
    const cacheKey = `settings:group:${group}`;

    // 使用缓存包装
    const settings = await cacheService.wrap(
      cacheKey,
      async () => {
        return await SiteSetting.find({ group }).sort({ key: 1 });
      },
      300, // 5分钟缓存
    );

    res.json({
      status: "success",
      data: settings,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

// 获取单个设置
export const getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await SiteSetting.findOne({ key });

    if (!setting) {
      return next(new NotFoundError("设置不存在"));
    }

    res.json({
      status: "success",
      data: setting,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

// 更新设置
export const updateSetting = async (req, res, next) => {
  try {
    // 检查用户身份验证
    if (!req.user) {
      return next(new UnauthorizedError("请先登录"));
    }

    const { key } = req.params;
    const { value, description, group, type } = req.body;

    // 检查受保护的设置
    const existingSetting = await SiteSetting.findOne({ key });
    if (
      existingSetting &&
      existingSetting.isProtected &&
      req.user.role !== "admin"
    ) {
      return next(new ForbiddenError("此设置受保护，只有管理员可以修改"));
    }

    const setting = await SiteSetting.findOneAndUpdate(
      { key },
      {
        value,
        description: description || existingSetting?.description,
        group: group || existingSetting?.group,
        type: type || existingSetting?.type,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true },
    );

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "settings_update",
      entityType: "setting",
      entityId: setting._id,
      entityName: setting.key,
      details: {
        key: setting.key,
        group: setting.group,
        oldValue: existingSetting?.value,
        newValue: setting.value,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("settings:*");
    await cacheService.del("public_settings");
    console.log("已清除设置相关缓存");

    res.json({
      status: "success",
      data: setting,
    });
  } catch (err) {
    return next(new BadRequestError(err.message));
  }
};

// 批量更新设置
export const bulkUpdateSettings = async (req, res, next) => {
  try {
    // 检查用户身份验证
    if (!req.user) {
      return next(new UnauthorizedError("请先登录"));
    }

    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return next(new BadRequestError("请提供设置数组"));
    }

    const results = [];

    for (const setting of settings) {
      const { key, value, description, group, type } = setting;

      // 检查受保护的设置
      const existingSetting = await SiteSetting.findOne({ key });
      if (
        existingSetting &&
        existingSetting.isProtected &&
        req.user.role !== "admin"
      ) {
        results.push({
          key,
          success: false,
          message: "此设置受保护，只有管理员可以修改",
        });
        continue;
      }

      const updatedSetting = await SiteSetting.findOneAndUpdate(
        { key },
        {
          value,
          description: description || existingSetting?.description,
          group: group || existingSetting?.group,
          type: type || existingSetting?.type,
          updatedBy: req.user._id,
        },
        { new: true, upsert: true, runValidators: true },
      );

      // 记录活动
      await ActivityLog.logActivity({
        user: req.user._id,
        action: "settings_update",
        entityType: "setting",
        entityId: updatedSetting._id,
        entityName: updatedSetting.key,
        details: {
          key: updatedSetting.key,
          group: updatedSetting.group,
          oldValue: existingSetting?.value,
          newValue: updatedSetting.value,
        },
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      results.push({
        key,
        success: true,
        data: updatedSetting,
      });
    }

    // 清除相关缓存
    await cacheService.delByPattern("settings:*");
    await cacheService.del("public_settings");
    console.log("已清除设置相关缓存");

    res.json({
      status: "success",
      results,
    });
  } catch (err) {
    return next(new BadRequestError(err.message));
  }
};

// 删除设置
export const deleteSetting = async (req, res, next) => {
  try {
    // 检查用户身份验证
    if (!req.user) {
      return next(new UnauthorizedError("请先登录"));
    }

    const { key } = req.params;

    // 检查受保护的设置
    const existingSetting = await SiteSetting.findOne({ key });
    if (!existingSetting) {
      return next(new NotFoundError("设置不存在"));
    }

    if (existingSetting.isProtected) {
      return next(new ForbiddenError("此设置受保护，不可删除"));
    }

    await SiteSetting.deleteOne({ key });

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "settings_delete",
      entityType: "setting",
      entityId: existingSetting._id,
      entityName: existingSetting.key,
      details: {
        key: existingSetting.key,
        value: existingSetting.value,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("settings:*");
    await cacheService.del("public_settings");
    console.log("已清除设置相关缓存");

    res.json({
      status: "success",
      message: "设置已删除",
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

// 重置为默认设置
export const resetToDefault = async (req, res, next) => {
  try {
    // 检查用户身份验证
    if (!req.user) {
      return next(new UnauthorizedError("请先登录"));
    }

    await SiteSetting.initializeDefaultSettings();

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "settings_reset",
      entityType: "system",
      entityName: "系统设置重置",
      details: {
        message: "重置为默认设置",
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("settings:*");
    await cacheService.del("public_settings");
    console.log("已清除设置相关缓存");

    res.json({
      status: "success",
      message: "设置已重置为默认值",
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

/**
 * @openapi
 * components:
 *   schemas:
 *     SiteSetting:
 *       type: object
 *       required:
 *         - key
 *         - value
 *         - group
 *       properties:
 *         id:
 *           type: string
 *           description: 设置ID
 *         key:
 *           type: string
 *           description: 设置键
 *         value:
 *           type: object
 *           description: 设置值
 *         group:
 *           type: string
 *           description: 设置组
 *         description:
 *           type: string
 *           description: 设置描述
 *         type:
 *           type: string
 *           enum: [text, number, boolean, json, array, image, color]
 *           description: 设置类型
 *         isProtected:
 *           type: boolean
 *           description: 是否受保护
 *         updatedBy:
 *           type: string
 *           description: 更新者ID
 *       example:
 *         id: "605c69e2f2d8c90015eaf123"
 *         key: "siteName"
 *         value: "山东省大中小学思政课一体化指导中心"
 *         group: "general"
 *         description: "网站名称"
 *         type: "text"
 *         isProtected: false
 *         updatedBy: "605c69e2f2d8c90015eaf456"
 */

/**
 * @openapi
 * /settings/public:
 *   get:
 *     summary: 获取前端公开设置
 *     description: 获取前端可用的公开设置
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 成功获取公开设置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   description: 公开设置键值对
 *       500:
 *         description: 服务器内部错误
 */
export const getPublicSettings = async (req, res, next) => {
  try {
    const cacheKey = "public_settings";

    // 使用缓存包装
    const publicSettings = await cacheService.wrap(
      cacheKey,
      async () => {
        console.log("从数据库获取公开设置");
        // 定义前端可用的公开设置组
        const publicGroups = [
          "general",
          "appearance",
          "homepage",
          "footer",
          "contact",
        ];

        const settings = await SiteSetting.find({
          group: { $in: publicGroups },
        });

        // 将设置转换为键值对格式
        return settings.reduce((result, setting) => {
          result[setting.key] = setting.value;
          return result;
        }, {});
      },
      3600, // 1小时缓存
    );

    res.json({
      status: "success",
      data: publicSettings,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};
