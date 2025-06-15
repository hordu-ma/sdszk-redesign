const https = require('https')

// 测试资源详情API
async function testResourceDetail() {
  try {
    // 首先获取资源列表，找一个资源ID
    console.log('🔍 获取资源列表以获取资源ID...')

    const listOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/resources',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    }

    const listResponse = await new Promise((resolve, reject) => {
      const req = https.request(listOptions, res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (error) {
            reject(error)
          }
        })
      })
      req.on('error', reject)
      req.end()
    })

    console.log('📋 资源列表响应:', JSON.stringify(listResponse, null, 2))

    // 如果有资源，测试第一个资源的详情
    if (listResponse.success && listResponse.data && listResponse.data.length > 0) {
      const firstResource = listResponse.data[0]
      const resourceId = firstResource.id || firstResource._id

      console.log(`🔍 测试资源详情，ID: ${resourceId}`)

      const detailOptions = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/resources/${resourceId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        rejectUnauthorized: false,
      }

      const detailResponse = await new Promise((resolve, reject) => {
        const req = https.request(detailOptions, res => {
          let data = ''
          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            try {
              resolve(JSON.parse(data))
            } catch (error) {
              reject(error)
            }
          })
        })
        req.on('error', reject)
        req.end()
      })

      console.log('📄 资源详情响应:', JSON.stringify(detailResponse, null, 2))

      if (detailResponse.success && detailResponse.data) {
        console.log('✅ 资源详情API工作正常')
        console.log('📝 资源信息:')
        console.log(`  - 标题: ${detailResponse.data.title}`)
        console.log(
          `  - 作者: ${detailResponse.data.author || detailResponse.data.createdBy?.name || '未知'}`
        )
        console.log(`  - 分类: ${detailResponse.data.category || '未分类'}`)
        console.log(`  - 创建时间: ${detailResponse.data.createdAt}`)
        console.log(`  - 查看次数: ${detailResponse.data.viewCount || 0}`)
      } else {
        console.log('❌ 资源详情API响应异常')
      }
    } else {
      console.log('⚠️ 没有找到资源数据')
    }
  } catch (error) {
    console.error('❌ 测试资源详情API失败:', error.message)
  }
}

// 运行测试
console.log('🚀 开始测试资源详情API...\n')
testResourceDetail()
