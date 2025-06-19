import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// 健康检查路由
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
