<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <a-button type="primary" @click="showModal">
        <template #icon><plus-outlined /></template>
        添加用户
      </a-button>
    </div>

    <a-card>
      <template #extra>
        <div class="table-toolbar">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索用户名或单位"
            style="width: 250px"
            @search="onSearch"
          />
          <a-select
            v-model:value="filterRole"
            style="width: 120px; margin-left: 16px"
            placeholder="角色筛选"
            @change="onRoleChange"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="teacher">教师</a-select-option>
            <a-select-option value="student">学生</a-select-option>
          </a-select>
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a @click="handleResetPassword(record)">重置密码</a>
              <a-divider type="vertical" />
              <a-popconfirm
                v-if="record.role !== 'admin'"
                title="确定要删除该用户吗？"
                @confirm="() => handleDelete(record)"
              >
                <a class="delete-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-tag :color="getRoleColor(record.role)">
              {{ getRoleText(record.role) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              @change="(checked) => handleStatusChange(record, checked)"
            />
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑用户模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      width="600px"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="formState.username"
            placeholder="请输入用户名"
            :disabled="modalTitle === '编辑用户'"
          />
        </a-form-item>
        <template v-if="modalTitle === '添加用户'">
          <a-form-item label="密码" name="password">
            <a-input-password
              v-model:value="formState.password"
              placeholder="请输入密码"
            />
          </a-form-item>
          <a-form-item label="确认密码" name="confirmPassword">
            <a-input-password
              v-model:value="formState.confirmPassword"
              placeholder="请再次输入密码"
            />
          </a-form-item>
        </template>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="formState.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="teacher">教师</a-select-option>
            <a-select-option value="student">学生</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="姓名" name="realName">
          <a-input
            v-model:value="formState.realName"
            placeholder="请输入姓名"
          />
        </a-form-item>
        <a-form-item label="联系电话" name="phone">
          <a-input
            v-model:value="formState.phone"
            placeholder="请输入联系电话"
          />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="所属单位" name="unit">
          <a-input
            v-model:value="formState.unit"
            placeholder="请输入所属单位"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重置密码模态框 -->
    <a-modal
      v-model:visible="resetPasswordVisible"
      title="重置密码"
      @ok="handleResetPasswordOk"
      @cancel="handleResetPasswordCancel"
    >
      <a-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="新密码" name="password">
          <a-input-password
            v-model:value="resetPasswordForm.password"
            placeholder="请输入新密码"
          />
        </a-form-item>
        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password
            v-model:value="resetPasswordForm.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";

// 表格列定义
const columns = [
  {
    title: "用户名",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "姓名",
    dataIndex: "realName",
    key: "realName",
  },
  {
    title: "角色",
    dataIndex: "role",
    key: "role",
  },
  {
    title: "所属单位",
    dataIndex: "unit",
    key: "unit",
  },
  {
    title: "联系电话",
    dataIndex: "phone",
    key: "phone",
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: "100px",
  },
  {
    title: "操作",
    key: "action",
    width: "220px",
  },
];

// 表格数据
const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 搜索和筛选
const searchKeyword = ref("");
const filterRole = ref("");

// 获取表格数据
const fetchTableData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    tableData.value = [
      {
        id: 1,
        username: "admin",
        realName: "管理员",
        role: "admin",
        unit: "系统管理部",
        phone: "13800138000",
        email: "admin@example.com",
        status: "active",
      },
      {
        id: 2,
        username: "teacher1",
        realName: "张教授",
        role: "teacher",
        unit: "山东大学马克思主义学院",
        phone: "13800138001",
        email: "teacher1@example.com",
        status: "active",
      },
    ];
    pagination.total = 100;
  } catch (error) {
    message.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 角色相关
const getRoleColor = (role) => {
  const colors = {
    admin: "red",
    teacher: "blue",
    student: "green",
  };
  return colors[role] || "default";
};

const getRoleText = (role) => {
  const texts = {
    admin: "管理员",
    teacher: "教师",
    student: "学生",
  };
  return texts[role] || role;
};

// 搜索和筛选处理
const onSearch = (value) => {
  pagination.current = 1;
  searchKeyword.value = value;
  fetchTableData();
};

const onRoleChange = () => {
  pagination.current = 1;
  fetchTableData();
};

// 表格变化处理
const handleTableChange = (pag, filters, sorter) => {
  console.log("table change:", pag, filters, sorter);
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchTableData();
};

// 状态切换处理
const handleStatusChange = async (record, checked) => {
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success(`已${checked ? "启用" : "禁用"}用户: ${record.username}`);
    fetchTableData();
  } catch (error) {
    message.error("操作失败");
  }
};

// 用户表单相关
const modalVisible = ref(false);
const modalTitle = ref("添加用户");
const formRef = ref(null);
const formState = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  role: undefined,
  realName: "",
  phone: "",
  email: "",
  unit: "",
});

