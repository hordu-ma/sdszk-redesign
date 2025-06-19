// server-debug.js - 服务器调试脚本
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());

// 调试路由
app.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? '已设置' : '未设置',
    JWT_SECRET: process.env.JWT_SECRET ? '已设置' : '未设置',
    PORT: process.env.PORT || '未设置'
  });
});

app.get('/debug/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateNames = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      connectionState: stateNames[dbState],
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/debug/admin', async (req, res) => {
  try {
    const user = await User.findOne({ username: 'admin' }).select('+password');
    
    if (!user) {
      return res.json({ error: 'Admin用户不存在' });
    }

    res.json({
      found: true,
      id: user._id,
      username: user.username,
      role: user.role,
      active: user.active,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordPrefix: user.password ? user.password.substring(0, 10) : '',
      isBcryptFormat: user.password ? (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) : false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/debug/test-password', async (req, res) => {
  try {
    const { password = 'admin123' } = req.body;
    const user = await User.findOne({ username: 'admin' }).select('+password');
    
    if (!user) {
      return res.json({ error: 'Admin用户不存在' });
    }

    const result1 = await user.correctPassword(password, user.password);
    const result2 = await user.comparePassword(password);
    const result3 = await bcrypt.compare(password, user.password);

    res.json({
      testPassword: password,
      correctPassword: result1,
      comparePassword: result2,
      bcryptCompare: result3,
      allMatch: result1 && result2 && result3
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.DEBUG_PORT || 3001;

app.listen(PORT, () => {
  console.log(`调试服务器运行在端口 ${PORT}`);
});
