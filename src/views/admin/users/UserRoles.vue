<template>
  <div class="user-roles">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="title-section">
        <h2>角色管理</h2>
        <p>管理系统角色和权限分配</p>
      </div>
      <div class="action-section">
        <a-button type="primary"
@click="showCreateModal">
          <template #icon>
            <PlusOutlined />
          </template>
          新增角色
        </a-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索角色名称或描述"
        style="width: 300px"
        @search="handleSearch"
        @press-enter="handleSearch"
      />
    </div>

    <!-- 角色卡片网格 -->
    <div class="roles-grid">
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="role in filteredRoles"
          :key="role.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card
            :hoverable="true"
            class="role-card"
            :class="{ 'system-role': isSystemRole(role.name) }"
          >
            <template #title>
              <div class="role-title">
                <a-tag :color="getRoleColor(role.name)"
class="role-tag">
                  {{ role.displayName }}
                </a-tag>
                <a-dropdown v-if="!isSystemRole(role.name)">
                  <a-button type="text"
size="small">
                    <MoreOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="onRoleMenuClick(role)">
                      <a-menu-item key="edit"> 编辑 </a-menu-item>
                      <a-menu-item key="permissions"> 配置权限 </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item
key="delete" danger> 删除 </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </template>

            <div class="role-content">
              <div class="role-description">
                {{ role.description || "暂无描述" }}
              </div>

              <div class="role-stats">
                <div class="stat-item">
                  <span class="stat-label">用户数:</span>
                  <span class="stat-value">{{ role.userCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">权限数:</span>
                  <span class="stat-value">{{ role.permissions.length }}</span>
                </div>
              </div>

              <div class="role-permissions">
                <div class="permissions-preview">
                  <a-tag
                    v-for="permission in role.permissions.slice(0, 3)"
                    :key="permission"
                    size="small"
                    color="blue"
                  >
                    {{ getPermissionDisplayName(permission) }}
                  </a-tag>
                  <a-tag
                    v-if="role.permissions.length > 3"
                    size="small"
                    color="default"
                  >
                    +{{ role.permissions.length - 3 }}
                  </a-tag>
                </div>
              </div>

              <div class="role-actions">
                <a-button
                  type="link"
                  size="small"
                  @click="viewRoleDetails(role)"
                >
                  查看详情
                </a-button>
                <a-button
                  v-if="!isSystemRole(role.name)"
                  type="link"
                  size="small"
                  @click="editRole(role)"
                >
                  编辑
                </a-button>
              </div>

              <div class="role-meta">
                <span class="created-time">
                  创建于 {{ formatDate(role.createdAt) }}
                </span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 创建/编辑角色模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑角色' : '创建角色'"
      :confirm-loading="modalLoading"
      width="800px"
      @ok="handleSubmit"
      @cancel="resetForm"
    >
      <a-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleFormRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-form-item label="角色名称"
name="name">
          <a-input
            v-model:value="roleForm.name"
            placeholder="请输入角色名称（英文标识）"
            :disabled="isEditing"
          />
        </a-form-item>

        <a-form-item label="显示名称"
name="displayName">
          <a-input
            v-model:value="roleForm.displayName"
            placeholder="请输入显示名称（中文）"
          />
        </a-form-item>

        <a-form-item label="角色描述"
name="description">
          <a-textarea
            v-model:value="roleForm.description"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="权限配置"
name="permissions">
          <div class="permissions-config">
            <div class="permissions-header">
              <a-checkbox
                :indeterminate="permissionsIndeterminate"
                :checked="permissionsCheckAll"
                @change="handleCheckAllPermissions"
              >
                全选
              </a-checkbox>
              <a-button type="link"
size="small" @click="expandAllPermissions">
                {{ allExpanded ? "收起全部" : "展开全部" }}
              </a-button>
            </div>

            <a-tree
              v-model:checked-keys="roleForm.permissions"
              v-model:expanded-keys="expandedPermissionKeys"
              :tree-data="permissionTree"
              checkable
              :field-names="{
                children: 'children',
                title: 'displayName',
                key: 'name',
              }"
              class="permissions-tree"
              @check="handlePermissionCheck"
            >
              <template #title="{ displayName, description }">
                <div class="permission-item">
                  <span class="permission-name">{{ displayName }}</span>
                  <span v-if="description"
class="permission-desc">{{
                    description
                  }}</span>
                </div>
              </template>
            </a-tree>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 角色详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="角色详情"
      :footer="null"
      width="600px"
    >
      <div v-if="currentRole"
class="role-detail">
        <a-descriptions :column="2"
bordered>
          <a-descriptions-item label="角色名称">
            {{ currentRole.name }}
          </a-descriptions-item>
          <a-descriptions-item label="显示名称">
            {{ currentRole.displayName }}
          </a-descriptions-item>
          <a-descriptions-item label="用户数量">
            {{ currentRole.userCount }}
          </a-descriptions-item>
          <a-descriptions-item label="权限数量">
            {{ currentRole.permissions.length }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间"
:span="2">
            {{ formatDate(currentRole.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="角色描述"
:span="2">
            {{ currentRole.description || "暂无描述" }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="detail-section">
          <h4>权限列表</h4>
          <div class="permissions-list">
            <a-tag
              v-for="permission in currentRole.permissions"
              :key="permission"
              color="blue"
              class="permission-tag"
            >
              {{ getPermissionDisplayName(permission) }}
            </a-tag>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message, Modal } from "ant-design-vue";
import dayjs from "dayjs";
import { PlusOutlined, MoreOutlined } from "@ant-design/icons-vue";
import { AdminUserApi } from "@/api/modules/adminUser";

// 创建用户API实例
const adminUserApi = new AdminUserApi();
import type { RoleItem, PermissionItem } from "@/api/modules/adminUser";

// 响应式数据
const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const detailModalVisible = ref(false);
const isEditing = ref(false);
const currentRoleId = ref<number>();
const searchKeyword = ref("");

const roles = ref<RoleItem[]>([]);
const permissions = ref<PermissionItem[]>([]);
const permissionTree = ref<any[]>([]);
const currentRole = ref<RoleItem | null>(null);

const expandedPermissionKeys = ref<string[]>([]);
const allExpanded = ref(false);

// 角色表单
const roleForm = reactive({
  name: "",
  displayName: "",
  description: "",
  permissions: [] as string[],
});

// 表单引用
const roleFormRef = ref();

// 计算属性
const filteredRoles = computed(() => {
  if (!searchKeyword.value) return roles.value;
  const keyword = searchKeyword.value.toLowerCase();
  return roles.value.filter(
    (role) =>
      role.name.toLowerCase().includes(keyword) ||
      role.displayName.toLowerCase().includes(keyword) ||
      (role.description && role.description.toLowerCase().includes(keyword)),
  );
});

const permissionsIndeterminate = computed(() => {
  const checked = roleForm.permissions.length;
  const total = getAllPermissionKeys().length;
  return checked > 0 && checked < total;
});

const permissionsCheckAll = computed(() => {
  const total = getAllPermissionKeys().length;
  return total > 0 && roleForm.permissions.length === total;
});

// 表单验证规则
const roleFormRules = {
  name: [
    { required: true, message: "请输入角色名称" },
    {
      pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      message: "角色名称只能包含字母、数字和下划线，且以字母或下划线开头",
    },
  ],
  displayName: [{ required: true, message: "请输入显示名称" }],
};

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

const isSystemRole = (roleName: string) => {
  const systemRoles = ["admin", "super_admin", "system"];
  return systemRoles.includes(roleName);
};

const getRoleColor = (roleName: string) => {
  if (isSystemRole(roleName)) return "red";
  const colors = ["blue", "green", "orange", "purple", "cyan", "magenta"];
  const index = roleName.charCodeAt(0) % colors.length;
  return colors[index];
};

const getPermissionDisplayName = (permissionName: string) => {
  const permission = permissions.value.find((p) => p.name === permissionName);
  return permission?.displayName || permissionName;
};

const getAllPermissionKeys = (): string[] => {
  const keys: string[] = [];
  const traverse = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      } else {
        keys.push(node.name);
      }
    });
  };
  traverse(permissionTree.value);
  return keys;
};

// 数据加载
const loadRoles = async () => {
  try {
    loading.value = true;
    const response = await adminUserApi.getRoles();
    const data = (response as any).data;
    roles.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error("角色加载错误:", error);
    message.error("加载角色列表失败");
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const [permissionsRes, treeRes] = await Promise.all([
      adminUserApi.getPermissions(),
      adminUserApi.getPermissionTree(),
    ]);

    // 处理权限列表数据
    const permData = (permissionsRes as any).data;
    permissions.value = Array.isArray(permData)
      ? permData
      : (permData?.data ?? []);

    // 处理权限树数据的嵌套结构
    let treeData = (treeRes as any).data;
    if (treeData && typeof treeData === "object" && "data" in treeData) {
      treeData = treeData.data;
    }

    // 转换权限树格式
    if (treeData && typeof treeData === "object") {
      permissionTree.value = Object.entries(treeData).map(
        ([module, perms]) => ({
          name: module,
          displayName: module,
          children: (perms as PermissionItem[]).map((p) => ({
            name: p.name,
            displayName: p.displayName,
            description: p.description,
          })),
        }),
      );
    }
  } catch (error) {
    console.error("权限加载错误:", error);
    message.error("加载权限列表失败");
  }
};

// 事件处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
};

