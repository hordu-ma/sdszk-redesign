// roles.js - 角色管理路由
import express from "express";
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  batchDeleteRoles,
  getRolePermissions,
  updateRolePermissions,
  initializeSystemRoles,
  getRoleStats,
} from "../controllers/roleController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

// 保护所有角色路由 - 需要登录且为管理员
router.use(protect);
router.use(restrictTo("admin"));

// 角色统计和初始化
router.get("/stats", getRoleStats);
router.post("/initialize", initializeSystemRoles);

// 角色列表
router.get("/", getAllRoles);

// 创建角色
router.post("/", createRole);

// 批量操作
router.post("/batch-delete", batchDeleteRoles);

// 单个角色操作
router.route("/:id").get(getRole).put(updateRole).delete(deleteRole);

// 角色权限管理
router
  .route("/:id/permissions")
  .get(getRolePermissions)
  .put(updateRolePermissions);

export default router;
