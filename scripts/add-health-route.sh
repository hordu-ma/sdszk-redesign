#!/bin/bash

# 添加健康检查路由和修复路由问题

SERVER_IP="60.205.124.67"
SSH_KEY="~/.ssh/id_rsa_aliyun"

echo "🔧 添加健康检查路由和修复API问题..."
echo "================================"

# 1. 创建健康检查路由文件
echo "1️⃣ 创建健康检查路由..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
cd /var/www/sdszk-backend

# 创建健康检查路由文件
cat > routes/health.js << 'HEALTHJS'
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// 健康检查端点
router.get('/', async (req, res) => {
  try {
    // 检查数据库连接
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'sdszk-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      database: {
        status: dbStatus[dbState] || 'unknown',
        connected: dbState === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };

    // 如果数据库未连接，返回警告状态
    if (dbState !== 1) {
      healthCheck.status = 'warning';
      healthCheck.message = '数据库连接异常';
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'sdszk-backend',
      error: error.message
    });
  }
});

// 简单的状态检查
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

export default router;
HEALTHJS

echo "✅ 健康检查路由文件已创建"
EOF

# 2. 修改 app.js 添加健康检查路由
echo -e "\n2️⃣ 修改 app.js 添加健康检查路由..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
cd /var/www/sdszk-backend

# 备份原始 app.js
cp app.js app.js.backup

# 创建修正后的 app.js
cat > app.js << 'APPJS'
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// 加载环境变量
dotenv.config();

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

// 中间件导入
import { applyRateLimits } from "./middleware/rateLimit.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 应用频率限制中间件
applyRateLimits(app);
console.log('API请求频率限制中间件已应用');

// 基础中间件
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS 配置
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://horsduroot.com',
    'https://horsduroot.com',
    'http://www.horsduroot.com',
    'https://www.horsduroot.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie', 'Set-Cookie']
};

app.use(cors(corsOptions));

// 日志中间件
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB连接成功');
})
.catch((error) => {
  console.error('MongoDB连接失败:', error);
});

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'SDSZK Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use("/api/health", healthRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/news-categories", newsCategoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin/resources", adminResourceRoutes);
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

// 处理未找到的路由
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `无法找到 ${req.originalUrl} 路由`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/news',
      'GET /api/news-categories',
      'GET /api/resources',
      'POST /api/auth/login'
    ]
  });
});

// 错误处理中间件
app.use(errorMiddleware);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
APPJS

echo "✅ app.js 已更新"
EOF

# 3. 重启后端服务
echo -e "\n3️⃣ 重启后端服务..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
cd /var/www/sdszk-backend

echo "重启 PM2 服务..."
pm2 restart sdszk-backend

echo "等待服务启动..."
sleep 5

echo "检查服务状态："
pm2 status

echo -e "\n检查端口监听："
netstat -tlnp | grep :3000
EOF

# 4. 测试健康检查和 API 接口
echo -e "\n4️⃣ 测试 API 接口..."
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
echo "=== API 接口测试 ==="

echo "1. 健康检查："
curl -s http://localhost:3000/api/health | head -10

echo -e "\n2. 状态检查："
curl -s http://localhost:3000/api/health/status

echo -e "\n3. 新闻分类接口："
curl -s http://localhost:3000/api/news-categories/core | head -5

echo -e "\n4. 资源接口："
curl -s "http://localhost:3000/api/resources?category=theory&limit=5" | head -5

echo -e "\n5. 通过 Nginx 代理测试："
curl -s http://localhost/api/health | head -5

echo -e "\n6. 外部访问测试："
curl -s https://horsduroot.com/api/health | head -5
EOF

echo -e "\n✅ 健康检查路由添加完成！"
echo "现在可以测试以下端点："
echo "- https://horsduroot.com/api/health"
echo "- https://horsduroot.com/api/health/status"
echo "- https://horsduroot.com/api/news-categories/core"
