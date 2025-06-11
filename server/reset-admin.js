// 重置管理员密码脚本
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk')

    console.log('正在重置管理员密码...')

    // 查找管理员用户
    let adminUser = await User.findOne({ username: 'admin' })

    if (!adminUser) {
      console.log('未找到admin用户，正在创建...')
      // 创建新的管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 12)
      adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@sdszk.edu.cn',
        name: '系统管理员',
        role: 'admin',
      })
      await adminUser.save()
      console.log('✓ 管理员用户创建成功')
    } else {
      console.log('找到admin用户，正在重置密码...')
      // 重置密码
      const hashedPassword = await bcrypt.hash('admin123', 12)
      adminUser.password = hashedPassword
      await adminUser.save()
      console.log('✓ 管理员密码重置成功')
    }

    console.log('')
    console.log('管理员登录信息:')
    console.log('用户名: admin')
    console.log('密码: admin123')
    console.log('登录地址: http://localhost:5173/admin/login')
  } catch (error) {
    console.error('错误:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

resetAdminPassword()
