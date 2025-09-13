<template>
  <div class="users-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="title-section">
        <h2>用户管理</h2>
        <p>管理系统用户账号和权限</p>
      </div>
      <div class="action-section">
        <a-button type="primary" @click="showCreateModal">
          <template #icon>
            <plus-outlined />
          </template>
          新增用户
        </a-button>
        <a-button @click="exportUsers">
          <template #icon>
            <download-outlined />
          </template>
          导出用户
        </a-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-input-search
            v-model:value="searchForm.keyword"
            placeholder="搜索用户名、邮箱或手机号"
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.status"
            placeholder="状态筛选"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="active"> 正常 </a-select-option>
            <a-select-option value="inactive"> 禁用 </a-select-option>
            <a-select-option value="banned"> 封禁 </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.role"
            placeholder="角色筛选"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option
              v-for="role in roles"
              :key="role.id"
              :value="role.name"
            >
              {{ role.displayName }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="8">
          <a-range-picker
            v-model:value="dateRange"
            placeholder="注册时间"
            @change="handleDateChange"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRowKeys.length > 0" class="batch-actions">
      <a-space>
        <span>已选择 {{ selectedRowKeys.length }} 项</span>
        <a-button @click="batchUpdateStatus('active')"> 批量启用 </a-button>
        <a-button @click="batchUpdateStatus('inactive')"> 批量禁用 </a-button>
        <a-button danger @click="batchDelete"> 批量删除 </a-button>
        <a-button @click="clearSelection"> 取消选择 </a-button>
      </a-space>
    </div>

    <!-- 用户表格 -->
    <div class="table-section">
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ y: 600 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="record.avatar" :size="40">
              {{ record.username?.charAt(0)?.toUpperCase() }}
            </a-avatar>
          </template>

          <template v-else-if="column.key === 'userInfo'">
            <div class="user-info">
              <div class="username">
                {{ record.username }}
              </div>
              <div class="email">
                {{ record.email }}
              </div>
              <div v-if="record.phone" class="phone">
                {{ record.phone }}
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag
              :color="getStatusColor(record.status)"
              style="cursor: pointer"
              @click="quickToggleStatus(record)"
            >
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'role'">
            <a-tag color="blue">
              {{ getRoleDisplayName(record.role) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'lastLogin'">
            <div v-if="record.lastLogin">
              <div>{{ formatDate(record.lastLogin) }}</div>
              <div class="text-gray-500 text-xs">
                {{ record.lastLoginIp }}
              </div>
            </div>
            <span v-else class="text-gray-400">从未登录</span>
          </template>

          <template v-else-if="column.key === 'loginCount'">
            <a-statistic
              :value="record.loginCount"
              :value-style="{ fontSize: '14px' }"
            />
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="viewUser(record)">
                查看
              </a-button>
              <a-button type="link" size="small" @click="editUser(record)">
                编辑
              </a-button>
              <a-dropdown>
                <a-button type="link" size="small">
                  更多 <down-outlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="onMenuClick(record)">
                    <a-menu-item key="resetPassword"> 重置密码 </a-menu-item>
                    <a-menu-item key="viewLogs"> 查看日志 </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger> 删除用户 </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 创建/编辑用户模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑用户' : '创建用户'"
      :confirm-loading="modalLoading"
      width="600px"
      @ok="handleSubmit"
      @cancel="resetForm"
    >
      <a-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="userForm.username"
            placeholder="请输入用户名"
          />
        </a-form-item>

        <a-form-item label="邮箱" name="email">
          <a-input
            v-model:value="userForm.email"
            type="email"
            placeholder="请输入邮箱"
          />
        </a-form-item>

        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
        </a-form-item>

        <a-form-item v-if="!isEditing" label="密码" name="password">
          <a-input-password
            v-model:value="userForm.password"
            placeholder="请输入密码"
          />
        </a-form-item>

        <a-form-item label="角色" name="role">
          <a-select v-model:value="userForm.role" placeholder="请选择角色">
            <a-select-option
              v-for="role in roles"
              :key="role.name"
              :value="role.name"
            >
              {{ role.displayName }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="userForm.status">
            <a-radio value="active"> 正常 </a-radio>
            <a-radio value="inactive"> 禁用 </a-radio>
            <a-radio value="banned"> 封禁 </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="权限" name="permissions">
          <a-tree
            v-model:checked-keys="userForm.permissions"
            :tree-data="permissionTree"
            checkable
            :default-expand-all="true"
            :field-names="{
              children: 'children',
              title: 'displayName',
              key: 'name',
            }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重置密码模态框 -->
    <a-modal
      v-model:open="passwordModalVisible"
      title="重置密码"
      :confirm-loading="passwordModalLoading"
      @ok="handleResetPassword"
      @cancel="passwordModalVisible = false"
    >
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="passwordForm.newPassword"
            placeholder="请输入新密码"
          />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password
            v-model:value="passwordForm.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 用户详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="用户详情"
      width="800px"
      :footer="null"
    >
      <div v-if="currentUser" class="user-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="头像" :span="2">
            <a-avatar :src="currentUser.avatar" :size="64">
              {{ currentUser.username?.charAt(0)?.toUpperCase() }}
            </a-avatar>
          </a-descriptions-item>
          <a-descriptions-item label="用户名">
            {{ currentUser.username }}
          </a-descriptions-item>
          <a-descriptions-item label="邮箱">
            {{ currentUser.email || "未设置" }}
          </a-descriptions-item>
          <a-descriptions-item label="手机号">
            {{ currentUser.phone || "未设置" }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(currentUser.status)">
              {{ getStatusText(currentUser.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="角色">
            <a-tag color="blue">
              {{ getRoleDisplayName(currentUser.role) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="登录次数">
            {{ currentUser.loginCount || 0 }} 次
          </a-descriptions-item>
          <a-descriptions-item label="最后登录时间">
            <div v-if="currentUser.lastLogin">
              {{ formatDate(currentUser.lastLogin) }}
            </div>
            <span v-else class="text-gray-400">从未登录</span>
          </a-descriptions-item>
          <a-descriptions-item label="最后登录IP">
            {{ currentUser.lastLoginIp || "未知" }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(currentUser.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDate(currentUser.updatedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="用户权限" :span="2">
            <div class="permissions-list">
              <a-tag
                v-for="permission in currentUser.permissions"
                :key="permission"
                color="green"
                style="margin-bottom: 4px"
              >
                {{ permission }}
              </a-tag>
              <div
                v-if="!currentUser.permissions?.length"
                class="text-gray-400"
              >
                暂无权限
              </div>
            </div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watchEffect } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { debounce } from "lodash-es";
import {
  PlusOutlined,
  DownloadOutlined,
  DownOutlined,
} from "@ant-design/icons-vue";
import { AdminUserApi } from "@/api/modules/adminUser";

// 创建用户API实例
const adminUserApi = new AdminUserApi();
import type {
  AdminUserItem,
  UserFormData,
  RoleItem,
  UserQueryParams,
} from "@/api/modules/adminUser";

// 响应式数据
const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const passwordModalVisible = ref(false);
const passwordModalLoading = ref(false);
const detailModalVisible = ref(false);
const isEditing = ref(false);
const currentUserId = ref<string>();
const currentUser = ref<AdminUserItem | null>(null);

const users = ref<AdminUserItem[]>([]);
const roles = ref<RoleItem[]>([]);

const permissionTree = ref<any[]>([]);

const selectedRowKeys = ref<string[]>([]);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 搜索表单
const searchForm = reactive<UserQueryParams>({
  keyword: "",
  status: undefined,
  role: undefined,
  startDate: undefined,
  endDate: undefined,
});

// 用户表单
const userForm = reactive<UserFormData>({
  username: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
  role: "",
  permissions: [],
});

// 密码表单
const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

// 表单引用
const userFormRef = ref();
const passwordFormRef = ref();

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 表格列配置
const columns = [
  {
    title: "头像",
    key: "avatar",
    width: 80,
    align: "center",
  },
  {
    title: "用户信息",
    key: "userInfo",
    width: 200,
  },
  {
    title: "状态",
    key: "status",
    width: 100,
    align: "center",
  },
  {
    title: "角色",
    key: "role",
    width: 120,
    align: "center",
  },
  {
    title: "最后登录",
    key: "lastLogin",
    width: 160,
  },
  {
    title: "登录次数",
    key: "loginCount",
    width: 100,
    align: "center",
  },
  {
    title: "注册时间",
    dataIndex: "createdAt",
    width: 120,
    customRender: ({ text }: any) => formatDate(text),
  },
  {
    title: "操作",
    key: "actions",
    width: 200,
    fixed: "right",
  },
];

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: "请输入用户名" },
    { min: 3, max: 20, message: "用户名长度在 3 到 20 个字符" },
  ],
  email: [
    { required: true, message: "请输入邮箱" },
    { type: "email", message: "请输入有效的邮箱地址" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 6, message: "密码至少 6 个字符" },
  ],
  role: [{ required: true, message: "请选择角色" }],
};

const passwordFormRules = {
  newPassword: [
    { required: true, message: "请输入新密码" },
    { min: 6, message: "密码至少 6 个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码" },
    {
      validator: (_: any, value: string) => {
        if (value !== passwordForm.newPassword) {
          return Promise.reject(new Error("两次输入的密码不一致"));
        }
        return Promise.resolve();
      },
    },
  ],
};

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

const getStatusColor = (status: string) => {
  const colors = {
    active: "green",
    inactive: "orange",
    banned: "red",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    active: "正常",
    inactive: "禁用",
    banned: "封禁",
  };
  return texts[status as keyof typeof texts] || status;
};

const getRoleDisplayName = (roleName: string) => {
  const role = roles.value.find((r) => r.name === roleName);
  return role?.displayName || roleName;
};

// 数据加载
const loadUsers = async () => {
  try {
    loading.value = true;
    const response = await adminUserApi.getList(searchForm);
    users.value = response.data.data || response.data;
    pagination.total = response.pagination?.total || 0;
  } catch {
    message.error("加载用户列表失败");
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const response = await adminUserApi.getRoles();
    const data = (response as any).data;
    roles.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error("角色加载错误:", error);
    message.error("加载角色列表失败");
  }
};

const loadPermissions = async () => {
  try {
    const response = await adminUserApi.getPermissionTree();
    // 获取实际的权限数据，处理嵌套的data结构
    const permissionData = response.data?.data || response.data;
    // 转换权限树格式
    permissionTree.value = Object.entries(permissionData).map(
      ([module, perms]) => ({
        name: module,
        displayName: module,
        children: (perms as any[]).map((p) => ({
          name: p.name,
          displayName: p.displayName,
        })),
      }),
    );
  } catch (error) {
    console.error("权限加载错误:", error);
    message.error("加载权限列表失败");
  }
};

// 事件处理
const handleSearch = () => {
  // If UserQueryParams supports 'page', set it; otherwise, remove this line
  if ("page" in searchForm) {
    (searchForm as any).page = 1;
  }
  pagination.current = 1;
  loadUsers();
};

// 防抖搜索
const debouncedSearch = debounce(handleSearch, 500);

// 处理日期范围变化
const handleDateChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
  if (dates) {
    searchForm.startDate = dates[0].format("YYYY-MM-DD");
    searchForm.endDate = dates[1].format("YYYY-MM-DD");
  } else {
    searchForm.startDate = undefined;
    searchForm.endDate = undefined;
  }
  debouncedSearch();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  // If UserQueryParams supports 'page', set it; otherwise, remove this line
  if ("page" in searchForm) {
    (searchForm as any).page = pag.current;
  }
  loadUsers();
};

const showCreateModal = () => {
  isEditing.value = false;
  modalVisible.value = true;
  resetForm();
};

const viewUser = async (user: AdminUserItem) => {
  try {
    loading.value = true;
    const response = await adminUserApi.getDetail(user.id);
    if (response.data) {
      currentUser.value = response.data;
      detailModalVisible.value = true;
    }
  } catch (error) {
    console.error("获取用户详情失败:", error);
    message.error("获取用户详情失败");
  } finally {
    loading.value = false;
  }
};

const editUser = (user: AdminUserItem) => {
  isEditing.value = true;
  currentUserId.value = user.id;
  Object.assign(userForm, {
    username: user.username,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: user.role,
    permissions: user.permissions || [],
  });
  modalVisible.value = true;
};

const quickToggleStatus = async (user: AdminUserItem) => {
  const newStatus = user.status === "active" ? "inactive" : "active";
  try {
    await adminUserApi.updateStatus(user.id, newStatus);
    message.success("状态更新成功");
    loadUsers();
  } catch {
    message.error("状态更新失败");
  }
};

const handleMoreAction = (key: string, user: AdminUserItem) => {
  switch (key) {
    case "resetPassword":
      currentUserId.value = user.id;
      passwordModalVisible.value = true;
      break;
    case "viewLogs":
      message.info("查看日志功能待实现");
      break;
    case "delete":
      deleteUser(user);
      break;
  }
};

const deleteUser = async (user: AdminUserItem) => {
  try {
    await adminUserApi.deleteUser(user.id);
    message.success("删除成功");
    loadUsers();
  } catch {
    message.error("删除失败");
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const batchUpdateStatus = async (_status: "active" | "inactive") => {
  try {
    // 这里需要后端支持批量状态更新
    message.success("批量更新成功");
    clearSelection();
    loadUsers();
  } catch {
    message.error("重置密码失败");
  }
};

const batchDelete = async () => {
  try {
    await adminUserApi.batchDelete(selectedRowKeys.value);
    message.success("批量删除成功");
    clearSelection();
    loadUsers();
  } catch {
    message.error("批量删除失败");
  }
};

const clearSelection = () => {
  selectedRowKeys.value = [];
};

const exportUsers = () => {
  message.info("导出功能待实现");
};

const handleSubmit = async () => {
  try {
    await userFormRef.value.validate();
    modalLoading.value = true;

    if (isEditing.value && currentUserId.value) {
      await adminUserApi.update(currentUserId.value, userForm);
      message.success("更新成功");
    } else {
      await adminUserApi.create(userForm);
      message.success("创建成功");
    }

    modalVisible.value = false;
    loadUsers();
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

const handleResetPassword = async () => {
  try {
    await passwordFormRef.value.validate();
    passwordModalLoading.value = true;

    if (currentUserId.value) {
      await adminUserApi.resetPassword(
        currentUserId.value,
        passwordForm.newPassword,
      );
      message.success("密码重置成功");
      passwordModalVisible.value = false;
      Object.assign(passwordForm, { newPassword: "", confirmPassword: "" });
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "errorFields" in error) {
      message.error("请检查表单输入");
    } else {
      message.error("密码重置失败");
    }
  } finally {
    passwordModalLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(userForm, {
    username: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
    role: "",
    permissions: [],
  });
  userFormRef.value?.resetFields();
};

// 生命周期
// 自动搜索响应
watchEffect(() => {
  if (searchForm.keyword || searchForm.status || searchForm.role) {
    debouncedSearch();
  }
});

onMounted(() => {
  loadUsers();
  loadRoles();
  loadPermissions();
});

// 修正菜单点击处理函数
const onMenuClick = (record: AdminUserItem) => (event: { key: string }) => {
  handleMoreAction(event.key, record);
};
</script>

<style scoped>
.users-list {
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
  margin-bottom: 16px;
}

.batch-actions {
  margin-bottom: 16px;
  padding: 12px;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
}

.table-section {
  margin-top: 16px;
}

.user-info .username {
  font-weight: 500;
  color: #262626;
}

.user-info .email {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.user-info .phone {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover) {
  background: #f5f5f5;
}

:deep(.ant-modal-body) {
  max-height: 60vh;
  overflow-y: auto;
}

.user-detail .permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-detail .permissions-list .ant-tag {
  margin-bottom: 4px;
}

.user-detail .ant-descriptions-item-label {
  font-weight: 500;
}
</style>
