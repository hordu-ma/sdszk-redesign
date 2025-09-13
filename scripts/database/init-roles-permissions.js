// init-roles-permissions.js - 初始化角色和权限数据
import mongoose from "mongoose";
import Role from "../../server/models/Role.js";
import Permission from "../../server/models/Permission.js";
import User from "../../server/models/User.js";

// 数据库连接配置
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sdszk";

// 颜色输出函数
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 初始化系统权限
async function initializePermissions() {
  try {
    log("blue", "🔐 开始初始化系统权限...");

    await Permission.initializeSystemPermissions();

    const permissionCount = await Permission.countDocuments({ isSystem: true });
    log("green", `✅ 系统权限初始化完成，共 ${permissionCount} 个权限`);

    return true;
  } catch (error) {
    log("red", `❌ 权限初始化失败: ${error.message}`);
    throw error;
  }
}

// 初始化系统角色
async function initializeRoles() {
  try {
    log("blue", "👥 开始初始化系统角色...");

    await Role.initializeSystemRoles();

    const roleCount = await Role.countDocuments({ isSystem: true });
    log("green", `✅ 系统角色初始化完成，共 ${roleCount} 个角色`);

    return true;
  } catch (error) {
    log("red", `❌ 角色初始化失败: ${error.message}`);
    throw error;
  }
}

// 更新现有用户的权限
async function updateUserPermissions() {
  try {
    log("blue", "👤 开始更新现有用户权限...");

    const users = await User.find({ deletedAt: null });
    let updateCount = 0;

    for (const user of users) {
      // 获取对应角色的权限
      const role = await Role.findOne({ name: user.role });
      if (role) {
        // 更新用户权限为角色权限
        user.permissions = role.permissions;
        await user.save({ validateBeforeSave: false });
        updateCount++;
      }
    }

    log("green", `✅ 用户权限更新完成，共更新 ${updateCount} 个用户`);
    return true;
  } catch (error) {
    log("red", `❌ 用户权限更新失败: ${error.message}`);
    throw error;
  }
}

// 验证初始化结果
async function validateInitialization() {
  try {
    log("blue", "🔍 开始验证初始化结果...");

    // 验证权限
    const permissions = await Permission.find({ isSystem: true }).sort({
      module: 1,
      priority: 1,
    });
    const permissionsByModule = {};

    permissions.forEach((permission) => {
      if (!permissionsByModule[permission.module]) {
        permissionsByModule[permission.module] = [];
      }
      permissionsByModule[permission.module].push(permission.name);
    });

    log("cyan", "📋 系统权限分布:");
    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      log("white", `  ${module}: ${perms.length} 个权限`);
    });

    // 验证角色
    const roles = await Role.find({ isSystem: true });
    log("cyan", "🎭 系统角色:");
    for (const role of roles) {
      const userCount = await User.countDocuments({
        role: role.name,
        deletedAt: null,
      });
      log(
        "white",
        `  ${role.displayName} (${role.name}): ${role.permissions.length} 个权限, ${userCount} 个用户`,
      );
    }

    // 验证数据一致性
    const totalPermissions = await Permission.countDocuments({
      isSystem: true,
    });
    const totalRoles = await Role.countDocuments({ isSystem: true });
    const totalUsers = await User.countDocuments({ deletedAt: null });

    log("green", "✅ 验证完成:");
    log("white", `  - 系统权限: ${totalPermissions} 个`);
    log("white", `  - 系统角色: ${totalRoles} 个`);
    log("white", `  - 用户总数: ${totalUsers} 个`);

    return true;
  } catch (error) {
    log("red", `❌ 验证失败: ${error.message}`);
    throw error;
  }
}

// 清理旧数据（可选）
async function cleanupOldData() {
  try {
    log("yellow", "🧹 开始清理旧的角色和权限数据...");

    // 删除非系统角色和权限（如果需要）
    const deletedRoles = await Role.deleteMany({ isSystem: false });
    const deletedPermissions = await Permission.deleteMany({ isSystem: false });

    log(
      "yellow",
      `🗑️ 清理完成: 删除 ${deletedRoles.deletedCount} 个自定义角色, ${deletedPermissions.deletedCount} 个自定义权限`,
    );

    return true;
  } catch (error) {
    log("red", `❌ 清理失败: ${error.message}`);
    throw error;
  }
}

// 主初始化函数
async function initializeRolesAndPermissions(options = {}) {
  try {
    log("magenta", "🚀 开始初始化角色和权限系统...\n");

    // 连接数据库
    log("blue", "🔌 连接数据库...");
    await mongoose.connect(MONGODB_URI);
    log("green", "✅ 数据库连接成功\n");

    // 可选：清理旧数据
    if (options.cleanup) {
      await cleanupOldData();
      console.log();
    }

    // 初始化权限
    await initializePermissions();
    console.log();

    // 初始化角色
    await initializeRoles();
    console.log();

    // 更新用户权限
    await updateUserPermissions();
    console.log();

    // 验证结果
    await validateInitialization();
    console.log();

    log("green", "🎉 角色和权限系统初始化完成！");
  } catch (error) {
    log("red", `💥 初始化过程中发生错误: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    log("blue", "🔌 数据库连接已关闭");
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const options = {
  cleanup: args.includes("--cleanup") || args.includes("-c"),
  verbose: args.includes("--verbose") || args.includes("-v"),
};

// 显示帮助信息
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
角色和权限初始化脚本

用法:
  node init-roles-permissions.js [选项]

选项:
  --cleanup, -c    在初始化前清理旧的自定义角色和权限
  --verbose, -v    显示详细日志
  --help, -h       显示此帮助信息

示例:
  node init-roles-permissions.js              # 基本初始化
  node init-roles-permissions.js --cleanup    # 清理后初始化
  node init-roles-permissions.js -c -v        # 清理并显示详细日志
`);
  process.exit(0);
}

// 运行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeRolesAndPermissions(options);
}

export default initializeRolesAndPermissions;