const showCreateModal = () => {
  isEditing.value = false;
  modalVisible.value = true;
  resetForm();
};

const editRole = (role: RoleItem) => {
  isEditing.value = true;
  currentRoleId.value = role.id;
  Object.assign(roleForm, {
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    permissions: [...role.permissions],
  });
  modalVisible.value = true;
};

const viewRoleDetails = (role: RoleItem) => {
  currentRole.value = role;
  detailModalVisible.value = true;
};

const handleRoleAction = (key: string, role: RoleItem) => {
  switch (key) {
    case "edit":
      editRole(role);
      break;
    case "permissions":
      editRole(role); // 直接进入编辑模式，重点在权限配置
      break;
    case "delete":
      deleteRole(role);
      break;
  }
};

// Wrapper function for menu click to fix TypeScript type inference
const onRoleMenuClick = (role: RoleItem) => (event: { key: string }) => {
  handleRoleAction(event.key, role);
};

const deleteRole = (role: RoleItem) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除角色 "${role.displayName}" 吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        await adminUserApi.deleteRole(role.id);
        message.success("删除成功");
        loadRoles();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate();
    modalLoading.value = true;

    const formData = {
      name: roleForm.name,
      displayName: roleForm.displayName,
      description: roleForm.description,
      permissions: roleForm.permissions,
    };

    if (isEditing.value && currentRoleId.value) {
      await adminUserApi.updateRole(currentRoleId.value, formData);
      message.success("更新成功");
    } else {
      await adminUserApi.createRole(formData);
      message.success("创建成功");
    }

    modalVisible.value = false;
    loadRoles();
  } catch (error) {
    if (typeof error === "object" && error !== null && "errorFields" in error) {
      message.error("请检查表单输入");
    } else {
      message.error(isEditing.value ? "更新失败" : "创建失败");
    }
  } finally {
    modalLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(roleForm, {
    name: "",
    displayName: "",
    description: "",
    permissions: [],
  });
  roleFormRef.value?.resetFields();
};

