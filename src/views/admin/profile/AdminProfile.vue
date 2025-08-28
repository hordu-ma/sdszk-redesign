<template>
  <div class="admin-profile">
    <a-card title="管理员个人资料" class="profile-card">
      <template #extra>
        <a-button v-if="!isEditing" type="primary" @click="startEdit">
          <template #icon>
            <edit-outlined />
          </template>
          编辑资料
        </a-button>
        <a-space v-else>
          <a-button @click="cancelEdit"> 取消 </a-button>
          <a-button type="primary" @click="saveProfile" :loading="saving">
            保存
          </a-button>
        </a-space>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <a-avatar :size="80" :src="formData.avatar" class="user-avatar">
            {{ formData.username?.charAt(0)?.toUpperCase() }}
          </a-avatar>
          <div class="avatar-info">
            <h3>{{ formData.username }}</h3>
            <a-tag color="blue"> 管理员 </a-tag>
            <p class="join-time">
              加入时间:
              {{ userInfo.createdAt ? formatDate(userInfo.createdAt) : "未知" }}
            </p>
          </div>
        </div>

        <!-- 基本信息 -->
        <a-divider />
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="用户名">
              <a-input
                v-if="isEditing"
                v-model:value="formData.username"
                placeholder="请输入用户名"
              />
              <span v-else>{{ userInfo.username }}</span>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="姓名">
              <a-input
                v-if="isEditing"
                v-model:value="formData.name"
                placeholder="请输入真实姓名"
              />
              <span v-else>{{ userInfo.name || "未设置" }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input
                v-if="isEditing"
                v-model:value="formData.email"
                placeholder="请输入邮箱"
              />
              <span v-else>{{ userInfo.email || "未设置" }}</span>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input
                v-if="isEditing"
                v-model:value="formData.phone"
                placeholder="请输入手机号"
              />
              <span v-else>{{ userInfo.phone || "未设置" }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 权限信息 -->
        <a-divider />
        <div class="permissions-section">
          <h4>权限信息</h4>
          <a-space wrap>
            <a-tag
              v-for="permission in userPermissions"
              :key="permission"
              color="green"
            >
              {{ permission }}
            </a-tag>
          </a-space>
        </div>

        <!-- 登录信息 -->
        <a-divider />
        <div class="login-info">
          <h4>登录信息</h4>
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="上次登录时间">
              {{
                userInfo.lastLoginAt
                  ? formatDate(userInfo.lastLoginAt)
                  : "未记录"
              }}
            </a-descriptions-item>
            <a-descriptions-item label="登录IP">
              {{ userInfo.lastLoginIp || "未记录" }}
            </a-descriptions-item>
            <a-descriptions-item label="登录次数">
              {{ userInfo.loginCount || 0 }} 次
            </a-descriptions-item>
            <a-descriptions-item label="账户状态">
              <a-tag
                :color="userInfo.status === 'active' ? 'success' : 'error'"
              >
                {{ userInfo.status === "active" ? "正常" : "禁用" }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
    </a-card>

    <!-- 修改密码卡片 -->
    <a-card title="安全设置" class="security-card" style="margin-top: 24px">
      <div class="security-item">
        <div class="security-info">
          <h4>登录密码</h4>
          <p>定期更换密码，保护账户安全</p>
        </div>
        <a-button type="primary" @click="showPasswordModal = true">
          修改密码
        </a-button>
      </div>
    </a-card>

    <!-- 修改密码模态框 -->
    <a-modal
      v-model:visible="showPasswordModal"
      title="修改密码"
      :confirm-loading="changingPassword"
      @ok="changePassword"
      @cancel="resetPasswordForm"
    >
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
      >
        <a-form-item label="当前密码" name="oldPassword">
          <a-input-password
            v-model:value="passwordForm.oldPassword"
            placeholder="请输入当前密码"
          />
        </a-form-item>
        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="passwordForm.newPassword"
            placeholder="请输入新密码"
          />
        </a-form-item>
        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password
            v-model:value="passwordForm.confirmPassword"
            placeholder="请确认新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { EditOutlined } from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import type { UserInfo } from "@/stores/user";
import api from "@/utils/api";

const userStore = useUserStore();
const isEditing = ref(false);
const saving = ref(false);
const showPasswordModal = ref(false);
const changingPassword = ref(false);
const passwordFormRef = ref();

// 用户信息
const userInfo = computed(
  () => userStore.userInfo || ({} as Partial<UserInfo>),
);

// 用户权限
const userPermissions = computed(() => {
  return userStore.userInfo?.permissions || [];
});

// 表单数据
const formData = reactive({
  username: "",
  name: "",
  email: "",
  phone: "",
  avatar: "",
});

// 密码表单
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule: any, value: string) => {
        if (value !== passwordForm.newPassword) {
          return Promise.reject("两次输入的密码不一致");
        }
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
};

// 初始化表单数据
const initFormData = () => {
  formData.username = userInfo.value.username || "";
  formData.name = userInfo.value.name || "";
  formData.email = userInfo.value.email || "";
  formData.phone = userInfo.value.phone || "";
  formData.avatar = userInfo.value.avatar || "";
};

// 开始编辑
const startEdit = () => {
  isEditing.value = true;
  initFormData();
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  initFormData();
};

// 保存个人资料
const saveProfile = async () => {
  try {
    saving.value = true;

    const updateData = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: formData.avatar,
    };

    const response = await api.put("/api/auth/profile", updateData);

    if (response.data && response.status === 200) {
      message.success("个人资料更新成功");
      // 更新用户信息
      await userStore.initUserInfo();
      isEditing.value = false;
    }
  } catch (error: any) {
    console.error("更新个人资料失败:", error);
    message.error(error.response?.data?.message || "更新失败");
  } finally {
    saving.value = false;
  }
};

// 修改密码
const changePassword = async () => {
  try {
    await passwordFormRef.value.validate();
    changingPassword.value = true;

    const response = await api.put("/api/auth/change-password", {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });

    if (response.data && response.status === 200) {
      message.success("密码修改成功");
      showPasswordModal.value = false;
      resetPasswordForm();
    }
  } catch (error: any) {
    console.error("修改密码失败:", error);
    message.error(error.response?.data?.message || "修改密码失败");
  } finally {
    changingPassword.value = false;
  }
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.oldPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
  passwordFormRef.value?.resetFields();
};

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return "未记录";
  return new Date(date).toLocaleString("zh-CN");
};

onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.admin-profile {
  padding: 24px;
}

.profile-card,
.security-card {
  max-width: 800px;
  margin: 0 auto;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.join-time {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 14px;
}

.permissions-section h4,
.login-info h4 {
  margin-bottom: 16px;
  color: #333;
  font-weight: 600;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.security-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.security-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
