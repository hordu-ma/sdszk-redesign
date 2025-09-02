// adminResourceController.js - 管理员资源控制器
import Resource from "../models/Resource.js";
import ResourceCategory from "../models/ResourceCategory.js";
import response from "../utils/responseHelper.js";
import mongoose from "mongoose";

// 获取管理员资源列表（带分类信息填充和状态转换）
export const getAdminResourceList = async (req, res) => {
  try {
    const {
      category,
      page = 1,
      limit = 10,
      keyword,
      status,
      type,
      dateRange,
    } = req.query;

    let query = {};

    // 处理分类筛选
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await ResourceCategory.findOne({ key: category });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return response.paginated(
            res,
            [],
            {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
            },
            "获取资源列表成功",
          );
        }
      }
    }

    // 处理关键词搜索
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
        { author: { $regex: keyword, $options: "i" } },
      ];
    }

    // 处理状态筛选
    if (status) {
      switch (status) {
        case "published":
          query.isPublished = true;
          break;
        case "draft":
          query.isPublished = false;
          break;
        case "archived":
          // 可以根据需要添加归档状态逻辑
          query.isPublished = false;
          break;
      }
    }

    // 处理资源类型筛选
    if (type) {
      query.resourceType = type;
    }

    // 处理日期范围筛选
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      query.createdAt = {
        $gte: new Date(dateRange[0]),
        $lte: new Date(dateRange[1]),
      };
    }

    // 执行查询，填充分类信息
    const resources = await Resource.find(query)
      .populate("category", "name key color description") // 填充分类信息
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(query);

    // 转换数据格式，适配前端需求
    const transformedResources = resources.map((resource) => {
      const resourceObj = resource.toObject();

      return {
        ...resourceObj,
        id: resourceObj._id.toString(), // 添加id字段
        status: resourceObj.isPublished ? "published" : "draft", // 转换状态字段
        description: resourceObj.content, // 前端期望description字段
        categoryId: resourceObj.category?._id?.toString(), // 添加categoryId
        categoryName: resourceObj.category?.name, // 添加分类名称
        isFeatured: resourceObj.featured, // 统一字段名
        fileType: resourceObj.mimeType, // 统一字段名
        thumbnail: resourceObj.thumbnail, // 添加缩略图字段
      };
    });

    return response.paginated(
      res,
      transformedResources,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
      "获取资源列表成功",
    );
  } catch (err) {
    console.error("获取管理员资源列表失败:", err);
    return response.serverError(res, "获取资源列表失败", err);
  }
};

// 获取管理员资源详情
export const getAdminResourceDetail = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      "category",
      "name key color description",
    );

    if (!resource) {
      return response.notFound(res, "资源不存在");
    }

    const resourceObj = resource.toObject();
    const transformedResource = {
      ...resourceObj,
      id: resourceObj._id.toString(),
      status: resourceObj.isPublished ? "published" : "draft",
      description: resourceObj.content,
      categoryId: resourceObj.category?._id?.toString(),
      categoryName: resourceObj.category?.name,
      isFeatured: resourceObj.featured,
      fileType: resourceObj.mimeType,
      thumbnail: resourceObj.thumbnail,
    };

    return response.success(res, transformedResource, "获取资源详情成功");
  } catch (err) {
    console.error("获取管理员资源详情失败:", err);
    return response.serverError(res, "获取资源详情失败", err);
  }
};

// 更新资源状态
export const updateAdminResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = {};
    switch (status) {
      case "published":
        updateData.isPublished = true;
        break;
      case "draft":
      case "archived":
        updateData.isPublished = false;
        break;
      default:
        return response.badRequest(res, "无效的状态值");
    }

    const resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category", "name key color description");

    if (!resource) {
      return response.notFound(res, "资源不存在");
    }

    const resourceObj = resource.toObject();
    const transformedResource = {
      ...resourceObj,
      id: resourceObj._id.toString(),
      status: resourceObj.isPublished ? "published" : "draft",
      description: resourceObj.content,
      categoryId: resourceObj.category?._id?.toString(),
      categoryName: resourceObj.category?.name,
      isFeatured: resourceObj.featured,
      fileType: resourceObj.mimeType,
      thumbnail: resourceObj.thumbnail,
    };

    return response.success(res, transformedResource, "状态更新成功");
  } catch (err) {
    console.error("更新资源状态失败:", err);
    return response.serverError(res, "状态更新失败", err);
  }
};

// 批量更新资源状态
export const batchUpdateAdminResourceStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest(res, "请选择要更新的资源");
    }

    const updateData = {};
    switch (status) {
      case "published":
        updateData.isPublished = true;
        break;
      case "draft":
      case "archived":
        updateData.isPublished = false;
        break;
      default:
        return response.badRequest(res, "无效的状态值");
    }

    await Resource.updateMany({ _id: { $in: ids } }, updateData);

    return response.success(res, null, `成功更新 ${ids.length} 个资源的状态`);
  } catch (err) {
    console.error("批量更新资源状态失败:", err);
    return response.serverError(res, "批量更新状态失败", err);
  }
};

