// resourceController.js - 资源控制器
import Resource from "../models/Resource.js";
import ActivityLog from "../models/ActivityLog.js";
import ResourceCategory from "../models/ResourceCategory.js";
import response from "../utils/responseHelper.js";
import mongoose from "mongoose";
import { AppError, BadRequestError, UnauthorizedError, NotFoundError } from "../utils/appError.js";

// 字段映射函数：前端字段名 -> 后端字段名
const mapFrontendToBackend = (data) => {
  const mapped = { ...data };

  // 字段名映射
  if (mapped.description !== undefined) {
    mapped.content = mapped.description;
    delete mapped.description;
  }

  if (mapped.categoryId !== undefined) {
    mapped.category = mapped.categoryId;
    delete mapped.categoryId;
  }

  if (mapped.isFeatured !== undefined) {
    mapped.featured = mapped.isFeatured;
    delete mapped.isFeatured;
  }

  if (mapped.fileType !== undefined) {
    mapped.mimeType = mapped.fileType;
    delete mapped.fileType;
  }



  // status 到 isPublished 的转换
  if (mapped.status !== undefined) {
    mapped.isPublished = mapped.status === "published";
    delete mapped.status;
  }

  return mapped;
};

// 字段映射函数：后端字段名 -> 前端字段名
const mapBackendToFrontend = (data) => {
  if (!data) return data;

  // 使用 toObject() 并转为 JSON 来避免 ObjectId 序列化问题
  let mapped;
  try {
    if (data.toObject) {
      mapped = JSON.parse(JSON.stringify(data.toObject()));
    } else {
      mapped = JSON.parse(JSON.stringify(data));
    }
  } catch (error) {
    console.error("序列化错误:", error);
    // 如果序列化失败，返回简化的对象
    mapped = {};
    for (const key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] !== "function") {
        try {
          mapped[key] = JSON.parse(JSON.stringify(data[key]));
        } catch (e) {
          mapped[key] = data[key]?.toString() || data[key];
        }
      }
    }
  }

  // 首先处理_id到id的转换
  if (mapped._id !== undefined) {
    mapped.id = mapped._id.toString();
    // 删除_id字段以避免冗余
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

  // 字段名映射
  if (mapped.content !== undefined) {
    mapped.description = mapped.content;
    delete mapped.content;
  }

  if (mapped.category !== undefined) {
    // 如果category是对象（已populate），保留对象信息并添加categoryId
    if (typeof mapped.category === "object" && mapped.category !== null) {
      mapped.category = processNestedObject(mapped.category);
      mapped.categoryId = mapped.category.id || mapped.category._id;
      // 保留category对象以供前端显示
    } else {
      // 如果category是字符串ID，转换为categoryId
      mapped.categoryId = mapped.category;
      delete mapped.category;
    }
  }

  // 处理其他可能包含_id的嵌套对象
  if (mapped.createdBy) {
    mapped.createdBy = processNestedObject(mapped.createdBy);
  }

  if (mapped.updatedBy) {
    mapped.updatedBy = processNestedObject(mapped.updatedBy);
  }

  if (mapped.featured !== undefined) {
    mapped.isFeatured = mapped.featured;
    delete mapped.featured;
  }

  if (mapped.mimeType !== undefined) {
    mapped.fileType = mapped.mimeType;
    delete mapped.mimeType;
  }



  // isPublished 到 status 的转换
  if (mapped.isPublished !== undefined) {
    mapped.status = mapped.isPublished ? "published" : "draft";
    delete mapped.isPublished;
  }

  return mapped;
};

// 获取资源列表
export const getResourceList = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let query = {};

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        // 如果是有效的ObjectId，直接使用
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        // 如果不是ObjectId，尝试通过key查找分类
        const categoryDoc = await ResourceCategory.findOne({ key: category });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // 如果找不到分类，返回空结果而不是错误
          return response.paginated(
            res,
            [],
            {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
            },
            "获取资源列表成功"
          );
        }
      }
    }

    const resources = await Resource.find(query)
      .select("title description thumbnail category isPublished featured isTop viewCount createdAt fileUrl fileName fileSize mimeType") // 限制返回字段
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(); // 使用 lean() 提高性能

    const total = await Resource.countDocuments(query);

    // 应用字段映射：后端 -> 前端
    const mappedResources = resources.map((resource) =>
      mapBackendToFrontend(resource)
    );

    return response.paginated(
      res,
      mappedResources,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
      "获取资源列表成功"
    );
  } catch (err) {
    return response.serverError(res, "获取资源列表失败", err);
  }
};

