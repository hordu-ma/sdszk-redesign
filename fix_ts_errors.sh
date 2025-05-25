#!/bin/bash

# 修复NewsCreate.vue中的模板错误
sed -i '' 's/    <div class="                      :key="category._id"\n                      :value="category._id">ge-header">/    <div class="page-header">/' "/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/news/NewsCreate.vue"

# 在UsersList.vue中添加onMenuClick包装函数
if ! grep -q "onMenuClick" "/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/users/UsersList.vue"; then
  sed -i '' '/^onMounted/i\\
// 添加类型安全的菜单点击包装函数\\
const onMenuClick = (record: AdminUserItem) => (event: { key: string }) => {\\
  handleMoreAction(event.key, record)\\
}\\
' "/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/users/UsersList.vue"
fi

# 修复UsersList.vue中的菜单点击处理器
sed -i '' 's/<a-menu @click="({ key }) => handleMoreAction(key, record)">/<a-menu @click="onMenuClick(record)">/' "/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/users/UsersList.vue"
