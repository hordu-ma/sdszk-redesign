// resources.js - 资源管理路由
import express from 'express'
import {
  getResourceList,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  toggleFeaturedStatus,
  getResourceStats,
  batchDeleteResources,
  batchUpdateResources,
} from '../controllers/resourceController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 公开路由
router.get('/', getResourceList)
router.get('/:id', getResourceById)

// 需要认证的路由
router.use(authenticateToken)

// 获取资源统计信息
router.get('/stats/overview', getResourceStats)

// 批量操作路由
router.post('/batch-delete', batchDeleteResources)
router.post('/batch-update', batchUpdateResources)

// 资源 CRUD 路由
router.post('/', createResource)
router.put('/:id', updateResource)
router.delete('/:id', deleteResource)
router.patch('/:id/featured', toggleFeaturedStatus)

export default router
