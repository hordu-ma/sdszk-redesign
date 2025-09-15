import News from "../models/News.js";
import response from "../utils/responseHelper.js";
import mongoose from "mongoose";

// 字段映射函数：后端字段名 -> 前端字段名
const mapBackendToFrontend = (data) => {
  if (!data) return data;

  // 使用 JSON.parse(JSON.stringify()) 来安全地深拷贝 Mongoose 文档
  let mapped;
  try {
    if (data.toObject) {
      mapped = JSON.parse(JSON.stringify(data.toObject()));
    } else {
      mapped = JSON.parse(JSON.stringify(data));
    }
  } catch (error) {
    console.error("序列化错误:", error);
    return data;
  }

  // 首先处理_id到id的转换
  if (mapped._id !== undefined) {
    mapped.id = mapped._id.toString();
    delete mapped._id;
  }

  // 递归处理嵌套对象的_id字段
  const processNestedObject = (obj) => {
    if (obj && typeof obj === "object" && obj._id) {
      obj.id = obj._id.toString();
      delete obj._id;
    }
    return obj;
  };

  // 处理其他可能包含_id的嵌套对象
  if (mapped.createdBy) {
    mapped.createdBy = processNestedObject(mapped.createdBy);
  }

  if (mapped.updatedBy) {
    mapped.updatedBy = processNestedObject(mapped.updatedBy);
  }

  if (mapped.category && typeof mapped.category === "object") {
    mapped.category = processNestedObject(mapped.category);
    // 添加便于前端使用的分类字段
    mapped.categoryKey = mapped.category.key;
    mapped.categoryName = mapped.category.name;
  }

  return mapped;
};

// 构建高级搜索查询条件
const buildAdvancedQuery = (queryParams) => {
  const query = {};

  // 默认只查询已发布的新闻（除非明确指定其他状态）
  if (!queryParams.status) {
    query.status = "published";
  }

  // 关键词搜索（标题和内容）
  if (queryParams.keyword) {
    query.$or = [
      { title: { $regex: queryParams.keyword, $options: "i" } },
      { content: { $regex: queryParams.keyword, $options: "i" } },
      { summary: { $regex: queryParams.keyword, $options: "i" } },
    ];
  }

  // 分类筛选
  if (queryParams.category) {
    console.log("🏷️ 处理分类筛选:");
    console.log("  - 原始分类参数:", queryParams.category);
    console.log(
      "  - 是否为有效ObjectId:",
      mongoose.Types.ObjectId.isValid(queryParams.category),
    );

    if (mongoose.Types.ObjectId.isValid(queryParams.category)) {
      query.category = new mongoose.Types.ObjectId(queryParams.category);
      console.log("  - 转换为ObjectId:", query.category);
    } else {
      query.category = queryParams.category;
      console.log("  - 保持原样:", query.category);
    }
  }

  // 状态筛选
  if (queryParams.status) {
    query.status = queryParams.status;
  }

  // 作者筛选
  if (queryParams.author) {
    query.author = { $regex: queryParams.author, $options: "i" };
  }

  // 标签筛选
  if (queryParams.tags && queryParams.tags.length > 0) {
    query.tags = { $in: queryParams.tags };
  }

  // 阅读量范围筛选
  if (queryParams.viewRange) {
    const [min, max] = queryParams.viewRange.split("-").map(Number);
    if (max) {
      query.viewCount = { $gte: min, $lte: max };
    } else {
      query.viewCount = { $gte: min };
    }
  }

  // 创建时间范围
  if (queryParams.createDateRange && queryParams.createDateRange.length === 2) {
    query.createdAt = {
      $gte: new Date(queryParams.createDateRange[0]),
      $lte: new Date(queryParams.createDateRange[1] + "T23:59:59.999Z"),
    };
  }

  // 发布时间范围
  if (
    queryParams.publishDateRange &&
    queryParams.publishDateRange.length === 2
  ) {
    query.publishDate = {
      $gte: new Date(queryParams.publishDateRange[0]),
      $lte: new Date(queryParams.publishDateRange[1] + "T23:59:59.999Z"),
    };
  }

  // 特色设置筛选
  if (queryParams.features && queryParams.features.length > 0) {
    queryParams.features.forEach((feature) => {
      if (feature === "isTop") query.isTop = true;
      if (feature === "isFeatured") query.isFeatured = true;
    });
  }

  // 内容类型筛选
  if (queryParams.contentTypes && queryParams.contentTypes.length > 0) {
    queryParams.contentTypes.forEach((type) => {
      if (type === "hasImage") {
        query.$or = query.$or || [];
        query.$or.push({ featuredImage: { $exists: true, $ne: "" } });
        query.$or.push({ content: { $regex: "<img", $options: "i" } });
      }
      if (type === "hasVideo") {
        query.$or = query.$or || [];
        query.$or.push({ content: { $regex: "<video", $options: "i" } });
        query.$or.push({ content: { $regex: "youtube", $options: "i" } });
      }
    });
  }

  return query;
};

