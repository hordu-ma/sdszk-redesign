// appError.js - 应用错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = "无效的请求") {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "未授权的访问") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "禁止访问") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "资源未找到") {
    super(message, 404);
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
