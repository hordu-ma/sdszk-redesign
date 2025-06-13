import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function detailedDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk')

    console.log('详细调试密码验证...')

    // 1. 测试bcrypt直接验证
    console.log('\n=== 测试bcrypt直接验证 ===')
    const testPassword = 'admin123'
    const hash = '$2a$10$iBupN6ZoXEiKPkFIhYNDC.4/qkRkL.TAGyfmOXpLrdcD2x4a2koyG'

    const directResult = await bcrypt.compare(testPassword, hash)
    console.log(`bcrypt.compare("${testPassword}", "${hash}")`)
    console.log('结果:', directResult)

    // 2. 测试生成新的哈希值
    console.log('\n=== 生成新的admin123哈希 ===')
    const newHash = await bcrypt.hash(testPassword, 12)
    console.log('新哈希:', newHash)
    const newVerify = await bcrypt.compare(testPassword, newHash)
    console.log('新哈希验证结果:', newVerify)

    // 3. 查找用户并更新密码
    console.log('\n=== 更新admin用户密码 ===')
    const adminUser = await User.findOne({ username: 'admin' })
    if (adminUser) {
      // 直接设置明文密码，让pre('save')钩子处理加密
      adminUser.password = testPassword
      await adminUser.save()
      console.log('密码已更新')

      // 重新查询验证
      const updatedUser = await User.findOne({ username: 'admin' }).select('+password')
      console.log('新密码哈希:', updatedUser.password)

      const verifyResult = await updatedUser.correctPassword(testPassword, updatedUser.password)
      console.log('验证结果:', verifyResult)
    }
  } catch (error) {
    console.error('错误:', error)
  } finally {
    await mongoose.disconnect()
  }
}

detailedDebug()
