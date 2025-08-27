// favoriteController.js - 收藏功能控制器
import Favorite from "../models/Favorite.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

// 添加收藏
export const addFavorite = catchAsync(async (req, res, next) => {
  const { itemType, itemId, category, tags, notes, isPublic } = req.body;
  const userId = req.user.id;

  try {
    const favorite = await Favorite.addFavorite(userId, itemType, itemId, {
      category,
      tags,
      notes,
      isPublic,
    });

    res.status(201).json({
      status: "success",
      message: "收藏成功",
      data: {
        favorite,
      },
    });
  } catch (error) {
    if (error.message === "已经收藏过该项目") {
      return next(new AppError("已经收藏过该项目", 400));
    }
    return next(error);
  }
});

// 移除收藏
export const removeFavorite = catchAsync(async (req, res, next) => {
  const { itemType, itemId } = req.params;
  const userId = req.user.id;

  const removed = await Favorite.removeFavorite(userId, itemType, itemId);

  if (!removed) {
    return next(new AppError("收藏项目不存在", 404));
  }

  res.status(200).json({
    status: "success",
    message: "取消收藏成功",
  });
});

// 检查是否已收藏
export const checkFavorite = catchAsync(async (req, res, next) => {
  const { itemType, itemId } = req.params;
  const userId = req.user.id;

  const isFavorited = await Favorite.isFavorited(userId, itemType, itemId);

  res.status(200).json({
    status: "success",
    data: {
      isFavorited,
    },
  });
});

// 获取用户收藏列表
export const getUserFavorites = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const {
    itemType,
    category,
    page = 1,
    limit = 20,
    sort = "-createdAt",
  } = req.query;

  const result = await Favorite.getUserFavorites(userId, {
    itemType,
    category,
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// 更新收藏分类
export const updateFavoriteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { category } = req.body;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({ _id: id, user: userId });

  if (!favorite) {
    return next(new AppError("收藏项目不存在", 404));
  }

  await favorite.updateCategory(category);

  res.status(200).json({
    status: "success",
    message: "分类更新成功",
    data: {
      favorite,
    },
  });
});

// 批量更新收藏分类
export const batchUpdateFavorites = catchAsync(async (req, res, next) => {
  const { favoriteIds, category } = req.body;
  const userId = req.user.id;

  const result = await Favorite.updateMany(
    {
      _id: { $in: favoriteIds },
      user: userId,
    },
    { category },
  );

  res.status(200).json({
    status: "success",
    message: `成功更新 ${result.modifiedCount} 个收藏项目`,
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
});

// 批量删除收藏
export const batchDeleteFavorites = catchAsync(async (req, res, next) => {
  const { favoriteIds } = req.body;
  const userId = req.user.id;

  const result = await Favorite.deleteMany({
    _id: { $in: favoriteIds },
    user: userId,
  });

  res.status(200).json({
    status: "success",
    message: `成功删除 ${result.deletedCount} 个收藏项目`,
    data: {
      deletedCount: result.deletedCount,
    },
  });
});

// 获取收藏统计信息
export const getFavoriteStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const pipeline = [
    { $match: { user: userId } },
    {
      $group: {
        _id: "$itemType",
        count: { $sum: 1 },
        categories: { $addToSet: "$category" },
      },
    },
  ];

  const stats = await Favorite.aggregate(pipeline);

  // 获取总数
  const total = await Favorite.countDocuments({ user: userId });

  // 获取分类统计
  const categoryStats = await Favorite.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      total,
      byType: stats,
      byCategory: categoryStats,
    },
  });
});

// 添加收藏标签
export const addFavoriteTag = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { tag } = req.body;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({ _id: id, user: userId });

  if (!favorite) {
    return next(new AppError("收藏项目不存在", 404));
  }

  await favorite.addTag(tag);

  res.status(200).json({
    status: "success",
    message: "标签添加成功",
    data: {
      favorite,
    },
  });
});

// 移除收藏标签
export const removeFavoriteTag = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { tag } = req.body;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({ _id: id, user: userId });

  if (!favorite) {
    return next(new AppError("收藏项目不存在", 404));
  }

  await favorite.removeTag(tag);

  res.status(200).json({
    status: "success",
    message: "标签移除成功",
    data: {
      favorite,
    },
  });
});
