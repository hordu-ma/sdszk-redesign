// User.js - 用户模型
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '请输入用户名'],
      unique: true,
      trim: true,
      minlength: [3, '用户名至少需要3个字符'],
      maxlength: [20, '用户名不能超过20个字符'],
    },
    password: {
      type: String,
      required: [true, '请输入密码'],
      minlength: [6, '密码至少需要6个字符'],
      select: false, // 查询时默认不返回密码
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址'],
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'editor',
    },
    avatar: String,
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    permissions: {
      news: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        publish: { type: Boolean, default: false },
      },
      resources: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        publish: { type: Boolean, default: false },
      },
      activities: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        publish: { type: Boolean, default: false },
      },
      users: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      settings: {
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    loginHistory: [
      {
        loginTime: Date,
        ip: String,
        userAgent: String,
        success: Boolean,
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
)

// 添加索引，优化查询
userSchema.index({ email: 1 }, { unique: true, sparse: true }); // 稀疏索引，忽略null值
userSchema.index({ role: 1, active: 1 }); // 优化用户管理查询

// 在保存之前对密码进行加密
userSchema.pre('save', async function (next) {
  // 如果密码没有被修改，则不需要重新加密
  if (!this.isModified('password')) return next()

  try {
    // 使用bcrypt加密密码
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// 添加比较密码的实例方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 添加 correctPassword 方法作为 comparePassword 的别名
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  // 注意：userPassword 是已加密的密码，不需要再加密
  return await bcrypt.compare(candidatePassword, userPassword)
}

// 添加密码重置令牌方法
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  // 密码重置令牌有效期为10分钟
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  return resetToken
}

// 判断密码是否在特定时间后更改
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

// 添加记录登录历史的方法
userSchema.methods.recordLogin = async function (success, ip, userAgent) {
  const loginRecord = {
    loginTime: new Date(),
    ip,
    userAgent,
    success,
  }

  // 保持登录历史记录不超过10条
  if (this.loginHistory && this.loginHistory.length >= 10) {
    this.loginHistory.shift()
  }

  if (!this.loginHistory) this.loginHistory = []
  this.loginHistory.push(loginRecord)

  if (success) {
    this.lastLogin = new Date()
  }

  await this.save({ validateBeforeSave: false })
}

// 在角色修改时自动设置权限
userSchema.pre('save', function (next) {
  if (!this.isModified('role')) return next()

  // 根据角色分配默认权限
  if (this.role === 'admin') {
    this.permissions = {
      news: {
        manage: true,
        create: true,
        read: true,
        update: true,
        delete: true,
        publish: true,
      },
      resources: {
        manage: true,
        create: true,
        read: true,
        update: true,
        delete: true,
        publish: true,
      },
      activities: {
        manage: true,
        create: true,
        read: true,
        update: true,
        delete: true,
        publish: true,
      },
      users: {
        manage: true,
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      settings: {
        manage: true,
        read: true,
        update: true,
      },
      system: {
        manage: true,
        setting: true,
      },
    }
  } else if (this.role === 'editor') {
    this.permissions = {
      news: {
        create: true,
        read: true,
        update: true,
        delete: false,
        publish: false,
      },
      resources: {
        create: true,
        read: true,
        update: true,
        delete: false,
        publish: false,
      },
      activities: {
        create: true,
        read: true,
        update: true,
        delete: false,
        publish: false,
      },
      users: {
        read: true,
      },
      settings: {
        read: true,
      },
    }
  } else {
    // 默认用户权限
    this.permissions = {
      news: {
        read: true,
      },
      resources: {
        create: false,
        read: true,
        update: false,
        delete: false,
        publish: false,
      },
      activities: {
        create: false,
        read: true,
        update: false,
        delete: false,
        publish: false,
      },
      users: { create: false, read: false, update: false, delete: false },
      settings: { read: false, update: false },
    }
  }

  next()
})

// 检查用户是否有特定权限
userSchema.methods.hasPermission = function (module, operation) {
  if (!this.permissions || !this.permissions[module]) return false
  return this.permissions[module][operation] === true
}

// 创建虚拟属性：全名
userSchema.virtual('fullName').get(function () {
  return this.name || this.username
})

const User = mongoose.model('User', userSchema)

export default User
