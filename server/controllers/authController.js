// authController.js - 认证控制器
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import svgCaptcha from "svg-captcha";

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

// 生成验证码
export const generateCaptcha = async (req, res) => {
  try {
    // 检查会话是否正常
    if (!req.session) {
      throw new Error("Session not initialized");
    }

    console.log("收到验证码请求:", {
      sessionID: req.sessionID,
      hasExistingSession: !!req.session.captcha,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString(),
    });

    // 创建更简单、更易读的验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: "0o1ilIO", // 排除所有容易混淆的字符
      width: 150,
      height: 50,
      fontSize: 45,
      noise: 1, // 减少干扰线，提高可读性
      color: true,
      background: "#f0f2f5",
      // 只使用非常容易区分的字符
      charPreset: "ABCDEFGHJKLMNPRSTUVWXYZ23456789",
    });

    // 保存验证码到会话，设置有效期10分钟（增加有效期）
    req.session.captcha = {
      text: captcha.text.toLowerCase(),
      expires: Date.now() + 10 * 60 * 1000, // 10分钟后过期
      createdAt: Date.now(), // 记录创建时间
    };

    console.log("生成验证码:", {
      验证码: captcha.text.toLowerCase(),
      原始验证码: captcha.text,
      过期时间: new Date(req.session.captcha.expires),
      创建时间: new Date(),
      会话ID: req.session.id,
      请求者IP: req.ip || req.connection.remoteAddress,
    });

    // 开发环境下打印明显的验证码信息，方便测试
    if (process.env.NODE_ENV !== "production") {
      console.log("\n==================================================");
      console.log(`当前验证码(测试使用): ${captcha.text}`);
      console.log(`请在登录表单中使用此验证码`);
      console.log("==================================================\n");
    }

    // 确保会话立即保存
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("保存会话失败:", err);
          reject(err);
        } else {
          console.log("会话成功保存，验证码已写入会话");
          resolve();
        }
      });
    });

    // 设置响应头
    res.set({
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // 返回验证码
    res.status(200).send(captcha.data);
  } catch (error) {
    console.error("生成验证码错误:", error);
    res.status(500).json({
      status: "error",
      message: "生成验证码失败",
    });
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const { username, password, captcha } = req.body;

    console.log("收到登录请求:", {
      username,
      captchaProvided: !!captcha,
      captchaLength: captcha?.length,
      sessionID: req.sessionID,
      hasCaptchaInSession: !!req.session?.captcha,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers["user-agent"],
    });

    // 检查会话是否正常初始化
    if (!req.session) {
      console.error("严重错误: 会话对象不存在");
      return res.status(500).json({
        status: "error",
        message: "会话初始化失败，请尝试清除浏览器缓存后重试",
      });
    }

    // 1) 检查验证码
    if (!captcha) {
      console.log("验证码校验失败: 未提供验证码");
      return res.status(400).json({
        status: "error",
        message: "请输入验证码",
      });
    }

    // 检查会话中是否存在验证码
    if (!req.session.captcha || !req.session.captcha.text) {
      console.log("验证码校验失败: 会话中无验证码", {
        sessionExists: !!req.session,
        captchaInSession: !!req.session?.captcha,
        textInCaptcha: !!req.session?.captcha?.text,
        sessionId: req.session?.id,
        time: new Date().toISOString(),
      });

      // 提示用户刷新验证码而不是直接报错
      return res.status(400).json({
        status: "error",
        message: "验证码已失效，请点击刷新",
        code: "CAPTCHA_EXPIRED",
      });
    }

    // 检查验证码是否过期
    if (req.session.captcha.expires < Date.now()) {
      console.log("验证码校验失败: 验证码已过期");
      console.log("过期时间:", new Date(req.session.captcha.expires));
      console.log("当前时间:", new Date());
      return res.status(400).json({
        status: "error",
        message: "验证码已过期，请重新获取",
      });
    }

    // 验证码不区分大小写
    console.log("验证码对比:", {
      输入: captcha.toLowerCase(),
      输入长度: captcha.length,
      期望: req.session.captcha.text,
      期望长度: req.session.captcha.text.length,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
    });

    // 调试: 打印更多会话信息
    console.log("会话详情:", {
      id: req.sessionID,
      cookie: req.session.cookie,
      captchaExists: !!req.session.captcha,
      captchaText: req.session.captcha ? req.session.captcha.text : null,
      expires: req.session.captcha
        ? new Date(req.session.captcha.expires).toISOString()
        : null,
      currentTime: new Date().toISOString(),
    });

    // 验证码比较，增加容错处理
    const inputCode = captcha.toLowerCase().trim();
    const expectedCode = req.session.captcha.text.toLowerCase().trim();

    // 去除所有空格和特殊字符后比较
    const normalizedInput = inputCode.replace(/[\s\W_]/g, "");
    const normalizedExpected = expectedCode.replace(/[\s\W_]/g, "");

    console.log("规范化后的验证码比较:", {
      输入: normalizedInput,
      期望: normalizedExpected,
      相等: normalizedInput === normalizedExpected,
    });

    if (normalizedInput !== normalizedExpected) {
      console.log("验证码校验失败: 验证码不匹配");
      return res.status(400).json({
        status: "error",
        message: "验证码错误",
      });
    }

    // 验证通过后立即清除验证码
    req.session.captcha = null;

    // 2) 检查用户名和密码
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "请提供用户名和密码",
      });
    }

    // 3) 查找用户并验证密码
    const user = await User.findOne({ username }).select("+password");
    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        status: "error",
        message: "用户名或密码错误",
      });
    }

    // 4) 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 5) 生成token并发送到客户端
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "登录时发生错误",
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
