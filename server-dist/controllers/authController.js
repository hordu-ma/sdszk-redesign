// authController.js - 认证控制器
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

// 登录
export const login = async (req, res, next) => {
  try {
    console.log("=== 登录调试开始 ===");
    console.log("请求体:", req.body);
    console.log("环境变量检查:", {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? "已设置" : "未设置",
      JWT_SECRET: process.env.JWT_SECRET ? "已设置" : "未设置",
    });

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
      passwordPrefix: user.password ? user.password.substring(0, 10) : "",
    });

    console.log("步骤3: 验证密码");
    try {
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
    } catch (pwdError) {
      console.error("密码验证过程出错:", pwdError);
      return res.status(401).json({
        status: "error",
        message: "用户名或密码错误",
      });
    }

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

// 退出登录
export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// 获取当前用户信息
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 更新个人资料
export const updateProfile = async (req, res, next) => {
  try {
    const { username, name, email, phone, avatar } = req.body;
    const userId = req.user.id;

    // 检查用户名是否已被其他用户使用
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "用户名已被使用",
        });
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "邮箱已被使用",
        });
      }
    }

    // 更新用户信息
    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "个人资料更新成功",
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 修改密码
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 验证输入
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "请提供当前密码和新密码",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "新密码长度不能少于6位",
      });
    }

    // 获取用户信息（包含密码）
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "用户不存在",
      });
    }

    // 验证当前密码
    const isCurrentPasswordCorrect = await user.correctPassword(
      oldPassword,
      user.password
    );
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        status: "error",
        message: "当前密码错误",
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "密码修改成功",
    });
  } catch (error) {
    next(error);
  }
};

// 保护路由的中间件
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1) 从请求头或cookie中获取token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "您未登录，请先登录",
      });
    }

    // 2) 验证token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // 3) 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "此token的用户已不存在",
      });
    }

    // 4) 检查用户是否已经激活
    if (!currentUser.active) {
      return res.status(401).json({
        status: "error",
        message: "该账户已被禁用",
      });
    }

    // 5) 将用户信息添加到请求对象中
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Token无效或已过期",
    });
  }
};

// 基于角色的访问控制中间件
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "您没有权限执行此操作",
      });
    }
    next();
  };
};
