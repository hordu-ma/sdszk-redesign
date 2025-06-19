import express from 'express'
const router = express.Router()

// 模拟角色数据
let roles = [
  {
    id: 1,
    name: 'admin',
    displayName: '管理员',
    description: '系统管理员',
    permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
    userCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'editor',
    displayName: '编辑',
    description: '内容编辑',
    permissions: ['news:create', 'news:read', 'news:update'],
    userCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// 获取角色列表
router.get('/', (req, res) => {
  res.json(roles)
})

// 创建角色
router.post('/', (req, res) => {
  const newRole = {
    ...req.body,
    id: Date.now(),
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  roles.push(newRole)
  res.json({ data: newRole })
})

// 更新角色
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = roles.findIndex(r => r.id === id)
  if (idx === -1) return res.status(404).json({ message: '角色不存在' })
  roles[idx] = { ...roles[idx], ...req.body, updatedAt: new Date().toISOString() }
  res.json({ data: roles[idx] })
})

// 删除角色
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  roles = roles.filter(r => r.id !== id)
  res.json({ data: true })
})

export default router
