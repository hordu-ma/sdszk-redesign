// debug-login.js - 调试登录问题
import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

async function debugLogin() {
  try {
    // 连接数据库
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("数据库连接成功");

    // 查找admin用户
    const user = await User.findOne({ username: "admin" }).select("+password");

    if (!user) {
      console.log("❌ 未找到admin用户");
      return;
    }

    console.log("✅ 找到admin用户:");
    console.log({
      id: user._id,
      username: user.username,
      role: user.role,
      active: user.active,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // 测试密码验证
    const testPassword = "admin123";
    console.log(`\n测试密码 "${testPassword}":`);

    // 方法1: 使用 correctPassword
    try {
      const result1 = await user.correctPassword(testPassword, user.password);
      console.log(`correctPassword 方法结果: ${result1}`);
    } catch (err) {
      console.log(`correctPassword 方法错误: ${err.message}`);
    }

    // 方法2: 使用 comparePassword
    try {
      const result2 = await user.comparePassword(testPassword);
      console.log(`comparePassword 方法结果: ${result2}`);
    } catch (err) {
      console.log(`comparePassword 方法错误: ${err.message}`);
    }

    // 方法3: 直接使用 bcrypt.compare
    try {
      const result3 = await bcrypt.compare(testPassword, user.password);
      console.log(`直接 bcrypt.compare 结果: ${result3}`);
    } catch (err) {
      console.log(`直接 bcrypt.compare 错误: ${err.message}`);
    }

    // 检查密码格式
    console.log("\n密码分析:");
    console.log(`密码前缀: ${user.password.substring(0, 10)}...`);
    console.log(
      `是否为bcrypt格式: ${user.password.startsWith("$2a$") || user.password.startsWith("$2b$")}`
    );
  } catch (error) {
    console.error("调试过程中出错:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n数据库连接已关闭");
  }
}

debugLogin();