// 获取单个资源详情
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return response.notFound(res, "资源不存在");
    }
    // 更新浏览量
    resource.viewCount += 1;
    await resource.save();

    // 应用字段映射：后端 -> 前端
    const responseData = mapBackendToFrontend(resource);

    return response.success(res, responseData, "获取资源详情成功");
  } catch (err) {
    return response.serverError(res, "获取资源详情失败", err);
  }
};

// 创建资源
export const createResource = async (req, res, next) => {
  try {
    // 字段映射：前端 -> 后端
    const mappedData = mapFrontendToBackend(req.body);

    // 设置创建者和作者信息
    mappedData.createdBy = req.user._id;
    mappedData.author = req.user.name || req.user.username; // 使用用户名作为作者

    const resource = new Resource(mappedData);
    const savedResource = await resource.save();

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "create",
      entityType: "resource",
      entityId: savedResource._id,
      entityName: savedResource.title,
      details: {
        title: savedResource.title,
        category: savedResource.category,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 返回映射后的数据
    const responseData = mapBackendToFrontend(savedResource);

    res.status(201).json({
      status: "success",
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

// 更新资源
export const updateResource = async (req, res, next) => {
  try {
    // 字段映射：前端 -> 后端
    const mappedData = mapFrontendToBackend(req.body);

    // 设置更新者
    mappedData.updatedBy = req.user._id;

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      mappedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "update",
      entityType: "resource",
      entityId: resource._id,
      entityName: resource.title,
      details: {
        title: resource.title,
        category: resource.category,
        fields: Object.keys(req.body),
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 返回映射后的数据
    const responseData = mapBackendToFrontend(resource);

    res.json({
      status: "success",
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

// 删除资源
export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "delete",
      entityType: "resource",
      entityId: resource._id,
      entityName: resource.title,
      details: {
        title: resource.title,
        category: resource.category,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await resource.deleteOne();

    res.json({
      status: "success",
      message: "资源已删除",
    });
  } catch (err) {
    next(err);
  }
};

// 发布/取消发布资源
export const togglePublishStatus = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    resource.isPublished = !resource.isPublished;
    resource.updatedBy = req.user._id;
    await resource.save();

    // 记录活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: resource.isPublished ? "unpublish" : "publish",
      entityType: "resource",
      entityId: resource._id,
      entityName: resource.title,
      details: {
        title: resource.title,
        isPublished: !resource.isPublished,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      status: "success",
      data: mapBackendToFrontend(resource),
      message: resource.isPublished ? "资源已发布" : "资源已取消发布",
    });
  } catch (err) {
    next(err);
  }
};

// 设置/取消设置为精选资源
// 置顶/取消置顶资源
export const toggleFeaturedStatus = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    resource.featured = !resource.featured;
    resource.updatedBy = req.user._id;
    await resource.save();

    res.json({
      status: "success",
      data: mapBackendToFrontend(resource),
      message: resource.featured ? "已设为精选资源" : "已取消精选资源",
    });
  } catch (err) {
    next(err);
  }
};

// 置顶/取消置顶资源
export const toggleTopStatus = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    resource.isTop = !resource.isTop;
    resource.updatedBy = req.user._id;
    await resource.save();

    res.json({
      status: "success",
      data: mapBackendToFrontend(resource),
      message: resource.isTop ? "已设为置顶资源" : "已取消置顶资源",
    });
  } catch (err) {
    next(err);
  }
};

// 获取相关资源
export const getRelatedResources = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    // 基于类别和标签查找相关资源
    const relatedResources = await Resource.find({
      _id: { $ne: resource._id },
      isPublished: true,
      $or: [{ category: resource.category }, { tags: { $in: resource.tags } }],
    })
      .limit(4)
      .select("title thumbnail category tags viewCount");

    res.json({
      status: "success",
      results: relatedResources.length,
      data: relatedResources,
    });
  } catch (err) {
    next(err);
  }
};