const validateConfirmPassword = async (rule, value) => {
  if (value && value !== formState.password) {
    throw new Error("两次输入的密码不一致");
  }
};

const rules = {
  username: [
    { required: true, message: "请输入用户名" },
    { min: 4, message: "用户名至少4个字符" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 6, message: "密码至少6个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码" },
    { validator: validateConfirmPassword },
  ],
  role: [{ required: true, message: "请选择角色" }],
  realName: [{ required: true, message: "请输入姓名" }],
  phone: [{ required: true, message: "请输入联系电话" }],
  email: [
    { required: true, message: "请输入邮箱" },
    { type: "email", message: "请输入正确的邮箱格式" },
  ],
  unit: [{ required: true, message: "请输入所属单位" }],
};

const showModal = () => {
  modalTitle.value = "添加用户";
  Object.keys(formState).forEach((key) => {
    formState[key] = "";
  });
  formState.role = undefined;
  modalVisible.value = true;
};

const handleModalOk = () => {
  formRef.value
    .validate()
    .then(() => {
      // 在这里处理表单提交
      console.log("form values:", formState);
      modalVisible.value = false;
      message.success("操作成功");
      fetchTableData();
    })
    .catch((error) => {
      console.log("validation failed:", error);
    });
};

const handleModalCancel = () => {
  modalVisible.value = false;
};

const handleEdit = (record) => {
  modalTitle.value = "编辑用户";
  Object.assign(formState, record);
  modalVisible.value = true;
};

const handleDelete = (record) => {
  console.log("delete record:", record);
  message.success("删除成功");
  fetchTableData();
};

// 重置密码相关
const resetPasswordVisible = ref(false);
const resetPasswordFormRef = ref(null);
const currentUserId = ref(null);
const resetPasswordForm = reactive({
  password: "",
  confirmPassword: "",
});

const resetPasswordRules = {
  password: [
    { required: true, message: "请输入新密码" },
    { min: 6, message: "密码至少6个字符" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码" },
    {
      validator: async (rule, value) => {
        if (value && value !== resetPasswordForm.password) {
          throw new Error("两次输入的密码不一致");
        }
      },
    },
  ],
};

const handleResetPassword = (record) => {
  currentUserId.value = record.id;
  resetPasswordForm.password = "";
  resetPasswordForm.confirmPassword = "";
  resetPasswordVisible.value = true;
};

const handleResetPasswordOk = () => {
  resetPasswordFormRef.value
    .validate()
    .then(() => {
      // 在这里处理密码重置
      console.log("reset password for user:", currentUserId.value);
      resetPasswordVisible.value = false;
      message.success("密码重置成功");
    })
    .catch((error) => {
      console.log("validation failed:", error);
    });
};

const handleResetPasswordCancel = () => {
  resetPasswordVisible.value = false;
};

onMounted(() => {
  fetchTableData();
});
</script>

<style scoped>
.users-management {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.table-toolbar {
  display: flex;
  align-items: center;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  color: #ff7875;
}
</style>
