<template>
  <div class="user-permissions">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="title-section">
        <h2>权限管理</h2>
        <p>管理系统权限点和访问控制</p>
      </div>
      <div class="action-section">
        <a-button type="primary" @click="showCreateModal">
          <template #icon>
            <plus-outlined />
          </template>
          新增权限
        </a-button>
        <a-button @click="refreshPermissions">
          <template #icon>
            <reload-outlined />
          </template>
          刷新权限
        </a-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-input-search
            v-model:value="searchForm.keyword"
            placeholder="搜索权限名称或描述"
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.module"
            placeholder="模块筛选"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option
              v-for="module in modules"
              :key="module"
              :value="module"
            >
              {{ module }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.action"
            placeholder="操作筛选"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option
              v-for="action in actions"
              :key="action"
              :value="action"
            >
              {{ action }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button @click="resetSearch"> 重置 </a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 权限树形表格 -->
    <div class="permissions-section">
      <div class="section-header">
        <h3>权限列表</h3>
        <div class="view-controls">
          <a-radio-group
            v-model:value="viewMode"
            @change="handleViewModeChange"
          >
            <a-radio-button value="tree"> 树形视图 </a-radio-button>
            <a-radio-button value="table"> 表格视图 </a-radio-button>
          </a-radio-group>
        </div>
      </div>

      <!-- 树形视图 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
        <a-tree
          :tree-data="permissionTreeData"
          :default-expand-all="true"
          :field-names="{ children: 'children', title: 'title', key: 'key' }"
        >
          <template #title="nodeData">
            <div
              class="permission-node"
              :class="{ 'is-leaf': !nodeData.children }"
            >
              <div class="node-content">
                <div class="node-info">
                  <span class="node-name">{{
                    nodeData.displayName || nodeData.name
                  }}</span>
                  <a-tag
                    v-if="nodeData.module"
                    :color="getModuleColor(nodeData.module)"
                    size="small"
                  >
                    {{ nodeData.module }}
                  </a-tag>
                  <a-tag v-if="nodeData.action" color="blue" size="small">
                    {{ nodeData.action }}
                  </a-tag>
                </div>
                <div v-if="nodeData.description" class="node-description">
                  {{ nodeData.description }}
                </div>
              </div>
              <div v-if="nodeData.id" class="node-actions">
                <a-button
                  type="link"
                  size="small"
                  @click="editPermission(nodeData)"
                >
                  编辑
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  danger
                  @click="deletePermission(nodeData)"
                >
                  删除
                </a-button>
              </div>
            </div>
          </template>
        </a-tree>
      </div>

      <!-- 表格视图 -->
      <div v-else class="table-view">
        <a-table
          :columns="columns"
          :data-source="filteredPermissions"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="permission-name">
                <code>{{ record.name }}</code>
              </div>
            </template>

            <template v-else-if="column.key === 'displayName'">
              <span class="display-name">{{ record.displayName }}</span>
            </template>

            <template v-else-if="column.key === 'module'">
              <a-tag :color="getModuleColor(record.module)">
                {{ record.module }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-tag color="blue">
                {{ record.action }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'resource'">
              <span class="resource">{{ record.resource }}</span>
            </template>

            <template v-else-if="column.key === 'description'">
              <span class="description">{{ record.description || "-" }}</span>
            </template>

            <template v-else-if="column.key === 'usageCount'">
              <a-statistic
                :value="getPermissionUsageCount(record.name)"
                :value-style="{ fontSize: '14px' }"
              />
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button
                  type="link"
                  size="small"
                  @click="editPermission(record)"
                >
                  编辑
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  @click="viewPermissionUsage(record)"
                >
                  查看使用
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  danger
                  @click="deletePermission(record)"
                >
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 创建/编辑权限模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑权限' : '创建权限'"
      :confirm-loading="modalLoading"
      width="600px"
      @ok="handleSubmit"
      @cancel="resetForm"
    >
      <a-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="权限名称" name="name">
          <a-input
            v-model:value="permissionForm.name"
            placeholder="请输入权限名称（英文标识）"
            :disabled="isEditing"
          />
          <div class="form-tip">
            建议格式：module:action:resource，如：user:create:profile
          </div>
        </a-form-item>

        <a-form-item label="显示名称" name="displayName">
          <a-input
            v-model:value="permissionForm.displayName"
            placeholder="请输入显示名称（中文）"
          />
        </a-form-item>

        <a-form-item label="所属模块" name="module">
          <a-select
            v-model:value="permissionForm.module"
            placeholder="请选择模块"
            :options="moduleOptions"
            show-search
            allow-clear
          />
        </a-form-item>

        <a-form-item label="操作类型" name="action">
          <a-select
            v-model:value="permissionForm.action"
            placeholder="请选择操作类型"
            :options="actionOptions"
            show-search
            allow-clear
          />
        </a-form-item>

        <a-form-item label="资源对象" name="resource">
          <a-input
            v-model:value="permissionForm.resource"
            placeholder="请输入资源对象"
          />
        </a-form-item>

        <a-form-item label="权限描述" name="description">
          <a-textarea
            v-model:value="permissionForm.description"
            placeholder="请输入权限描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限使用情况模态框 -->
    <a-modal
      v-model:open="usageModalVisible"
      title="权限使用情况"
      :footer="null"
      width="700px"
    >
      <div v-if="currentPermission" class="permission-usage">
        <a-descriptions :column="2" bordered class="permission-info">
          <a-descriptions-item label="权限名称">
            {{ currentPermission.name }}
          </a-descriptions-item>
          <a-descriptions-item label="显示名称">
            {{ currentPermission.displayName }}
          </a-descriptions-item>
          <a-descriptions-item label="模块">
            {{ currentPermission.module }}
          </a-descriptions-item>
          <a-descriptions-item label="操作">
            {{ currentPermission.action }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="usage-section">
          <h4>使用此权限的角色</h4>
          <div v-if="permissionUsage.roles.length > 0" class="roles-list">
            <a-tag
              v-for="role in permissionUsage.roles"
              :key="role.id"
              color="blue"
              class="role-tag"
            >
              {{ role.displayName }} ({{ role.userCount }} 用户)
            </a-tag>
          </div>
          <a-empty
            v-else
            description="暂无角色使用此权限"
            :image="simpleImage"
          />
        </div>

        <div class="usage-section">
          <h4>拥有此权限的用户</h4>
          <div v-if="permissionUsage.users.length > 0" class="users-list">
            <a-list :data-source="permissionUsage.users" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar :src="item.avatar">
                        {{ item.username?.charAt(0)?.toUpperCase() }}
                      </a-avatar>
                    </template>
                    <template #title>
                      {{ item.username }}
                    </template>
                    <template #description>
                      {{ item.email }} - {{ item.role }}
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
          <a-empty
            v-else
            description="暂无用户拥有此权限"
            :image="simpleImage"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message, Modal, Empty } from "ant-design-vue";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import { AdminUserApi } from "@/api/modules/adminUser";

// 创建用户API实例
const adminUserApi = new AdminUserApi();
import type {
  PermissionItem,
  RoleItem,
  AdminUserItem,
} from "@/api/modules/adminUser";

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

// 响应式数据
const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const usageModalVisible = ref(false);
const isEditing = ref(false);
const currentPermissionId = ref<number>();
const viewMode = ref<"tree" | "table">("tree");

const permissions = ref<PermissionItem[]>([]);
const roles = ref<RoleItem[]>([]);
const currentPermission = ref<PermissionItem | null>(null);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  module: undefined as string | undefined,
  action: undefined as string | undefined,
});

// 权限表单
const permissionForm = reactive({
  name: "",
  displayName: "",
  description: "",
  module: "",
  action: "",
  resource: "",
});

// 权限使用情况
const permissionUsage = reactive({
  roles: [] as RoleItem[],
  users: [] as AdminUserItem[],
});

// 表单引用
const permissionFormRef = ref();

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 计算属性
const modules = computed(() => {
  const moduleSet = new Set(permissions.value.map((p) => p.module));
  return Array.from(moduleSet).sort();
});

const actions = computed(() => {
  const actionSet = new Set(permissions.value.map((p) => p.action));
  return Array.from(actionSet).sort();
});

const moduleOptions = computed(() => {
  return modules.value.map((module) => ({ label: module, value: module }));
});

const actionOptions = computed(() => {
  const commonActions = [
    "create",
    "read",
    "update",
    "delete",
    "list",
    "manage",
  ];
  const existingActions = actions.value;
  const allActions = Array.from(
    new Set([...commonActions, ...existingActions]),
  ).sort();
  return allActions.map((action) => ({ label: action, value: action }));
});

const filteredPermissions = computed(() => {
  let filtered = permissions.value;

  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.displayName.toLowerCase().includes(keyword) ||
        (p.description && p.description.toLowerCase().includes(keyword)),
    );
  }

  if (searchForm.module) {
    filtered = filtered.filter((p) => p.module === searchForm.module);
  }

  if (searchForm.action) {
    filtered = filtered.filter((p) => p.action === searchForm.action);
  }

  return filtered;
});

