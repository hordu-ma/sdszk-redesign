// 检查用户数据脚本
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("MongoDB连接成功");

    // 查找admin用户
    const adminUser = await User.findOne({ username: "admin" }).select(
      "+password"
    );
    console.log("Admin用户信息:");
    if (adminUser) {
      console.log("- 用户名:", adminUser.username);
      console.log("- 角色:", adminUser.role);
      console.log("- 激活状态:", adminUser.active);
      console.log("- 密码哈希:", adminUser.password?.substring(0, 20) + "...");
      console.log("- 创建时间:", adminUser.createdAt);
    } else {
      console.log("未找到admin用户");
    }

    // 查看所有用户
    const allUsers = await User.find({});
    console.log("\n所有用户列表:");
    allUsers.forEach((user) => {
      console.log(`- ${user.username} (${user.role}) - 激活:${user.active}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("错误:", error);
    process.exit(1);
  }
}

checkUsers();
