// adminResources.js - 管理员资源路由
import express from "express";
import {
  getAdminResourceList,
  getAdminResourceDetail,
  createAdminResource,
  updateAdminResource,
  updateAdminResourceStatus,
  batchUpdateAdminResourceStatus,
  deleteAdminResource,
  batchDeleteAdminResources,
} from "../controllers/adminResourceController.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkPermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// 所有管理员资源路由都需要身份验证
router.use(authenticateToken);

// 获取管理员资源列表（带分类信息填充）
router.get("/", checkPermission("resources", "read"), getAdminResourceList);

// 获取管理员资源详情
router.get(
  "/:id",
  checkPermission("resources", "read"),
  getAdminResourceDetail,
);

// 创建新资源
router.post("/", checkPermission("resources", "create"), createAdminResource);

// 更新资源
router.put("/:id", checkPermission("resources", "update"), updateAdminResource);

// 更新资源状态
router.patch(
  "/:id/status",
  checkPermission("resources", "update"),
  updateAdminResourceStatus,
);

// 批量更新资源状态
router.post(
  "/batch-status",
  checkPermission("resources", "update"),
  batchUpdateAdminResourceStatus,
);

// 删除单个资源
router.delete(
  "/:id",
  checkPermission("resources", "delete"),
  deleteAdminResource,
);

// 批量删除资源
router.post(
  "/batch-delete",
  checkPermission("resources", "delete"),
  batchDeleteAdminResources,
);

export default router;
