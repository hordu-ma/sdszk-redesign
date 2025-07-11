// adminResources.js - 管理员资源路由
import express from "express";
import {
  getAdminResourceList,
  getAdminResourceDetail,
  updateAdminResourceStatus,
  batchUpdateAdminResourceStatus,
  batchDeleteAdminResources,
} from "../controllers/adminResourceController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 所有管理员资源路由都需要身份验证
router.use(authenticateToken);

// 获取管理员资源列表（带分类信息填充）
router.get("/", getAdminResourceList);

// 获取管理员资源详情
router.get("/:id", getAdminResourceDetail);

// 更新资源状态
router.patch("/:id/status", updateAdminResourceStatus);

// 批量更新资源状态
router.post("/batch-status", batchUpdateAdminResourceStatus);

// 批量删除资源
router.post("/batch-delete", batchDeleteAdminResources);

export default router;
