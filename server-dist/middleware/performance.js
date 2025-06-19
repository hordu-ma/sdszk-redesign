// 后端性能优化中间件
const compression = require('compression')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const redis = require('redis')

// Redis客户端配置
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
})

redisClient.on('error', err => {
  console.error('Redis连接错误:', err)
})

redisClient.on('connect', () => {
  console.log('Redis连接成功')
})

// 缓存中间件
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next()
    }

    const key = `cache:${req.originalUrl}`

    try {
      const cached = await redisClient.get(key)
      if (cached) {
        console.log(`缓存命中: ${key}`)
        return res.json(JSON.parse(cached))
      }
    } catch (error) {
      console.error('Redis读取错误:', error)
    }

    // 重写res.json方法以支持缓存
    const originalJson = res.json
    res.json = function (data) {
      // 存储到缓存
      redisClient
        .setex(key, duration, JSON.stringify(data))
        .catch(err => console.error('Redis写入错误:', err))

      return originalJson.call(this, data)
    }

    next()
  }
}

// API限流配置
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 'error',
      message: message || '请求过于频繁，请稍后再试',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// 不同端点的限流策略
const rateLimits = {
  // 一般API限流：15分钟内最多100次请求
  general: createRateLimit(15 * 60 * 1000, 100),

  // 认证API限流：15分钟内最多5次登录尝试
  auth: createRateLimit(15 * 60 * 1000, 5, '登录尝试过于频繁，请15分钟后再试'),

  // 上传API限流：1小时内最多20次上传
  upload: createRateLimit(60 * 60 * 1000, 20, '上传过于频繁，请1小时后再试'),

  // 搜索API限流：1分钟内最多30次搜索
  search: createRateLimit(60 * 1000, 30, '搜索过于频繁，请稍后再试'),
}

// 响应压缩配置
const compressionConfig = compression({
  // 只压缩大于1KB的响应
  threshold: 1024,
  // 压缩级别（1-9，9为最高压缩率但耗CPU）
  level: 6,
  // 压缩的MIME类型
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
})

// 安全头配置
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_BASE_URL || 'http://localhost:3000'],
    },
  },
  crossOriginEmbedderPolicy: false,
})

// 数据库连接优化
const optimizeDatabase = mongoose => {
  // 连接池配置
  mongoose.set('maxPoolSize', 10) // 最大连接数
  mongoose.set('serverSelectionTimeoutMS', 5000) // 服务器选择超时
  mongoose.set('socketTimeoutMS', 45000) // Socket超时
  mongoose.set('family', 4) // 使用IPv4

  // 查询优化
  mongoose.set('autoIndex', process.env.NODE_ENV !== 'production')

  return mongoose
}

// 错误处理中间件（生产环境优化）
const productionErrorHandler = (err, req, res, next) => {
  console.error('服务器错误:', err)

  // 在生产环境中不暴露错误详情
  if (process.env.NODE_ENV === 'production') {
    // 只发送通用错误信息
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    })
  }

  // 开发环境返回详细错误信息
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    stack: err.stack,
  })
}

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    }

    // 记录慢请求（超过1秒）
    if (duration > 1000) {
      console.warn('慢请求警告:', logData)
    } else {
      console.log('请求日志:', logData)
    }
  })

  next()
}

// 健康检查端点
const healthCheck = (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  }

  res.json(healthData)
}

module.exports = {
  redisClient,
  cacheMiddleware,
  rateLimits,
  compressionConfig,
  helmetConfig,
  optimizeDatabase,
  productionErrorHandler,
  requestLogger,
  healthCheck,
}
