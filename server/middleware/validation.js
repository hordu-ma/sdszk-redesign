import Joi from "joi";
import response from "../utils/responseHelper.js";

/**
 * 创建验证中间件
 * @param {Object} schema - Joi验证模式对象
 * @returns {Function} Express中间件函数
 */
export const validate = (schema) => {
  return (req, res, next) => {
    // 如果schema有validate方法，说明是Joi schema对象，直接使用
    // 否则当作普通对象，用Joi.object包装
    const joiSchema =
      typeof schema.validate === "function" ? schema : Joi.object(schema);

    const { error } = joiSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      return response.validationError(res, errors, "请求数据格式错误");
    }

    next();
  };
};

/**
 * 查询参数验证中间件
 * @param {Object} schema - Joi验证模式对象
 * @returns {Function} Express中间件函数
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    // 如果schema有validate方法，说明是Joi schema对象，直接使用
    // 否则当作普通对象，用Joi.object包装
    const joiSchema =
      typeof schema.validate === "function" ? schema : Joi.object(schema);

    const { error } = joiSchema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      return response.validationError(res, errors, "查询参数格式错误");
    }

    next();
  };
};

/**
 * 路径参数验证中间件
 * @param {Object} schema - Joi验证模式对象
 * @returns {Function} Express中间件函数
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    console.log("validateParams - Original schema:", schema);
    console.log("validateParams - Schema type:", typeof schema);
    console.log(
      "validateParams - Schema has validate:",
      typeof schema.validate,
    );

    // 如果schema有validate方法，说明是Joi schema对象，直接使用
    // 否则当作普通对象，用Joi.object包装
    const joiSchema =
      typeof schema.validate === "function" ? schema : Joi.object(schema);

    console.log("validateParams - Final joiSchema:", joiSchema);
    console.log(
      "validateParams - joiSchema has validate:",
      typeof joiSchema.validate,
    );

    const { error } = joiSchema.validate(req.params, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      return response.validationError(res, errors, "路径参数格式错误");
    }

    next();
  };
};

// 常用验证模式
export const schemas = {
  // ObjectId验证
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "请提供有效的ID",
    }),

  // 分页验证
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),
  }),

  // 新闻验证
  news: {
    create: Joi.object({
      title: Joi.string().required().trim().max(200).messages({
        "string.empty": "标题不能为空",
        "string.max": "标题长度不超过200字符",
      }),
      content: Joi.string().required().messages({
        "string.empty": "内容不能为空",
      }),
      summary: Joi.string().allow("").max(500).messages({
        "string.max": "摘要长度不超过500字符",
      }),
      thumbnail: Joi.string().allow("").uri().messages({
        "string.uri": "缩略图必须是有效的URL",
      }),
      category: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": "请选择有效的分类",
          "any.required": "分类不能为空",
        }),
      tags: Joi.array().items(Joi.string().trim()).default([]),
      importance: Joi.number().integer().min(0).max(5).default(0),
      isPublished: Joi.boolean().default(false),
      publishDate: Joi.date().default(Date.now),
      expiryDate: Joi.date().allow(null),
      source: Joi.object({
        name: Joi.string().allow("").trim(),
        url: Joi.string().allow("").uri(),
      }).default({}),
      seo: Joi.object({
        metaTitle: Joi.string().allow("").max(70),
        metaDescription: Joi.string().allow("").max(160),
        keywords: Joi.array().items(Joi.string().trim()).default([]),
      }).default({}),
    }),

    update: Joi.object({
      title: Joi.string().trim().max(200),
      content: Joi.string(),
      summary: Joi.string().allow("").max(500),
      thumbnail: Joi.string().allow("").uri(),
      category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
      tags: Joi.array().items(Joi.string().trim()),
      importance: Joi.number().integer().min(0).max(5),
      isPublished: Joi.boolean(),
      publishDate: Joi.date(),
      expiryDate: Joi.date().allow(null),
      source: Joi.object({
        name: Joi.string().allow("").trim(),
        url: Joi.string().allow("").uri(),
      }),
      seo: Joi.object({
        metaTitle: Joi.string().allow("").max(70),
        metaDescription: Joi.string().allow("").max(160),
        keywords: Joi.array().items(Joi.string().trim()),
      }),
    }),
  },

  // 用户验证
  user: {
    login: Joi.object({
      username: Joi.string().required().trim().messages({
        "string.empty": "用户名不能为空",
      }),
      password: Joi.string().required().min(6).messages({
        "string.empty": "密码不能为空",
        "string.min": "密码长度至少6位",
      }),
    }),

    register: Joi.object({
      username: Joi.string().required().trim().min(3).max(20).messages({
        "string.empty": "用户名不能为空",
        "string.min": "用户名长度至少3位",
        "string.max": "用户名长度不超过20位",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "请提供有效的邮箱地址",
        "any.required": "邮箱不能为空",
      }),
      password: Joi.string().required().min(6).max(50).messages({
        "string.empty": "密码不能为空",
        "string.min": "密码长度至少6位",
        "string.max": "密码长度不超过50位",
      }),
      fullName: Joi.string().required().trim().max(50).messages({
        "string.empty": "姓名不能为空",
        "string.max": "姓名长度不超过50字符",
      }),
      phone: Joi.string()
        .pattern(/^1[3-9]\d{9}$/)
        .messages({
          "string.pattern.base": "请提供有效的手机号码",
        }),
    }),
  },
};

export default {
  validate,
  validateQuery,
  validateParams,
  schemas,
};