// 获取每个类别的最新资源
export const getLatestByCategory = async (req, res, next) => {
  try {
    const categories = ["theory", "teaching", "video"];
    const limit = parseInt(req.query.limit) || 3;

    const result = {};

    for (const category of categories) {
      const resources = await Resource.find({
        category,
        isPublished: true,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("title thumbnail summary viewCount createdAt");

      result[category] = resources;
    }

    res.json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// 增加资源下载次数
export const incrementDownloadCount = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    resource.downloadCount += 1;
    await resource.save({ validateBeforeSave: false });

    res.json({
      status: "success",
      data: {
        downloadCount: resource.downloadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 获取资源统计信息
export const getResourceStats = async (req, res, next) => {
  try {
    const stats = {
      totalCount: await Resource.countDocuments(),
      categoryCount: {},
      featuredCount: await Resource.countDocuments({ featured: true }),
    };

    // 按类别统计
    const categoryStats = await Resource.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    categoryStats.forEach((stat) => {
      stats.categoryCount[stat._id] = stat.count;
    });

    res.json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

// 批量删除资源
export const batchDeleteResources = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new BadRequestError("请提供要删除的资源ID列表"));
    }

    // 查找要删除的资源
    const resources = await Resource.find({ _id: { $in: ids } });

    if (resources.length === 0) {
      return next(new NotFoundError("未找到指定的资源"));
    }

    // 执行删除操作
    await Resource.deleteMany({ _id: { $in: ids } });

    // 记录批量删除活动
    await ActivityLog.logActivity({
      user: req.user._id,
      action: "delete",
      entityType: "resource",
      entityName: `批量删除${resources.length}个资源`,
      details: {
        count: resources.length,
        resourceTitles: resources.map((r) => r.title),
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      status: "success",
      message: `成功删除 ${resources.length} 个资源`,
    });
  } catch (err) {
    next(err);
  }
};

// 批量更新资源
export const batchUpdateResources = async (req, res, next) => {
  try {
    const { ids, status, ...otherData } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new BadRequestError("请提供要更新的资源ID列表"));
    }

    // 更新前查找资源
    const resources = await Resource.find({ _id: { $in: ids } });

    if (resources.length === 0) {
      return next(new NotFoundError("未找到指定的资源"));
    }

    // 准备更新数据
    const updateData = { ...otherData };

    // 如果有status字段，转换为isPublished
    if (status !== undefined) {
      if (!["draft", "published", "archived"].includes(status)) {
        return next(new BadRequestError("无效的状态值"));
      }
      updateData.isPublished = status === "published";
    }

    // 设置更新者和更新时间
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

    // 执行批量更新
    await Resource.updateMany({ _id: { $in: ids } }, { $set: updateData });

    // 记录批量更新活动
    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      entityType: "resource",
      entityName: `批量更新${resources.length}个资源`,
      details: {
        count: resources.length,
        resourceTitles: resources.map((r) => r.title),
        updatedFields: Object.keys(updateData),
        status: status,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      status: "success",
      message: `成功更新 ${resources.length} 个资源`,
    });
  } catch (err) {
    next(err);
  }
};

// 更新资源状态
export const updateResourceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    if (!["draft", "published", "archived"].includes(status)) {
      return next(new BadRequestError("无效的状态值"));
    }

    // 查找资源
    const resource = await Resource.findById(id);
    if (!resource) {
      return next(new NotFoundError("资源不存在"));
    }

    // 更新状态 - 将status转换为isPublished
    const isPublished = status === "published";
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      {
        isPublished,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("category", "name slug");

    // 记录活动日志
    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      entityType: "resource",
      entityId: id,
      entityName: resource.title,
      details: {
        title: resource.title,
        oldStatus: resource.isPublished ? "published" : "draft",
        newStatus: status,
      },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 转换响应数据
    const responseData = {
      ...updatedResource.toObject(),
      status: updatedResource.isPublished ? "published" : "draft",
    };

    res.json({
      status: "success",
      data: responseData,
      message: "状态更新成功",
    });
  } catch (err) {
    next(err);
  }
};
