// authController.js - 认证控制器
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// 生成JWT令牌
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })
}

// 创建并发送令牌
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)

  // 设置cookie选项
  const cookieOptions = {
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 1天
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }

  // 发送cookie
  res.cookie('jwt', token, cookieOptions)

  // 移除密码
  user.password = undefined

  // 发送响应
  res.status(statusCode).json({
    status: 'success',
    message: '登录成功',
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
  })
}

// 登录
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    // 1) 检查用户名和密码是否存在
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: '请提供用户名和密码',
      })
    }

    // 2) 检查用户是否存在及密码是否正确
    const user = await User.findOne({ username }).select('+password')
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误',
      })
    }

    // 3) 检查用户是否激活
    if (!user.active) {
      return res.status(401).json({
        status: 'error',
        message: '该账户已被禁用',
      })
    }

    // 4) 如果一切正常，发送令牌给客户端
    createSendToken(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// 退出登录
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  res.status(200).json({ status: 'success' })
}

// 获取当前用户信息
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

// 保护路由的中间件
export const protect = async (req, res, next) => {
  try {
    let token

    // 1) 从请求头或cookie中获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '您未登录，请先登录',
      })
    }

    // 2) 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // 3) 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: '此token的用户已不存在',
      })
    }

    // 4) 检查用户是否已经激活
    if (!currentUser.active) {
      return res.status(401).json({
        status: 'error',
        message: '该账户已被禁用',
      })
    }

    // 5) 将用户信息添加到请求对象中
    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token无效或已过期',
    })
  }
}

// 基于角色的访问控制中间件
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '您没有权限执行此操作',
      })
    }
    next()
  }
}
