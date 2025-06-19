// 运行迁移的脚本
import { up, down } from '../migrations/20240101000001_init_news_categories.js'

const action = process.argv[2]

async function main() {
  try {
    if (action === 'up') {
      await up()
      console.log('迁移成功完成')
    } else if (action === 'down') {
      await down()
      console.log('回滚成功完成')
    } else {
      console.log('请指定操作: up 或 down')
      process.exit(1)
    }
  } catch (error) {
    console.error('迁移失败:', error)
    process.exit(1)
  }
}

main()
