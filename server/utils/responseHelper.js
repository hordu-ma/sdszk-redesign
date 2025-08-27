/**
 * 统一API响应格式工具
 * 提供标准化的响应格式，确保前后端接口一致性
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - HTTP状态码
 */
export const success = (
  res,
  data = null,
  message = "操作成功",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {*} errors - 详细错误信息
 */
export const error = (
  res,
  message = "操作失败",
  statusCode = 400,
  errors = null,
) => {
  const response = {
    success: false,
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} data - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 响应消息
 */
export const paginated = (res, data, pagination, message = "获取成功") => {
  return res.status(200).json({
    success: true,
    status: "success",
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const unauthorized = (res, message = "未授权访问") => {
  return error(res, message, 401);
};

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const forbidden = (res, message = "权限不足") => {
  return error(res, message, 403);
};

/**
 * 资源未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
export const notFound = (res, message = "资源未找到") => {
  return error(res, message, 404);
};

/**
 * 服务器内部错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {Error} err - 错误对象
 */
export const serverError = (res, message = "服务器内部错误", err = null) => {
  const response = {
    success: false,
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  };

  // 在开发环境下显示详细错误信息
  if (process.env.NODE_ENV === "development" && err) {
    response.stack = err.stack;
    response.details = err.message;
  }

  return res.status(500).json(response);
};

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {Array|Object} validationErrors - 验证错误信息
 * @param {string} message - 错误消息
 */
export const validationError = (
  res,
  validationErrors,
  message = "数据验证失败",
) => {
  return error(res, message, 422, validationErrors);
};

export default {
  success,
  error,
  paginated,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  validationError,
};
