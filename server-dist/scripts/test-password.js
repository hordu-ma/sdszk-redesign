// 测试密码验证脚本
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function testPasswordVerification() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("MongoDB连接成功");

    // 查找admin用户
    const adminUser = await User.findOne({ username: "admin" }).select(
      "+password"
    );

    if (!adminUser) {
      console.log("未找到admin用户");
      process.exit(1);
    }

    console.log("用户信息:");
    console.log("- 用户名:", adminUser.username);
    console.log("- 激活状态:", adminUser.active);

    // 测试密码验证
    const testPasswords = ["admin123", "Admin123", "admin", "123456"];

    for (const testPassword of testPasswords) {
      try {
        const isValid = await adminUser.correctPassword(
          testPassword,
          adminUser.password
        );
        console.log(`密码 "${testPassword}": ${isValid ? "✓ 正确" : "✗ 错误"}`);
      } catch (error) {
        console.log(`密码 "${testPassword}": 验证出错 -`, error.message);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("错误:", error);
    process.exit(1);
  }
}

testPasswordVerification();
