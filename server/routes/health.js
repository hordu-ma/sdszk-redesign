import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// 基础健康检查路由 - 用于CI环境快速验证服务启动
router.get("/health/basic", (req, res) => {
  try {
    const uptime = process.uptime();

    res.status(200).json({
      status: "ok",
      message: "Service is running",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Basic health check error:", error);
    res.status(503).json({
      status: "error",
      message: "Basic health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// 就绪状态检查路由 - 检查所有依赖服务
router.get("/health/ready", async (req, res) => {
  try {
    // 检查数据库连接
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const isReady = dbStatus === 1;
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStates[dbStatus],
          connected: dbStatus === 1,
        },
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Ready check error:", error);
    res.status(503).json({
      status: "error",
      message: "Ready check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// 完整健康检查路由 - 包含详细的系统信息
router.get("/health", async (req, res) => {
  try {
    // 检查数据库连接
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    // 检查内存使用情况
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: dbStates[dbStatus],
        connected: dbStatus === 1,
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
      },
      environment: process.env.NODE_ENV || "development",
    };

    // 如果数据库未连接，返回503状态
    if (dbStatus !== 1) {
      return res.status(503).json({
        ...healthData,
        status: "error",
        message: "Database not connected",
      });
    }

    res.status(200).json(healthData);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// API状态总览
router.get("/status", async (req, res) => {
  try {
    const stats = await mongoose.connection.db.admin().serverStatus();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      api: {
        name: "SDSZK API",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
      },
      database: {
        host: stats.host,
        version: stats.version,
        uptime: stats.uptime,
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      status: "error",
      message: "Status check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
