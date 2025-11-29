import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import {
  getHelmetConfig,
  nonceMiddleware,
  cspViolationHandler,
} from "./config/security.js";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
// 引入Redis客户端
import { initRedis, closeRedis } from "./config/redis.js";
// 引入Swagger
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// 引入结构化日志
import {
  dbLogger,
  sysLogger,
  logSystemStart,
  logSystemShutdown,
  logError,
} from "./utils/logger.js";
import {
  requestLogger,
  errorRequestLogger,
  slowRequestLogger,
  securityLogger,
} from "./middleware/loggerMiddleware.js";
// 引入 CORS 配置
import { getCorsConfig, validateCorsConfig } from "./config/cors.js";
// 使用自定义的频率限制中间件
import "./middleware/rateLimit.js";
// 路由导入
import newsRoutes from "./routes/news.js";
import newsCategoryRoutes from "./routes/newsCategories.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import adminUserRoutes from "./routes/adminUsers.js";
import uploadRoutes from "./routes/upload.js";
import resourceRoutes from "./routes/resources.js";
import resourceCategoryRoutes from "./routes/resourceCategories.js";
import activityRoutes from "./routes/activities.js";
import activityRegistrationRoutes from "./routes/activityRegistrationRoutes.js";
import settingRoutes from "./routes/settings.js";
import activityLogRoutes from "./routes/activityLogs.js";
import dashboardRoutes from "./routes/dashboard.js";
import favoriteRoutes from "./routes/favorites.js";
import viewHistoryRoutes from "./routes/viewHistory.js";
import adminNewsRoutes from "./routes/adminNews.js";
import rolesRoutes from "./routes/roles.js";
import permissionsRoutes from "./routes/permissions.js";
import adminResourceRoutes from "./routes/adminResources.js";
import healthRoutes from "./routes/health.js";

// 错误处理中间件
import errorMiddleware from "./middleware/errorMiddleware.js";

// 加载环境变量
dotenv.config();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 配置 trust proxy，用于正确处理代理请求
app.set("trust proxy", true);

// 引入自定义频率限制中间件
import { applyRateLimits } from "./middleware/rateLimit.js";

// 记录应用启动日志
sysLogger.info("Application starting up...");

// 中间件配置
applyRateLimits(app); // 应用自定义频率限制
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
// 验证并应用 CORS 配置
if (validateCorsConfig()) {
  app.use(cors(getCorsConfig()));
} else {
  sysLogger.error("CORS 配置验证失败，应用无法启动");
  process.exit(1);
}
// 处理所有OPTIONS预检请求，确保返回CORS头
app.options("*", cors());

// CSP nonce中间件 - 为每个请求生成唯一的nonce
app.use(nonceMiddleware);

// 配置Helmet安全头，使用环境相关的CSP策略
const environment = process.env.NODE_ENV || "development";
app.use(helmet(getHelmetConfig(environment)));

// CSP违规报告端点
app.post(
  "/csp-violation-report",
  express.json({ type: "application/csp-report" }),
  cspViolationHandler,
);
app.use(morgan("dev"));

// 日志中间件配置
app.use(requestLogger); // 记录所有HTTP请求
app.use(slowRequestLogger(1000)); // 记录超过1秒的慢请求
app.use(securityLogger); // 记录安全敏感操作

// 静态文件服务
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use(`/${uploadDir}`, express.static(path.join(__dirname, uploadDir)));

// Swagger配置
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "山东省大中小学思政课一体化指导中心API",
      version: "1.0.0",
      description: "山东省大中小学思政课一体化指导中心后端API文档",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "开发服务器",
      },
    ],
  },
  // 指定包含JSDoc注释的文件路径
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// MongoDB连接配置
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY = 1000; // 1秒

