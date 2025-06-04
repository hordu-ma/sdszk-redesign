// upload.js - 文件上传路由
import express from 'express'
import {
  uploadSingle,
  uploadMultiple,
  handleFileUpload,
  deleteFile,
} from '../controllers/uploadController.js'
import { protect } from '../controllers/authController.js'

const router = express.Router()

// 保护所有上传路由，需要登录才能访问
router.use(protect)

// 单文件上传路由
router.post('/single', uploadSingle('file'), handleFileUpload)

// 多文件上传路由
router.post('/multiple', uploadMultiple('files', 5), handleFileUpload)

// 删除文件
router.delete('/:filename', deleteFile)

export default router
