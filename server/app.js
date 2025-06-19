import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
// 使用自定义的频率限制中间件
import "./middleware/rateLimit.js";
// 路由导入
import newsRoutes from "./routes/news.js";
import newsCategoryRoutes from "./routes/newsCategories.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import resourceRoutes from "./routes/resources.js";
import resourceCategoryRoutes from "./routes/resourceCategories.js";
import activityRoutes from "./routes/activities.js";
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

// 引入自定义频率限制中间件
import { applyRateLimits } from "./middleware/rateLimit.js";

// 中间件配置
applyRateLimits(app); // 应用自定义频率限制
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5180",
        "http://localhost:5182",
        "http://localhost:5179",
        "http://localhost:5178",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://hordu-ma.github.io", // GitHub Pages域名
        process.env.FRONTEND_URL,
        undefined, // 允许无origin的请求（如curl、本地测试）
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
    ],
    exposedHeaders: ["set-cookie", "Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600,
  })
);
// 处理所有OPTIONS预检请求，确保返回CORS头
app.options("*", cors());
app.use(
  helmet({
    contentSecurityPolicy: false, // 在开发中禁用CSP，生产环境应启用
  })
);
app.use(morgan("dev"));

// 静态文件服务
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use(`/${uploadDir}`, express.static(path.join(__dirname, uploadDir)));

// MongoDB连接配置
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk",
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );
    console.log("MongoDB连接成功");
    return conn;
  } catch (err) {
    console.error("MongoDB连接失败:", err);
    // 5秒后重试连接
    setTimeout(connectDB, 5000);
  }
};

// 监听MongoDB连接事件
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB连接断开，尝试重新连接...");
  connectDB();
});

// 初始化数据库连接
connectDB();

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
app.use("/api/users", userRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin/resources", adminResourceRoutes); // 使用专门的管理员资源路由
app.use("/api/resource-categories", resourceCategoryRoutes);
app.use("/api/activities", activityRoutes);
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
    `/admin/news/list?page=${req.params.page}&limit=${req.params.limit}`
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

// 错误处理中间件
app.use(errorMiddleware);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
