// test-db-connection.js - MongoDB连接测试脚本
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY = 1000; // 1秒

const connectDB = async (isReconnect = false) => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk-test",
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    if (isReconnect) {
      console.log(`✅ MongoDB重连成功 (第${reconnectAttempts}次尝试)`);
      reconnectAttempts = 0; // 重置重连计数器
    } else {
      console.log("✅ MongoDB初始连接成功");
    }

    return conn;
  } catch (err) {
    if (isReconnect) {
      reconnectAttempts++;
      console.error(`❌ MongoDB重连失败 (第${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}次):`, err.message);

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`💀 已达到最大重连次数(${MAX_RECONNECT_ATTEMPTS})，停止重连`);
        return;
      }

      // 指数退避策略：1s, 2s, 4s, 8s, 16s, 32s, 最大60s
      const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts - 1), 60000);
      console.log(`⏰ ${delay / 1000}秒后进行第${reconnectAttempts + 1}次重连尝试...`);

      setTimeout(() => connectDB(true), delay);
    } else {
      console.error("❌ MongoDB初始连接失败:", err.message);
      throw err; // 初始连接失败时抛出错误
    }
  }
};

// 监听MongoDB连接事件
mongoose.connection.on("disconnected", () => {
  if (reconnectAttempts === 0) {
    console.log("⚠️ MongoDB连接断开，开始重连...");
    connectDB(true);
  }
});

// 监听连接错误事件
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB连接错误:", err.message);
});

// 测试连接
console.log("🚀 开始测试MongoDB连接重试机制...");
console.log("💡 提示：可以在连接成功后断开MongoDB服务来测试重连机制");

connectDB()
  .then(() => {
    console.log("📊 连接测试完成，监听连接状态变化...");
    console.log("👆 按 Ctrl+C 退出测试");
  })
  .catch((err) => {
    console.error("💥 连接测试失败:", err.message);
    process.exit(1);
  });

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n📝 测试结束，关闭数据库连接...');
  await mongoose.connection.close();
  console.log('✅ 连接已关闭');
  process.exit(0);
});