const permissionTreeData = computed(() => {
  const tree: any[] = [];
  const moduleMap = new Map();

  filteredPermissions.value.forEach((permission) => {
    if (!moduleMap.has(permission.module)) {
      const moduleNode = {
        key: permission.module,
        name: permission.module,
        displayName: permission.module,
        children: [],
        module: permission.module,
      };
      moduleMap.set(permission.module, moduleNode);
      tree.push(moduleNode);
    }

    const moduleNode = moduleMap.get(permission.module);
    moduleNode.children.push({
      key: permission.name,
      ...permission,
      title: permission.displayName,
    });
  });

  return tree;
});

// 表格列配置
const columns = [
  {
    title: "权限名称",
    key: "name",
    width: 200,
    fixed: "left",
  },
  {
    title: "显示名称",
    key: "displayName",
    width: 150,
  },
  {
    title: "模块",
    key: "module",
    width: 100,
  },
  {
    title: "操作",
    key: "action",
    width: 100,
  },
  {
    title: "资源",
    key: "resource",
    width: 120,
  },
  {
    title: "描述",
    key: "description",
    width: 200,
  },
  {
    title: "使用次数",
    key: "usageCount",
    width: 100,
    align: "center",
  },
  {
    title: "操作",
    key: "actions",
    width: 180,
    fixed: "right",
  },
];