// 构建排序条件
const buildSortOptions = (sortBy) => {
  const sortOptions = {};

  switch (sortBy) {
    case "createdAt":
      sortOptions.createdAt = -1;
      break;
    case "publishDate":
      sortOptions.publishDate = -1;
      break;
    case "viewCount":
      sortOptions.viewCount = -1;
      break;
    case "title":
      sortOptions.title = 1;
      break;
    default:
      sortOptions.publishDate = -1;
  }

  return sortOptions;
};

// 获取新闻列表（增强版）
export const getNewsList = async (req, res) => {
  try {
    console.log("🔍 收到新闻列表请求:");
    console.log("  - URL:", req.originalUrl);
    console.log("  - Query参数:", JSON.stringify(req.query, null, 2));

    const {
      page = 1,
      limit = 10,
      keyword,
      category,
      status,
      author,
      tags,
      viewRange,
      createDateRange,
      publishDateRange,
      sortBy = "publishDate",
      features,
      contentTypes,
    } = req.query;

    console.log("📋 解析后的参数:");
    console.log("  - category:", category);
    console.log("  - page:", page);
    console.log("  - limit:", limit);

    // 构建查询条件
    const query = buildAdvancedQuery({
      keyword,
      category,
      status,
      author,
      tags: tags ? tags.split(",") : undefined,
      viewRange,
      createDateRange: createDateRange ? createDateRange.split(",") : undefined,
      publishDateRange: publishDateRange
        ? publishDateRange.split(",")
        : undefined,
      features: features ? features.split(",") : undefined,
      contentTypes: contentTypes ? contentTypes.split(",") : undefined,
    });

    // 构建排序条件
    const sortOptions = buildSortOptions(sortBy);

    console.log("🔎 MongoDB查询条件:", JSON.stringify(query, null, 2));
    console.log("📊 排序条件:", sortOptions);

    const news = await News.find(query)
      .select(
        "title content summary thumbnail category status isTop isFeatured publishDate author createdBy viewCount",
      ) // 限制返回字段
      .populate("category", "name key")
      .populate("createdBy", "username name")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(); // 使用 lean() 提高性能

    const total = await News.countDocuments(query);

    console.log("📰 数据库查询结果:");
    console.log("  - 找到新闻数量:", news.length);
    console.log("  - 总数:", total);
    console.log(
      "  - 新闻分类分布:",
      news.map((item) => ({
        title: item.title.substring(0, 20) + "...",
        categoryId: item.category?._id,
        categoryKey: item.category?.key,
        categoryName: item.category?.name,
      })),
    );

    // 应用字段映射：后端 -> 前端
    const mappedNews = news.map((item) => mapBackendToFrontend(item));

    return response.paginated(
      res,
      mappedNews,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
      "获取新闻列表成功",
    );
  } catch (err) {
    console.error("获取新闻列表错误:", err);
    return response.serverError(res, "获取新闻列表失败", err);
  }
};

// 获取单个新闻详情
export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .select(
        "title content summary thumbnail category status isTop isFeatured publishDate author createdBy viewCount",
      ) // 限制返回字段
      .populate("category", "name key")
      .populate("createdBy", "username name")
      .lean(); // 使用 lean() 提高性能

    if (!news) {
      return response.notFound(res, "新闻不存在");
    }

    // 更新浏览量 - 使用 findByIdAndUpdate 而不是在 lean 对象上调用 save
    await News.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // 应用字段映射：后端 -> 前端
    const responseData = mapBackendToFrontend(news);

    return response.success(res, responseData, "获取新闻详情成功");
  } catch (err) {
    return response.serverError(res, "获取新闻详情失败", err);
  }
};

// 创建新闻
export const createNews = async (req, res) => {
  try {
    // 验证用户认证状态
    if (!req.user?._id && !req.user?.id) {
      return response.error(res, "用户认证失败", 401);
    }

    // 验证必填字段
    if (!req.body.title) {
      return response.error(res, "新闻标题不能为空", 400);
    }

    if (!req.body.content) {
      return response.error(res, "新闻内容不能为空", 400);
    }

    if (!req.body.category) {
      return response.error(res, "新闻分类不能为空", 400);
    }

    // 自动设置创建者信息 - 修复数据类型问题
    const userId = req.user._id || req.user.id;
    const newsData = {
      ...req.body,
      author: userId, // 使用 ObjectId 而不是字符串
      createdBy: userId,
    };

    console.log("创建新闻数据:", {
      ...newsData,
      content: newsData.content
        ? newsData.content.substring(0, 100) + "..."
        : "N/A",
    });
    console.log("用户信息:", {
      id: req.user?._id || req.user?.id,
      name: req.user?.name,
      username: req.user?.username,
    });

    const news = new News(newsData);
    const savedNews = await news.save();

    // 返回时填充关联数据
    const populatedNews = await News.findById(savedNews._id)
      .populate("category", "name key")
      .populate("author", "username name")
      .populate("createdBy", "username name");

    return response.success(res, populatedNews, "创建新闻成功", 201);
  } catch (err) {
    console.error("创建新闻错误:", err);
    console.error("错误详情:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    // 提供更具体的错误信息
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return response.error(res, `数据验证失败: ${errors.join(", ")}`, 400);
    }

    if (err.name === "CastError") {
      return response.error(res, `数据格式错误: ${err.message}`, 400);
    }

    return response.serverError(res, "创建新闻失败", err);
  }
};

