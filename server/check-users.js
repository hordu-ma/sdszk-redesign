// 检查用户数据脚本
import mongoose from 'mongoose'
import User from './models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk')

    console.log('数据库中的用户:')
    const users = await User.find({}, 'username role email').limit(5)
    users.forEach(user => {
      console.log(`- 用户名: ${user.username}, 角色: ${user.role}, 邮箱: ${user.email}`)
    })

    // 尝试用管理员账号测试登录
    console.log('\n测试管理员登录验证:')
    const adminUser = await User.findOne({ username: 'admin' }).select('+password')
    if (adminUser) {
      console.log('找到admin用户')
      console.log('密码字段存在:', !!adminUser.password)
      // 测试密码验证
      const testPasswords = ['admin123', 'admin', 'password', '123456']
      for (const pwd of testPasswords) {
        try {
          const isValid = await adminUser.correctPassword(pwd, adminUser.password)
          if (isValid) {
            console.log(`✓ 正确密码是: ${pwd}`)
            break
          }
        } catch (e) {
          console.log(`✗ 密码 "${pwd}" 验证失败:`, e.message)
        }
      }
    } else {
      console.log('未找到admin用户')
    }
  } catch (error) {
    console.error('错误:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

checkUsers()