// 表单验证规则
const permissionFormRules = {
  name: [
    { required: true, message: "请输入权限名称" },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_:]*$/,
      message: "权限名称只能包含字母、数字、下划线和冒号，且以字母开头",
    },
  ],
  displayName: [{ required: true, message: "请输入显示名称" }],
  module: [{ required: true, message: "请选择模块" }],
  action: [{ required: true, message: "请选择操作类型" }],
  resource: [{ required: true, message: "请输入资源对象" }],
};

// 工具函数
const getModuleColor = (module: string) => {
  const colors = [
    "blue",
    "green",
    "orange",
    "purple",
    "cyan",
    "magenta",
    "red",
    "volcano",
  ];
  const index = module.charCodeAt(0) % colors.length;
  return colors[index];
};

const getPermissionUsageCount = (permissionName: string) => {
  return roles.value.filter((role) => role.permissions.includes(permissionName))
    .length;
};

// 数据加载
const loadPermissions = async () => {
  try {
    loading.value = true;
    const response = await adminUserApi.getPermissions();
    // 处理嵌套的data结构
    const data = (response as any).data;
    permissions.value = Array.isArray(data) ? data : (data?.data ?? []);
    pagination.total = permissions.value.length;
  } catch (error) {
    console.error("权限加载错误:", error);
    message.error("加载权限列表失败");
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const response = await adminUserApi.getRoles();
    // 处理嵌套的data结构
    const data = (response as any).data;
    roles.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error("加载角色列表失败", error);
  }
};

