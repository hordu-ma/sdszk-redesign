import { createApp } from 'vue'

// 模拟前端API调用测试
async function testResourcesAPI() {
  try {
    console.log('Testing resources API...')

    const response = await fetch(
      'http://localhost:3000/api/resources?status=published&page=1&limit=12',
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('API Response:', data)

    // 测试数据转换
    if (data.status) {
      data.success = data.status === 'success'
    }

    console.log('Transformed data:', data)

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// 立即执行测试
testResourcesAPI()
  .then(data => {
    console.log('✅ API test passed:', data)
  })
  .catch(error => {
    console.error('❌ API test failed:', error)
  })