// 批量删除资源
export const batchDeleteAdminResources = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest(res, "请选择要删除的资源");
    }

    await Resource.deleteMany({ _id: { $in: ids } });

    return response.success(res, null, `成功删除 ${ids.length} 个资源`);
  } catch (err) {
    console.error("批量删除资源失败:", err);
    return response.serverError(res, "批量删除失败", err);
  }
};

// 创建新资源
export const createAdminResource = async (req, res) => {
  try {
    const {
      title,
      description,
      summary,
      categoryId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      thumbnail,
      type,
      publishDate,
      accessLevel,
      allowDownload,
      allowComment,
      sortOrder,
      tags,
      status,
      isTop,
      isFeatured,
      downloadPermission,
    } = req.body;

    // 验证必需字段
    if (!title || !description || !categoryId || !fileUrl) {
      return response.badRequest(res, "标题、描述、分类和文件URL为必填项");
    }

    // 验证分类是否存在
    const category = await ResourceCategory.findById(categoryId);
    if (!category) {
      return response.badRequest(res, "指定的分类不存在");
    }

    // 创建资源数据
    const resourceData = {
      title,
      content: description, // 映射到content字段
      summary,
      category: categoryId,
      fileUrl,
      fileName,
      fileSize: parseInt(fileSize) || 0,
      mimeType: fileType,
      thumbnail,
      type,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      accessLevel: accessLevel || "public",
      allowDownload: allowDownload !== false,
      allowComment: allowComment !== false,
      sortOrder: parseInt(sortOrder) || 0,
      tags: Array.isArray(tags) ? tags : [],
      isPublished: status === "published",
      isTop: isTop === true,
      featured: isFeatured === true,
      downloadPermission: downloadPermission || "public",
      author: req.user?.name || "Unknown",
      createdBy: req.user?.id,
      viewCount: 0,
      downloadCount: 0,
    };

    // 创建并保存资源
    const resource = new Resource(resourceData);
    await resource.save();

    // 填充分类信息后返回
    await resource.populate("category", "name key color description");

    const resourceObj = resource.toObject();
    const transformedResource = {
      ...resourceObj,
      id: resourceObj._id.toString(),
      status: resourceObj.isPublished ? "published" : "draft",
      description: resourceObj.content,
      categoryId: resourceObj.category?._id?.toString(),
      categoryName: resourceObj.category?.name,
      isFeatured: resourceObj.featured,
      fileType: resourceObj.mimeType,
      thumbnail: resourceObj.thumbnail,
    };

    return response.success(res, transformedResource, "资源创建成功", 201);
  } catch (err) {
    console.error("创建资源失败: ", err);
    return response.serverError(res, "创建资源失败", err);
  }
};

// 更新资源
export const updateAdminResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      summary,
      categoryId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      thumbnail,
      type,
      publishDate,
      accessLevel,
      allowDownload,
      allowComment,
      sortOrder,
      tags,
      status,
      isTop,
      isFeatured,
      downloadPermission,
    } = req.body;

    // 查找资源
    const resource = await Resource.findById(id);
    if (!resource) {
      return response.notFound(res, "资源不存在");
    }

    // 如果更改了分类，验证新分类是否存在
    if (categoryId && categoryId !== resource.category?.toString()) {
      const category = await ResourceCategory.findById(categoryId);
      if (!category) {
        return response.badRequest(res, "指定的分类不存在");
      }
    }

    // 更新资源数据
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.content = description;
    if (summary !== undefined) updateData.summary = summary;
    if (categoryId !== undefined) updateData.category = categoryId;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = parseInt(fileSize) || 0;
    if (fileType !== undefined) updateData.mimeType = fileType;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (type !== undefined) updateData.type = type;
    if (publishDate !== undefined)
      updateData.publishDate = new Date(publishDate);
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;
    if (allowDownload !== undefined) updateData.allowDownload = allowDownload;
    if (allowComment !== undefined) updateData.allowComment = allowComment;
    if (sortOrder !== undefined)
      updateData.sortOrder = parseInt(sortOrder) || 0;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) updateData.isPublished = status === "published";
    if (isTop !== undefined) updateData.isTop = isTop;
    if (isFeatured !== undefined) updateData.featured = isFeatured;
    if (downloadPermission !== undefined)
      updateData.downloadPermission = downloadPermission;

    // 更新修改时间和修改者
    updateData.updatedAt = new Date();
    if (req.user?.id) {
      updateData.updatedBy = req.user.id;
    }

    // 执行更新
    const updatedResource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category", "name key color description");

    const resourceObj = updatedResource.toObject();
    const transformedResource = {
      ...resourceObj,
      id: resourceObj._id.toString(),
      status: resourceObj.isPublished ? "published" : "draft",
      description: resourceObj.content,
      categoryId: resourceObj.category?._id?.toString(),
      categoryName: resourceObj.category?.name,
      isFeatured: resourceObj.featured,
      fileType: resourceObj.mimeType,
      thumbnail: resourceObj.thumbnail,
    };

    return response.success(res, transformedResource, "资源更新成功");
  } catch (err) {
    console.error("更新资源失败:", err);
    return response.serverError(res, "更新资源失败", err);
  }
};
