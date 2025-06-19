// 重置admin密码脚本
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("MongoDB连接成功");

    // 查找admin用户
    let adminUser = await User.findOne({ username: "admin" });

    if (!adminUser) {
      console.log("admin用户不存在，创建新的admin用户...");
      adminUser = new User({
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "系统管理员",
        active: true,
      });
    } else {
      console.log("重置现有admin用户密码...");
      adminUser.password = "admin123";
      adminUser.active = true;
    }

    await adminUser.save();
    console.log("admin用户密码已重置为: admin123");

    // 验证密码
    const savedUser = await User.findOne({ username: "admin" }).select(
      "+password"
    );
    const isValid = await savedUser.correctPassword(
      "admin123",
      savedUser.password
    );
    console.log("密码验证结果:", isValid ? "✓ 成功" : "✗ 失败");

    process.exit(0);
  } catch (error) {
    console.error("错误:", error);
    process.exit(1);
  }
}

resetAdminPassword();
