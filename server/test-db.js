// 数据库连接和基础数据测试脚本
// 运行: cd server && node test-db.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import News from './models/News.js'
import Resource from './models/Resource.js'

// 加载环境变量
dotenv.config()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  success: msg => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
}

async function testDatabaseConnection() {
  try {
    log.info('开始数据库连接测试...')

    // 1. 测试数据库连接
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk'
    log.info(`连接到数据库: ${mongoUri}`)

    await mongoose.connect(mongoUri)
    log.success('数据库连接成功')

    // 2. 测试数据库基本操作
    const collections = await mongoose.connection.db.listCollections().toArray()
    log.info(`数据库中的集合数量: ${collections.length}`)
    collections.forEach(col => {
      log.info(`- ${col.name}`)
    })

    // 3. 测试用户模型
    log.info('\n测试用户模型...')
    try {
      const userCount = await User.countDocuments()
      log.success(`用户集合中有 ${userCount} 个用户`)

      // 查找管理员用户
      const adminUser = await User.findOne({ role: 'admin' })
      if (adminUser) {
        log.success(`找到管理员用户: ${adminUser.username}`)
      } else {
        log.warning('未找到管理员用户，建议创建管理员账户')
      }
    } catch (err) {
      log.error(`用户模型测试失败: ${err.message}`)
    }

    // 4. 测试新闻模型
    log.info('\n测试新闻模型...')
    try {
      const newsCount = await News.countDocuments()
      log.success(`新闻集合中有 ${newsCount} 条新闻`)

      if (newsCount > 0) {
        const latestNews = await News.findOne().sort({ createdAt: -1 })
        log.info(`最新新闻: ${latestNews.title}`)
      }
    } catch (err) {
      log.error(`新闻模型测试失败: ${err.message}`)
    }

    // 5. 测试资源模型
    log.info('\n测试资源模型...')
    try {
      const resourceCount = await Resource.countDocuments()
      log.success(`资源集合中有 ${resourceCount} 个资源`)

      if (resourceCount > 0) {
        const latestResource = await Resource.findOne().sort({ createdAt: -1 })
        log.info(`最新资源: ${latestResource.title}`)
      }
    } catch (err) {
      log.error(`资源模型测试失败: ${err.message}`)
    }

    // 6. 测试创建测试数据（可选）
    log.info('\n创建测试数据...')
    try {
      // 检查是否需要创建管理员用户
      const adminExists = await User.findOne({ username: 'admin' })
      if (!adminExists) {
        log.warning('正在创建默认管理员用户...')
        const adminUser = new User({
          username: 'admin',
          password: 'admin123', // 注意：实际使用时需要更强的密码
          email: 'admin@sdszk.edu.cn',
          name: '系统管理员',
          role: 'admin',
        })
        await adminUser.save()
        log.success('管理员用户创建成功 (用户名: admin, 密码: admin123)')
      }

      // 创建测试新闻（如果没有）
      const testNewsExists = await News.findOne({ title: { $regex: '测试新闻' } })
      if (!testNewsExists) {
        const testNews = new News({
          title: '测试新闻标题',
          content: '这是一条测试新闻的内容，用于验证系统功能是否正常。',
          summary: '测试新闻摘要',
          author: adminExists ? adminExists._id : null,
          status: 'published',
          isTop: false,
          isFeatured: false,
          viewCount: 0,
          tags: ['测试', '系统'],
        })
        await testNews.save()
        log.success('测试新闻创建成功')
      }
    } catch (err) {
      log.error(`创建测试数据失败: ${err.message}`)
    }

    // 7. 数据库性能测试
    log.info('\n数据库性能测试...')
    try {
      const start = Date.now()
      await User.find().limit(10)
      const end = Date.now()
      log.success(`查询10个用户耗时: ${end - start}ms`)
    } catch (err) {
      log.error(`性能测试失败: ${err.message}`)
    }

    log.success('\n数据库测试完成！')
  } catch (error) {
    log.error(`数据库测试失败: ${error.message}`)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    log.info('数据库连接已断开')
  }
}

// 运行测试
testDatabaseConnection().catch(console.error)
