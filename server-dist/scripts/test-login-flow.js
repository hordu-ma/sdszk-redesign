// test-login-flow.js - 测试完整登录流程
import mongoose from "mongoose";
import User from "../models/User.js";

async function testLoginFlow() {
  try {
    // 连接数据库
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk"
    );
    console.log("数据库连接成功");

    const username = "admin";
    const password = "admin123";

    console.log(`\n测试登录流程 - 用户名: ${username}, 密码: ${password}`);

    // 1) 检查用户名和密码是否存在
    if (!username || !password) {
      console.log("❌ 用户名或密码为空");
      return;
    }
    console.log("✅ 用户名和密码都存在");

    // 2) 检查用户是否存在及密码是否正确
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      console.log("❌ 用户不存在");
      return;
    }
    console.log("✅ 用户存在");

    const passwordMatch = await user.correctPassword(password, user.password);
    if (!passwordMatch) {
      console.log("❌ 密码不匹配");
      return;
    }
    console.log("✅ 密码匹配");

    // 3) 检查用户是否激活
    if (!user.active) {
      console.log("❌ 用户未激活");
      return;
    }
    console.log("✅ 用户已激活");

    console.log("\n🎉 登录流程验证成功！所有步骤都通过了。");

    // 显示用户信息
    console.log("\n用户信息:");
    console.log({
      id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      permissions: user.permissions,
    });
  } catch (error) {
    console.error("❌ 登录流程测试失败:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n数据库连接已关闭");
  }
}

testLoginFlow();
