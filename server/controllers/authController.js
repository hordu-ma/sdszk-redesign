// authController.js - 认证控制器
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/appError.js";
import { authLogger, logAuthEvent, logError } from "../utils/logger.js";
import verificationService from "../services/verificationService.js";

// 生成JWT令牌
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// 创建并发送令牌
export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // 设置cookie选项
  const cookieOptions = {
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000, // 1天
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
    authLogger.debug(
      {
        requestBody: {
          username: req.body.username,
          hasPassword: !!req.body.password,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          MONGODB_URI: process.env.MONGODB_URI ? "已设置" : "未设置",
          JWT_SECRET: process.env.JWT_SECRET ? "已设置" : "未设置",
        },
      },
      "登录流程开始",
    );

    const { username, password } = req.body;

    // 1) 检查用户名和密码是否存在
    authLogger.debug(
      {
        username,
        passwordLength: password ? password.length : 0,
      },
      "步骤1: 检查用户名和密码",
    );

    if (!username || !password) {
      logAuthEvent("login_failed", {
        reason: "missing_credentials",
        username: username || "undefined",
        ip: req.ip,
      });
      return next(new BadRequestError("请提供用户名和密码"));
    }
    authLogger.debug("用户名和密码验证通过");

    // 2) 检查用户是否存在及密码是否正确
    authLogger.debug({ username }, "步骤2: 查找用户");
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      logAuthEvent("login_failed", {
        reason: "user_not_found",
        username,
        ip: req.ip,
      });
      return next(new UnauthorizedError("用户名或密码错误"));
    }

    authLogger.debug(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        active: user.active,
        hasPassword: !!user.password,
      },
      "用户存在，验证用户信息",
    );

    authLogger.debug("步骤3: 验证密码");
    try {
      const passwordMatch = await user.correctPassword(password, user.password);
      authLogger.debug({ passwordMatch }, "密码匹配结果");

      if (!passwordMatch) {
        logAuthEvent("login_failed", {
          reason: "invalid_password",
          username,
          userId: user._id,
          ip: req.ip,
        });
        return next(new UnauthorizedError("用户名或密码错误"));
      }
      authLogger.debug("密码验证通过");
    } catch (pwdError) {
      logError(pwdError, {
        context: "password_verification",
        username,
        userId: user._id,
      });
      return next(new UnauthorizedError("用户名或密码错误"));
    }

    // 3) 检查用户是否激活
    authLogger.debug({ active: user.active }, "步骤4: 检查用户激活状态");

    if (!user.active) {
      logAuthEvent("login_failed", {
        reason: "account_disabled",
        username,
        userId: user._id,
        ip: req.ip,
      });
      return next(new UnauthorizedError("该账户已被禁用"));
    }
    authLogger.debug("用户激活状态验证通过");

    // 4) 如果一切正常，发送令牌给客户端
    authLogger.debug("步骤5: 生成token并发送响应");

    // 记录登录历史
    await user.recordLogin(true, req.ip, req.get("User-Agent"));

    logAuthEvent("login_success", {
      username,
      userId: user._id,
      role: user.role,
      ip: req.ip,
    });

    createSendToken(user, 200, res);
    authLogger.info({ username, userId: user._id }, "登录成功");
  } catch (error) {
    logError(error, {
      context: "login_process",
      username: req.body.username,
      ip: req.ip,
    });
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
        return next(new BadRequestError("用户名已被使用"));
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return next(new BadRequestError("邮箱已被使用"));
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
      return next(new BadRequestError("请提供当前密码和新密码"));
    }

    if (newPassword.length < 6) {
      return next(new BadRequestError("新密码长度不能少于6位"));
    }

    // 获取用户信息（包含密码）
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new NotFoundError("用户不存在"));
    }

    // 验证当前密码
    const isCurrentPasswordCorrect = await user.correctPassword(
      oldPassword,
      user.password,
    );
    if (!isCurrentPasswordCorrect) {
      return next(new BadRequestError("当前密码错误"));
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
      return next(new UnauthorizedError("您未登录，请先登录"));
    }

    // 2) 验证token
    // 验证JWT令牌
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET environment variable is required for security",
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError("此token的用户已不存在"));
    }

    // 4) 检查用户是否已经激活
    if (!currentUser.active) {
      return next(new UnauthorizedError("该账户已被禁用"));
    }

    // 5) 将用户信息添加到请求对象中
    req.user = currentUser;
    next();
  } catch {
    return next(new UnauthorizedError("Token无效或已过期"));
  }
};