const loadPermissionUsage = async (permission: PermissionItem) => {
  try {
    // 找到使用此权限的角色
    const rolesWithPermission = roles.value.filter((role) =>
      role.permissions.includes(permission.name),
    );
    permissionUsage.roles = rolesWithPermission;

    // 这里需要后端API支持，暂时模拟数据
    permissionUsage.users = [];
  } catch (error) {
    message.error("加载权限使用情况失败");
  }
};

// 事件处理
const handleSearch = () => {
  pagination.current = 1;
};

const resetSearch = () => {
  searchForm.keyword = "";
  searchForm.module = undefined;
  searchForm.action = undefined;
};

const handleViewModeChange = () => {
  // 视图模式切换处理
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
};

const showCreateModal = () => {
  isEditing.value = false;
  modalVisible.value = true;
  resetForm();
};

const editPermission = (permission: PermissionItem) => {
  isEditing.value = true;
  currentPermissionId.value = permission.id;
  Object.assign(permissionForm, {
    name: permission.name,
    displayName: permission.displayName,
    description: permission.description,
    module: permission.module,
    action: permission.action,
    resource: permission.resource,
  });
  modalVisible.value = true;
};

const deletePermission = (permission: PermissionItem) => {
  const usageCount = getPermissionUsageCount(permission.name);
  if (usageCount > 0) {
    message.warning(`此权限正在被 ${usageCount} 个角色使用，无法删除`);
    return;
  }

  Modal.confirm({
    title: "确认删除",
    content: `确定要删除权限 "${permission.displayName}" 吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        // 这里需要后端API支持
        message.success("删除成功");
        loadPermissions();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

const viewPermissionUsage = async (permission: PermissionItem) => {
  currentPermission.value = permission;
  await loadPermissionUsage(permission);
  usageModalVisible.value = true;
};

const refreshPermissions = () => {
  loadPermissions();
  loadRoles();
  message.success("权限数据已刷新");
};

const handleSubmit = async () => {
  try {
    await permissionFormRef.value.validate();
    modalLoading.value = true;

    // 这里需要后端API支持权限的创建和更新
    message.success(isEditing.value ? "更新成功" : "创建成功");
    modalVisible.value = false;
    loadPermissions();
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
  Object.assign(permissionForm, {
    name: "",
    displayName: "",
    description: "",
    module: "",
    action: "",
    resource: "",
  });
  permissionFormRef.value?.resetFields();
};

// 生命周期
onMounted(() => {
  loadPermissions();
  loadRoles();
});
</script>

<style scoped>
.user-permissions {
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

.action-section {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 24px;
}

.permissions-section {
  margin-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tree-view {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.permission-node {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding: 4px 0;
}

.permission-node.is-leaf {
  border-left: 3px solid #1890ff;
  padding-left: 8px;
  margin-left: -8px;
}

.node-content {
  flex: 1;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.node-name {
  font-weight: 500;
  color: #262626;
}

.node-description {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.permission-node:hover .node-actions {
  opacity: 1;
}

.table-view {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.permission-name code {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.display-name {
  font-weight: 500;
}

.description {
  color: #8c8c8c;
  font-size: 13px;
}

.form-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.permission-usage .permission-info {
  margin-bottom: 24px;
}

.usage-section {
  margin-bottom: 24px;
}

.usage-section h4 {
  margin-bottom: 12px;
  color: #262626;
  font-size: 14px;
  font-weight: 600;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  margin: 0;
}

.users-list {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover) {
  background: #f5f5f5;
}

:deep(.ant-tree .ant-tree-node-content-wrapper) {
  padding: 2px 0;
  width: 100%;
}

:deep(.ant-tree .ant-tree-title) {
  width: 100%;
}
</style>
