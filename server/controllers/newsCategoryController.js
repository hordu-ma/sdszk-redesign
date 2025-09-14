import NewsCategory from "../models/NewsCategory.js";
import ActivityLog from "../models/ActivityLog.js";
import { AppError, NotFoundError, ForbiddenError } from "../utils/appError.js";
import cacheService from "../services/cacheService.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     NewsCategory:
 *       type: object
 *       required:
 *         - name
 *         - key
 *       properties:
 *         id:
 *           type: string
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         key:
 *           type: string
 *           description: 分类标识符
 *         description:
 *           type: string
 *           description: 分类描述
 *         order:
 *           type: number
 *           description: 排序
 *         color:
 *           type: string
 *           description: 分类颜色
 *         icon:
 *           type: string
 *           description: 分类图标
 *         isActive:
 *           type: boolean
 *           description: 是否激活
 *         isCore:
 *           type: boolean
 *           description: 是否为核心分类
 *         createdBy:
 *           type: string
 *           description: 创建者ID
 *         updatedBy:
 *           type: string
 *           description: 更新者ID
 *       example:
 *         id: "605c69e2f2d8c90015eaf123"
 *         name: "中心动态"
 *         key: "center"
 *         description: "中心最新动态"
 *         order: 1
 *         color: "#1890ff"
 *         icon: "notification"
 *         isActive: true
 *         isCore: true
 *         createdBy: "605c69e2f2d8c90015eaf456"
 *         updatedBy: "605c69e2f2d8c90015eaf456"
 */

/**
 * @openapi
 * /news-categories:
 *   get:
 *     summary: 获取所有新闻分类
 *     description: 获取所有新闻分类列表
 *     tags: [NewsCategories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: 是否包含非激活分类
 *     responses:
 *       200:
 *         description: 成功获取分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewsCategory'
 *       500:
 *         description: 服务器内部错误
 */
export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive = false } = req.query;
    const cacheKey = includeInactive
      ? "news_categories:all"
      : "news_categories:active";

    // 使用缓存包装
    const categories = await cacheService.wrap(
      cacheKey,
      async () => {
        console.log("从数据库获取新闻分类");
        const query = includeInactive ? {} : { isActive: true };
        console.log("查询条件:", query);

        const dbCategories = await NewsCategory.find(query).sort({
          order: 1,
          name: 1,
        });

        console.log("找到分类数量:", dbCategories.length);
        console.log(
          "分类数据:",
          dbCategories.map((c) => ({ name: c.name, isActive: c.isActive })),
        );

        // 标记核心分类
        return dbCategories.map((cat) => ({
          ...cat.toObject(),
          isEditable: !cat.isCore,
        }));
      },
      3600, // 1小时缓存
    );

    res.json({
      status: "success",
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

// 获取单个分类
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await NewsCategory.findById(req.params.id);
    if (!category) {
      throw new NotFoundError("分类不存在");
    }

    res.json({
      status: "success",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// 获取核心分类
export const getCoreCategories = async (req, res, next) => {
  try {
    const cacheKey = "news_categories:core";

    // 使用缓存包装
    const coreCategories = await cacheService.wrap(
      cacheKey,
      async () => {
        return await NewsCategory.getCoreCategories();
      },
      3600, // 1小时缓存
    );

    res.json({
      status: "success",
      data: coreCategories,
    });
  } catch (err) {
    next(err);
  }
};

// 创建新闻分类
export const createCategory = async (req, res, next) => {
  try {
    // 设置创建者
    req.body.createdBy = req.user._id;

    // 禁止创建核心分类
    if (req.body.isCore) {
      throw new ForbiddenError("不能手动创建核心分类");
    }

    const category = new NewsCategory(req.body);
    const savedCategory = await category.save();

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "create",
      entityType: "newsCategory",
      entityId: savedCategory._id,
      details: {
        name: savedCategory.name,
        key: savedCategory.key,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("news_categories:*");
    console.log("已清除新闻分类相关缓存");

    res.status(201).json({
      status: "success",
      data: savedCategory,
    });
  } catch (err) {
    let statusCode = 400;
    let errorMessage = err.message;

    // 处理MongoDB重复键错误
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];

      if (field === "name") {
        errorMessage = `分类名称"${value}"已存在，请使用其他名称`;
      } else if (field === "key") {
        errorMessage = `分类标识"${value}"已存在，请使用其他标识`;
      } else {
        errorMessage = "该分类已存在，请检查名称和标识是否重复";
      }
    }
    // 处理验证错误
    else if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      errorMessage = errors.join(", ");
    }

    next(new AppError(errorMessage, statusCode));
  }
};

// 更新新闻分类
export const updateCategory = async (req, res, next) => {
  try {
    const category = await NewsCategory.findById(req.params.id);

    if (!category) {
      throw new NotFoundError("分类不存在");
    }

    // 检查是否是核心分类
    if (category.isCore) {
      // 核心分类只允许更新某些字段
      const allowedUpdates = ["description", "color", "icon"];
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update),
      );

      if (!isValidOperation) {
        throw new ForbiddenError("核心分类只能更新描述、颜色和图标");
      }
    }

    // 设置更新者
    req.body.updatedBy = req.user._id;

    const updatedCategory = await NewsCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "update",
      entityType: "newsCategory",
      entityId: updatedCategory._id,
      details: {
        name: updatedCategory.name,
        key: updatedCategory.key,
        changes: req.body,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("news_categories:*");
    console.log("已清除新闻分类相关缓存");

    res.json({
      status: "success",
      data: updatedCategory,
    });
  } catch (err) {
    next(err);
  }
};

// 删除新闻分类
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await NewsCategory.findById(req.params.id);

    if (!category) {
      throw new NotFoundError("分类不存在");
    }

    // 软删除：将isActive设为false
    category.isActive = false;
    category.updatedBy = req.user._id;
    await category.save();

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "delete",
      entityType: "newsCategory",
      entityId: category._id,
      details: {
        name: category.name,
        key: category.key,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("news_categories:*");
    console.log("已清除新闻分类相关缓存");

    res.json({
      status: "success",
      message: "分类已删除",
    });
  } catch (err) {
    next(err);
  }
};

// 更新分类排序
export const updateCategoryOrder = async (req, res, next) => {
  try {
    const { categories } = req.body;

    // 批量更新分类顺序
    await Promise.all(
      categories.map((item) =>
        NewsCategory.findByIdAndUpdate(
          item.id,
          { order: item.order, updatedBy: req.user._id },
          { new: true },
        ),
      ),
    );

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: "reorder",
      entityType: "newsCategory",
      details: {
        count: categories.length,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 清除相关缓存
    await cacheService.delByPattern("news_categories:*");
    console.log("已清除新闻分类相关缓存");

    res.json({
      status: "success",
      message: "分类排序已更新",
    });
  } catch (err) {
    next(err);
  }
};
