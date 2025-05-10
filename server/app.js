import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();

// 中间件配置
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// MongoDB连接配置
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB连接成功');
    return conn;
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    // 5秒后重试连接
    setTimeout(connectDB, 5000);
  }
};

// 监听MongoDB连接事件
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB连接断开，尝试重新连接...');
  connectDB();
});

// 初始化数据库连接
connectDB();

// 路由配置
app.get('/', (req, res) => {
  res.json({ message: '山东省大中小学思政课一体化指导中心API服务' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});