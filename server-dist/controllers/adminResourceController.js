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
            "获取资源列表成功"
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
      "获取资源列表成功"
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
      "name key color description"
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