// 用户注册
export const register = async (req, res, next) => {
  try {
    const { username, email, phone, password, fullName, verificationCode } = req.body;

    authLogger.debug(
      {
        username,
        email,
        phone: phone
          ? phone.substring(0, 3) + "****" + phone.substring(7)
          : undefined,
        fullName,
        hasPassword: !!password,
        hasVerificationCode: !!verificationCode,
      },
      "用户注册开始",
    );

    // 验证必填字段
    if (!username || !password || !email || !phone) {
      return next(new BadRequestError("用户名、密码、邮箱和手机号为必填项"));
    }

    // 验证密码长度
    if (password.length < 6) {
      return next(new BadRequestError("密码长度不能少于6位"));
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new BadRequestError("邮箱格式不正确"));
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return next(new BadRequestError("手机号格式不正确"));
    }

    // 验证码校验
    if (!verificationCode) {
      return next(new BadRequestError("请输入验证码"));
    }

    if (verificationCode.length !== 6) {
      return next(new BadRequestError("验证码格式不正确"));
    }

    // 验证手机验证码
    const isCodeValid = verificationService.verifyCode(phone, verificationCode);
    if (!isCodeValid) {
      return next(new BadRequestError("验证码不正确或已过期"));
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(new BadRequestError("用户名已被使用"));
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return next(new BadRequestError("邮箱已被使用"));
    }

    // 检查手机号是否已存在
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return next(new BadRequestError("手机号已被使用"));
    }

    // 创建用户
    const newUser = await User.create({
      username,
      email,
      phone,
      password, // 密码会在pre-save钩子中自动加密
      name: fullName || username, // 使用fullName或fallback到username
      role: "user",
      status: "active",
      active: true,
    });

    authLogger.info(
      {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      "新用户注册成功",
    );

    // 记录注册事件
    logAuthEvent("register_success", {
      username: newUser.username,
      userId: newUser._id,
      email: newUser.email,
      ip: req.ip,
    });

    // 生成token并发送响应
    createSendToken(newUser, 201, res);
  } catch (error) {
    logError(error, {
      context: "user_registration",
      username: req.body.username,
      email: req.body.email,
      ip: req.ip,
    });

    logAuthEvent("register_failed", {
      reason: error.message,
      username: req.body.username,
      email: req.body.email,
      ip: req.ip,
    });

    next(error);
  }
};

// 发送手机验证码
export const sendVerificationCode = async (req, res, next) => {
  try {
    const { phone } = req.body;

    authLogger.debug(
      {
        phone: phone
          ? phone.substring(0, 3) + "****" + phone.substring(7)
          : undefined,
      },
      "发送验证码请求",
    );

    // 验证必填字段
    if (!phone) {
      return next(new BadRequestError("请提供手机号"));
    }

    // 使用验证码服务发送验证码
    const result = await verificationService.sendVerificationCode(phone);

    if (!result.success) {
      // 如果是频率限制错误，返回特定状态码
      if (result.waitTime) {
        return res.status(429).json({
          status: "error",
          message: result.message,
          code: "TOO_MANY_REQUESTS",
          waitTime: result.waitTime,
        });
      }
      return next(new BadRequestError(result.message));
    }

    const responseData = {
      status: "success",
      message: "验证码已发送，请注意查收短信",
    };

    // 开发环境返回验证码便于测试
    if (process.env.NODE_ENV === "development" && result.code) {
      responseData.code = result.code;
    }

    res.status(200).json(responseData);

    authLogger.info(
      {
        phone: phone.substring(0, 3) + "****" + phone.substring(7),
      },
      "验证码发送响应成功",
    );
  } catch (error) {
    logError(error, {
      context: "send_verification_code",
      phone: req.body.phone
        ? req.body.phone.substring(0, 3) + "****" + req.body.phone.substring(7)
        : undefined,
      ip: req.ip,
    });

    next(error);
  }
};

// 刷新当前用户权限
export const refreshPermissions = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return next(new UnauthorizedError("用户未登录"));
    }

    // 重新从数据库获取用户信息（包括最新权限）
    const user = await User.findById(currentUser._id).select("+permissions");

    if (!user) {
      return next(new NotFoundError("用户不存在"));
    }

    // 返回更新后的用户信息
    res.status(200).json({
      status: "success",
      message: "权限已刷新",
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

    authLogger.info(
      { userId: user._id, username: user.username },
      "用户权限已刷新",
    );
  } catch (error) {
    logError(error, { context: "refreshPermissions" });
    next(error);
  }
};

// 基于角色的访问控制中间件
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("您没有权限执行此操作", 403));
    }
    next();
  };
};