const connectDB = async (isReconnect = false) => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk",
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    );

    if (isReconnect) {
      dbLogger.info(
        {
          reconnectAttempt: reconnectAttempts,
          type: "reconnect",
        },
        `MongoDB重连成功 (第${reconnectAttempts}次尝试)`,
      );
      reconnectAttempts = 0; // 重置重连计数器
    } else {
      dbLogger.info({ type: "initial" }, "MongoDB初始连接成功");
    }

    return conn;
  } catch (err) {
    if (isReconnect) {
      reconnectAttempts++;
      dbLogger.error(
        {
          reconnectAttempt: reconnectAttempts,
          maxAttempts: MAX_RECONNECT_ATTEMPTS,
          error: err.message,
        },
        `MongoDB重连失败 (第${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}次)`,
      );

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        dbLogger.fatal(
          {
            maxAttempts: MAX_RECONNECT_ATTEMPTS,
          },
          `已达到最大重连次数，停止重连`,
        );
        return;
      }

      // 指数退避策略：1s, 2s, 4s, 8s, 16s, 32s, 最大60s
      const delay = Math.min(
        INITIAL_RETRY_DELAY * 2 ** (reconnectAttempts - 1),
        60000,
      );
      dbLogger.info(
        {
          delay: delay,
          nextAttempt: reconnectAttempts + 1,
        },
        `${delay / 1000}秒后进行第${reconnectAttempts + 1}次重连尝试`,
      );

      setTimeout(() => connectDB(true), delay);
    } else {
      logError(err, { context: "mongodb-initial-connection" });
      throw err; // 初始连接失败时抛出错误
    }
  }
};

// 监听MongoDB连接事件
mongoose.connection.on("disconnected", () => {
  if (reconnectAttempts === 0) {
    dbLogger.warn("MongoDB连接断开，开始重连...");
    connectDB(true);
  }
});

// 监听连接错误事件
mongoose.connection.on("error", (err) => {
  logError(err, { context: "mongodb-connection" });
});

// 初始化数据库和Redis连接
Promise.all([connectDB(), initRedis()])
  .then(() => {
    sysLogger.info("数据库和Redis已成功初始化");
  })
  .catch((err) => {
    logError(err, { context: "application-initialization" });
    process.exit(1);
  });

// API 路由
app.get("/", (req, res) => {
  res.json({ message: "山东省大中小学思政课一体化指导中心API服务" });
});

// 健康检查路由（应该在频率限制之前）
app.use("/api", healthRoutes);

// API 路由
app.use("/api/news", newsRoutes);
app.use("/api/news-categories", newsCategoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // 用户自服务路由
app.use("/api/admin/users", adminUserRoutes); // 管理员用户管理路由
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin/resources", adminResourceRoutes); // 使用专门的管理员资源路由
app.use("/api/resource-categories", resourceCategoryRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/registrations", activityRegistrationRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/logs", activityLogRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/view-history", viewHistoryRoutes);
app.use("/api/admin/news", adminNewsRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/admin/roles", rolesRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/admin/permissions", permissionsRoutes);

// 修复错误格式的路由
app.get("/admin/news/page=:page&limit=:limit", (req, res) => {
  // 将请求重定向到正确格式的URL
  res.redirect(
    `/admin/news/list?page=${req.params.page}&limit=${req.params.limit}`,
  );
});

// 处理管理员新闻路由格式错误的情况
app.get("/admin/news", (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  // 重定向到正确的API端点
  res.redirect(`/api/admin/news?page=${page}&limit=${limit}`);
});

// 处理未找到的路由
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `无法找到 ${req.originalUrl} 路由`,
  });
});

// 应用错误处理中间件
app.use(errorRequestLogger);
app.use(errorMiddleware);

// 启动服务器
const PORT = process.env.PORT || 3000;

// 启动服务器 - 区分单元测试和E2E测试环境
// 单元测试时不启动服务器，但CI E2E测试时需要启动
const shouldStartServer =
  process.env.NODE_ENV !== "test" || process.env.CI_E2E_TEST === "true";

if (shouldStartServer) {
  const server = app.listen(PORT, () => {
    logSystemStart({
      port: PORT,
      apiDocs: `http://localhost:${PORT}/api-docs`,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    });
    sysLogger.info({ port: PORT }, `服务运行在 http://localhost:${PORT}`);
    sysLogger.info(
      { url: `http://localhost:${PORT}/api-docs` },
      "API文档已启用",
    );
  });

  // 优雅地关闭应用程序
  const gracefulShutdown = async (signal) => {
    sysLogger.info({ signal }, `接收到 ${signal} 信号，开始优雅关闭...`);

    server.close(async () => {
      sysLogger.info("HTTP服务器已关闭");

      try {
        // 关闭数据库连接
        await mongoose.connection.close();
        dbLogger.info("MongoDB连接已关闭");

        // 关闭Redis连接
        await closeRedis();
        sysLogger.info("Redis连接已关闭");

        logSystemShutdown(signal);
        process.exit(0);
      } catch (err) {
        logError(err, { context: "graceful-shutdown" });
        process.exit(1);
      }
    });
  };

  // 监听关闭信号
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

export default app;
