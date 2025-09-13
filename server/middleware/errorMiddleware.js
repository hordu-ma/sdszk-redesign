// errorMiddleware.js - 全局错误处理中间件
import { AppError } from "../utils/appError.js";

const handleCastErrorDB = (err) => {
  const message = `无效的 ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `重复的字段值: ${value}. 请使用其他值！`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `无效的输入数据. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError("无效的令牌，请重新登录", 401);

const handleJWTExpiredError = () => new AppError("令牌已过期，请重新登录", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: {
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational,
      name: err.name,
      code: err.code,
    },
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl,
    method: res.req?.method,
  });
};

const sendErrorProd = (err, res) => {
  // 记录所有错误到控制台，便于调试
  console.error("错误详情:", {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    timestamp: new Date().toISOString(),
  });

  // 操作性错误：发送给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error: {
        statusCode: err.statusCode,
        status: err.status,
        isOperational: err.isOperational,
      },
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
  // 编程错误：不发送详细信息给客户端，但要记录
  else {
    console.error("严重错误 💥", err);
    res.status(500).json({
      status: "error",
      error: {
        statusCode: 500,
        status: "error",
        isOperational: false,
      },
      message: "服务器内部错误，请稍后重试",
      timestamp: new Date().toISOString(),
    });
  }
};

// eslint-disable-next-line no-unused-vars
export default (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
