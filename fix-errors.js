#!/usr/bin/env node

/**
 * 自动修复Vue文件中的TypeScript错误
 */

const fs = require('fs')
const path = require('path')

const fixes = [
  // 修复ResourcesEdit.vue中的API调用
  {
    file: '/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/resources/ResourcesEdit.vue',
    replacements: [
      {
        from: 'resourceCategoryApi.getAll()',
        to: 'resourceCategoryApi.getList()',
      },
      {
        from: 'route.params.id as string',
        to: 'Number(route.params.id)',
      },
    ],
  },

  // 修复ResourcesCategories.vue中的API调用
  {
    file: '/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/resources/ResourcesCategories.vue',
    replacements: [
      {
        from: 'import { resourceCategoryApi, type ResourceCategory } from',
        to: 'import { ResourceCategoryApi, type ResourceCategory } from',
      },
      {
        from: 'resourceCategoryApi.getAll()',
        to: 'new ResourceCategoryApi().getList()',
      },
    ],
  },

  // 修复UsersList.vue中的API调用
  {
    file: '/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/users/UsersList.vue',
    replacements: [
      {
        from: 'adminUserApi.getAll()',
        to: 'adminUserApi.getList()',
      },
    ],
  },
]

function applyFixes() {
  fixes.forEach(fix => {
    if (fs.existsSync(fix.file)) {
      let content = fs.readFileSync(fix.file, 'utf8')

      fix.replacements.forEach(replacement => {
        content = content.replace(new RegExp(replacement.from, 'g'), replacement.to)
      })

      fs.writeFileSync(fix.file, content)
      console.log(`✅ Fixed: ${fix.file}`)
    } else {
      console.log(`⚠️  File not found: ${fix.file}`)
    }
  })
}

applyFixes()
console.log('🎉 Error fixes applied!')
