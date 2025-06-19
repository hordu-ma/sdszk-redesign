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

// 获取新闻列表
export const getNewsList = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let query = {};
    if (category) {
      query.category = mongoose.Types.ObjectId.isValid(category)
        ? new mongoose.Types.ObjectId(category)
        : category;
    }

    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await News.countDocuments(query);

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
      "获取新闻列表成功"
    );
  } catch (err) {
    return response.serverError(res, "获取新闻列表失败", err);
  }
};

// 获取单个新闻详情
export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }
    // 更新浏览量
    news.viewCount += 1;
    await news.save();

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
    // 自动设置创建者信息
    const newsData = {
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
      author:
        req.body.author || req.user?.name || req.user?.username || "管理员",
    };

    console.log("创建新闻数据:", newsData);
    console.log("用户信息:", {
      id: req.user?._id,
      name: req.user?.name,
      username: req.user?.username,
    });

    const news = new News(newsData);
    const savedNews = await news.save();
    return response.success(res, savedNews, "创建新闻成功", 201);
  } catch (err) {
    console.error("创建新闻错误:", err);
    return response.serverError(res, "创建新闻失败", err);
  }
};

// 更新新闻
export const updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!news) {
      return response.notFound(res, "新闻不存在");
    }
    return response.success(res, news, "更新新闻成功");
  } catch (err) {
    return response.error(res, "更新新闻失败", 400);
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