const handleCheckAllPermissions = (e: any) => {
  if (e.target.checked) {
    roleForm.permissions = getAllPermissionKeys();
  } else {
    roleForm.permissions = [];
  }
};

const handlePermissionCheck = () => {
  // 权限选择变化时的处理（如果需要）
};

const expandAllPermissions = () => {
  if (allExpanded.value) {
    expandedPermissionKeys.value = [];
  } else {
    expandedPermissionKeys.value = permissionTree.value.map(
      (node) => node.name,
    );
  }
  allExpanded.value = !allExpanded.value;
};

// 生命周期
onMounted(() => {
  loadRoles();
  loadPermissions();
});
</script>

<style scoped>
.user-roles {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.title-section h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.title-section p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.search-section {
  margin-bottom: 24px;
}

.roles-grid {
  margin-top: 16px;
}

.role-card {
  height: 280px;
  transition: all 0.3s ease;
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.role-card.system-role {
  border: 2px solid #ff4d4f;
}

.role-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-tag {
  margin: 0;
}

.role-content {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.role-description {
  color: #8c8c8c;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.role-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.stat-item {
  font-size: 12px;
}

.stat-label {
  color: #8c8c8c;
}

.stat-value {
  color: #1890ff;
  font-weight: 500;
  margin-left: 4px;
}

.role-permissions {
  flex: 1;
  margin-bottom: 12px;
}

.permissions-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.role-meta {
  font-size: 11px;
  color: #bfbfbf;
  flex-shrink: 0;
}

.permissions-config {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
}

.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.permissions-tree {
  max-height: 300px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  flex-direction: column;
}

.permission-name {
  font-weight: 500;
}

.permission-desc {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.role-detail .detail-section {
  margin-top: 24px;
}

.role-detail .detail-section h4 {
  margin-bottom: 12px;
  color: #262626;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  margin: 0;
}

:deep(.ant-card-head) {
  min-height: 48px;
}

:deep(.ant-card-body) {
  padding: 16px;
}

:deep(.ant-tree .ant-tree-node-content-wrapper) {
  padding: 2px 4px;
}
</style>
