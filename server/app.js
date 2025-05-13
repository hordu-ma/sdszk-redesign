import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import session from "express-session";
import MongoStore from "connect-mongo";
import { v4 as uuidv4 } from "uuid";

// 路由导入
import newsRoutes from "./routes/news.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import resourceRoutes from "./routes/resources.js";
import activityRoutes from "./routes/activities.js";
import settingRoutes from "./routes/settings.js";
import activityLogRoutes from "./routes/activityLogs.js";
import dashboardRoutes from "./routes/dashboard.js";

// 加载环境变量
dotenv.config();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 配置速率限制
const limiter = rateLimit({
  max: 100, // 每IP每小时最多100个请求
  windowMs: 60 * 60 * 1000, // 1小时
  message: "从此IP发送了太多请求，请一小时后再试",
});

// Session 配置
app.use(
  session({
    genid: function () {
      return uuidv4(); // 使用UUID生成会话ID
    },
    secret: process.env.SESSION_SECRET || "sdszk-secret",
    resave: false, // 避免在每次请求时都重新保存会话
    saveUninitialized: false, // 只在会话被修改后保存
    rolling: true, // 在每个响应上重设cookie过期时间
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // 1 day
      touchAfter: 1 * 60, // 减少更新会话的时间间隔 (1分钟)
    }),
    cookie: {
      secure: false, // 开发环境禁用secure
      httpOnly: true,
      sameSite: "lax", // 开发环境使用lax
      maxAge: 30 * 60 * 1000, // 减少到30分钟，足够完成登录过程
      path: "/",
    },
    name: "sdszk.sid", // 自定义cookie名称
  })
);

// 中间件配置
app.use("/api", limiter); // 应用速率限制到所有API路由
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // 允许来自多个前端开发端口的请求
      const allowedOrigins = [
        "http://localhost:5180",
        "http://localhost:5182",
        "http://localhost:5179",
        "http://localhost:5178",
        "http://localhost:5173", // Vite默认端口
        "http://localhost:5174",
        "http://localhost:5175",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // 记录请求来源
      console.log("收到跨域请求:", { origin });

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("不允许的跨域访问:", origin);
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
    maxAge: 3600, // 预检请求的缓存时间（秒）
  })
);
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

// 路由配置
app.get("/", (req, res) => {
  res.json({ message: "山东省大中小学思政课一体化指导中心API服务" });
});

// API 路由
app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/logs", activityLogRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 处理未找到的路由
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `无法找到 ${req.originalUrl} 路由`,
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status: status,
    message: err.message || "服务器内部错误",
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
