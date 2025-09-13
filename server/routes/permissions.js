// permissions.js - 权限管理路由
import express from "express";
import {
  getAllPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  batchDeletePermissions,
  getPermissionTree,
  getPermissionsByModule,
  getModules,
  initializeSystemPermissions,
  getPermissionStats,
} from "../controllers/permissionController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// 保护所有权限路由 - 需要登录且为管理员
router.use(protect);
router.use(restrictTo("admin"));

// 权限统计和初始化
router.get("/stats", getPermissionStats);
router.post("/initialize", initializeSystemPermissions);

// 权限树和模块
router.get("/tree", getPermissionTree);
router.get("/modules", getModules);
router.get("/modules/:module", getPermissionsByModule);

// 权限列表
router.get("/", getAllPermissions);

// 创建权限
router.post("/", createPermission);

// 批量操作
router.post("/batch-delete", batchDeletePermissions);

// 单个权限操作
router
  .route("/:id")
  .get(getPermission)
  .put(updatePermission)
  .delete(deletePermission);

export default router;
