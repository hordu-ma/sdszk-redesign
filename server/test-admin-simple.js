import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

console.log('开始测试脚本...')

// 连接数据库 - 使用与check-users.js相同的数据库
const mongoUri = 'mongodb://localhost:27017/sdszk'
console.log('连接数据库:', mongoUri)

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ 数据库连接成功')
    testAdminLogin()
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err)
    process.exit(1)
  })

// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const User = mongoose.model('User', userSchema)

async function testAdminLogin() {
  try {
    console.log('\n=== 管理员登录测试 ===')

    // 查找管理员用户
    console.log('查找admin用户...')
    const admin = await User.findOne({ username: 'admin' })
    if (!admin) {
      console.log('❌ 找不到admin用户')
      mongoose.connection.close()
      return
    }

    console.log('✅ 找到admin用户')
    console.log('- 用户名:', admin.username)
    console.log('- 邮箱:', admin.email)
    console.log('- 角色:', admin.role)
    console.log('- 创建时间:', admin.createdAt)
    console.log('- 密码hash存在:', !!admin.password)

    // 测试常见密码
    const testPasswords = ['admin', 'admin123', '123456', 'password', 'sdszk', 'admin888', '888888']

    console.log('\n=== 密码验证测试 ===')
    let foundCorrectPassword = false

    for (const password of testPasswords) {
      try {
        console.log(`测试密码: "${password}"`)
        const isValid = await bcrypt.compare(password, admin.password)
        if (isValid) {
          console.log(`✅ 密码正确: "${password}"`)
          foundCorrectPassword = true
          break
        } else {
          console.log(`❌ 密码错误: "${password}"`)
        }
      } catch (error) {
        console.log(`❌ 验证密码 "${password}" 时出错:`, error.message)
      }
    }

    if (!foundCorrectPassword) {
      console.log('\n❌ 所有测试密码都不正确')
      console.log('需要重置管理员密码')

      // 重置密码为 admin123
      console.log('\n=== 重置管理员密码 ===')
      const newPassword = 'admin123'
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await User.updateOne(
        { username: 'admin' },
        { password: hashedPassword, updatedAt: new Date() }
      )

      console.log(`✅ 密码已重置为: "${newPassword}"`)
    }
  } catch (error) {
    console.error('❌ 测试过程出错:', error)
  } finally {
    mongoose.connection.close()
    console.log('\n数据库连接已关闭')
  }
}
