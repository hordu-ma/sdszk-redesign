// authController-debug.js - 带调试信息的认证控制器
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 生成JWT令牌
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// 创建并发送令牌
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // 设置cookie选项
  const cookieOptions = {
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 1天
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // 发送cookie
  res.cookie("jwt", token, cookieOptions);

  // 移除密码
  user.password = undefined;

  // 发送响应
  res.status(statusCode).json({
    status: "success",
    message: "登录成功",
    token,
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
      },
    },
  });
};

// 登录（带调试信息）
export const loginDebug = async (req, res, next) => {
  try {
    console.log("=== 登录调试开始 ===");
    console.log("请求体:", req.body);

    const { username, password } = req.body;

    // 1) 检查用户名和密码是否存在
    console.log("步骤1: 检查用户名和密码");
    console.log("username:", username);
    console.log("password length:", password ? password.length : 0);

    if (!username || !password) {
      console.log("❌ 用户名或密码为空");
      return res.status(400).json({
        status: "error",
        message: "请提供用户名和密码",
      });
    }
    console.log("✅ 用户名和密码都存在");

    // 2) 检查用户是否存在及密码是否正确
    console.log("步骤2: 查找用户");
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      console.log("❌ 用户不存在");
      return res.status(401).json({
        status: "error",
        message: "用户名或密码错误",
      });
    }

    console.log("✅ 用户存在");
    console.log("用户信息:", {
      id: user._id,
      username: user.username,
      role: user.role,
      active: user.active,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
    });

    console.log("步骤3: 验证密码");
    const passwordMatch = await user.correctPassword(password, user.password);
    console.log("密码匹配结果:", passwordMatch);

    if (!passwordMatch) {
      console.log("❌ 密码不匹配");
      return res.status(401).json({
        status: "error",
        message: "用户名或密码错误",
      });
    }
    console.log("✅ 密码匹配");

    // 3) 检查用户是否激活
    console.log("步骤4: 检查用户激活状态");
    console.log("用户激活状态:", user.active);

    if (!user.active) {
      console.log("❌ 用户未激活");
      return res.status(401).json({
        status: "error",
        message: "该账户已被禁用",
      });
    }
    console.log("✅ 用户已激活");

    // 4) 如果一切正常，发送令牌给客户端
    console.log("步骤5: 生成token并发送响应");
    console.log("✅ 登录成功，准备发送token");
    createSendToken(user, 200, res);

    console.log("=== 登录调试结束 ===");
  } catch (error) {
    console.error("❌ 登录过程中发生错误:", error);
    next(error);
  }
};

// 登录
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1) 检查用户名和密码是否存在
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "请提供用户名和密码",
      });
    }

    // 2) 检查用户是否存在及密码是否正确
    const user = await User.findOne({ username }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "error",
        message: "用户名或密码错误",
      });
    }

    // 3) 检查用户是否激活
    if (!user.active) {
      return res.status(401).json({
        status: "error",
        message: "该账户已被禁用",
      });
    }

    // 4) 如果一切正常，发送令牌给客户端
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
