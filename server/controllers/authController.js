// authController.js - 认证控制器
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 生成JWT令牌
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 创建并发送令牌
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // 设置cookie选项
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_EXPIRES_IN.replace("d", "")) *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
  };

  // 如果是生产环境，则使用安全cookie
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // 发送cookie
  res.cookie("jwt", token, cookieOptions);

  // 移除密码和其他敏感信息
  user.password = undefined;

  // 发送响应
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// 用户登录
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1) 检查用户名和密码是否存在
    if (!username || !password) {
      return res.status(400).json({
        status: "fail",
        message: "请提供用户名和密码",
      });
    }

    // 2) 检查用户是否存在和密码是否正确
    const user = await User.findOne({ username }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "用户名或密码不正确",
      });
    }

    // 3) 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 4) 如果一切正常，发送令牌到客户端
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// 保护路由中间件
export const protect = async (req, res, next) => {
  try {
    // 1) 获取令牌并检查是否存在
    let token;
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
        status: "fail",
        message: "您未登录，请登录后访问",
      });
    }

    // 2) 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "此令牌的用户已不存在",
      });
    }

    // 4) 将用户添加到请求对象中
    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "fail",
        message: "无效的令牌，请重新登录",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "fail",
        message: "令牌已过期，请重新登录",
      });
    }
    return res.status(401).json({
      status: "fail",
      message: "认证失败，请重新登录",
    });
  }
};

// 角色限制中间件
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "您没有权限执行此操作",
      });
    }
    next();
  };
};

// 注册新用户 (仅限管理员)
export const register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      avatar: req.body.avatar,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