// 更新新闻
export const updateNews = async (req, res) => {
  try {
    // 过滤掉不应该被更新的系统字段
    const updateData = { ...req.body };
    delete updateData.author;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData._id;
    delete updateData.__v;

    // 添加更新者信息
    updateData.updatedBy = req.user.id;

    const news = await News.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }
    return response.success(res, news, "更新新闻成功");
  } catch (error) {
    console.error("更新新闻失败:", error);
    return response.error(res, error.message || "更新新闻失败", 400);
  }
};

// 删除新闻
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }
    return response.success(res, null, "新闻删除成功");
  } catch (err) {
    return response.serverError(res, "删除新闻失败", err);
  }
};

// 批量删除新闻
export const batchDeleteNews = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, "请提供要删除的新闻ID列表", 400);
    }

    const result = await News.deleteMany({ _id: { $in: ids } });

    return response.success(
      res,
      { deletedCount: result.deletedCount },
      "批量删除成功",
    );
  } catch (err) {
    console.error("批量删除新闻错误:", err);
    return response.serverError(res, "批量删除新闻失败", err);
  }
};

// 批量更新新闻状态
export const batchUpdateNewsStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, "请提供要更新的新闻ID列表", 400);
    }

    if (!status) {
      return response.error(res, "请提供要更新的状态", 400);
    }

    const result = await News.updateMany(
      { _id: { $in: ids } },
      { status, updatedAt: new Date() },
    );

    return response.success(
      res,
      { modifiedCount: result.modifiedCount },
      "批量更新状态成功",
    );
  } catch (err) {
    console.error("批量更新新闻状态错误:", err);
    return response.serverError(res, "批量更新新闻状态失败", err);
  }
};

// 批量更新新闻分类
export const batchUpdateNewsCategory = async (req, res) => {
  try {
    const { ids, category } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, "请提供要更新的新闻ID列表", 400);
    }

    if (!category) {
      return response.error(res, "请提供要更新的分类", 400);
    }

    const result = await News.updateMany(
      { _id: { $in: ids } },
      { category, updatedAt: new Date() },
    );

    return response.success(
      res,
      { modifiedCount: result.modifiedCount },
      "批量更新分类成功",
    );
  } catch (err) {
    console.error("批量更新新闻分类错误:", err);
    return response.serverError(res, "批量更新新闻分类失败", err);
  }
};

// 批量添加标签
export const batchAddTags = async (req, res) => {
  try {
    const { ids, tags } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, "请提供要更新的新闻ID列表", 400);
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return response.error(res, "请提供要添加的标签", 400);
    }

    const result = await News.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { tags: { $each: tags } }, updatedAt: new Date() },
    );

    return response.success(
      res,
      { modifiedCount: result.modifiedCount },
      "批量添加标签成功",
    );
  } catch (err) {
    console.error("批量添加标签错误:", err);
    return response.serverError(res, "批量添加标签失败", err);
  }
};

// 切换置顶状态
export const toggleTop = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }

    news.isTop = !news.isTop;
    await news.save();

    return response.success(res, { isTop: news.isTop }, "切换置顶状态成功");
  } catch (err) {
    return response.serverError(res, "切换置顶状态失败", err);
  }
};

// 切换精选状态
export const toggleFeatured = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }

    news.isFeatured = !news.isFeatured;
    await news.save();

    return response.success(
      res,
      { isFeatured: news.isFeatured },
      "切换精选状态成功",
    );
  } catch (err) {
    return response.serverError(res, "切换精选状态失败", err);
  }
};

// 切换发布状态
export const togglePublish = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }

    news.status = news.status === "published" ? "draft" : "published";
    if (news.status === "published" && !news.publishDate) {
      news.publishDate = new Date();
    }

    await news.save();

    return response.success(res, { status: news.status }, "切换发布状态成功");
  } catch (err) {
    return response.serverError(res, "切换发布状态失败", err);
  }
};

// 获取新闻统计信息
export const getNewsStats = async (req, res) => {
  try {
    const stats = await News.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
          archived: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
          totalViews: { $sum: "$viewCount" },
          avgViews: { $avg: "$viewCount" },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
      totalViews: 0,
      avgViews: 0,
    };

    return response.success(res, result, "获取统计信息成功");
  } catch (err) {
    return response.serverError(res, "获取统计信息失败", err);
  }
};
