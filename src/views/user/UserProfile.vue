<template>
  <div class="user-profile">
    <!-- 头像上传区域 -->
    <div class="profile-header">
      <div class="avatar-section">
        <el-avatar :size="100" :src="formData.avatar" class="user-avatar">
          <i class="el-icon-user-solid"></i>
        </el-avatar>
        <el-upload
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="handleAvatarUpload"
          accept="image/*"
        >
          <el-button size="small" type="primary" plain>更换头像</el-button>
        </el-upload>
      </div>
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalViews || 0 }}</div>
          <div class="stat-label">总浏览量</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalFavorites || 0 }}</div>
          <div class="stat-label">收藏数量</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.joinDays || 0 }}</div>
          <div class="stat-label">加入天数</div>
        </div>
      </div>
    </div>

    <!-- 基本信息表单 -->
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button v-if="!isEditing" type="primary" plain size="small" @click="startEdit">
            编辑
          </el-button>
          <div v-else>
            <el-button size="small" @click="cancelEdit">取消</el-button>
            <el-button type="primary" size="small" :loading="loading" @click="saveProfile">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="100px"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" :disabled="true" placeholder="用户名不可修改" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="formData.name"
                :disabled="!isEditing"
                placeholder="请输入真实姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="formData.email"
                :disabled="!isEditing"
                placeholder="请输入邮箱地址"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="formData.phone"
                :disabled="!isEditing"
                placeholder="请输入手机号码"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select
                v-model="formData.gender"
                :disabled="!isEditing"
                placeholder="请选择性别"
                style="width: 100%"
              >
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
                <el-option label="保密" value="secret" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="formData.birthday"
                :disabled="!isEditing"
                type="date"
                placeholder="请选择生日"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="formData.bio"
            :disabled="!isEditing"
            type="textarea"
            :rows="4"
            placeholder="请输入个人简介"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="所在地区" prop="location">
          <el-input
            v-model="formData.location"
            :disabled="!isEditing"
            placeholder="请输入所在地区"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账户信息 -->
    <el-card class="profile-card">
      <template #header>
        <span>账户信息</span>
      </template>

      <div class="account-info">
        <div class="info-item">
          <span class="label">用户角色:</span>
          <el-tag :type="getRoleType(userInfo?.role)">
            {{ getRoleText(userInfo?.role) }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="label">注册时间:</span>
          <span>{{ formatDate(userInfo?.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">最后登录:</span>
          <span>{{ formatDate(userInfo?.lastLoginAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">账户状态:</span>
          <el-tag :type="userInfo?.status === 'active' ? 'success' : 'danger'">
            {{ userInfo?.status === 'active' ? '正常' : '已禁用' }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/modules/user'

// 定义扩展的用户信息接口（与 userStore.UserInfo 接口兼容）
interface ExtendedUserInfo {
  id: string
  username: string
  name: string
  avatar?: string
  email?: string
  role: 'admin' | 'editor' | 'user'
  permissions: string[]
  // 添加 UserProfile 中的额外字段
  phone?: string
  gender?: string
  birthday?: string
  bio?: string
  location?: string
  createdAt?: string
  lastLoginAt?: string
  status?: string
}

const userStore = useUserStore()

// 响应式数据
const formRef = ref<FormInstance>()
const isEditing = ref(false)
const loading = ref(false)
const userStats = ref<any>({})

// 计算属性
const userInfo = computed(() => userStore.userInfo as unknown as ExtendedUserInfo)

// 表单数据
const formData = reactive({
  username: '',
  name: '',
  email: '',
  phone: '',
  gender: '',
  birthday: '',
  bio: '',
  location: '',
  avatar: '',
})

// 原始数据备份
let originalData: any = {}

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  bio: [{ max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }],
}

// 初始化数据
const initData = () => {
  if (userInfo.value) {
    Object.assign(formData, {
      username: userStore.userInfo?.username || '',
      name: userStore.userInfo?.name || '',
      email: userStore.userInfo?.email || '',
      phone: userInfo.value.phone || '',
      gender: userInfo.value.gender || '',
      birthday: userInfo.value.birthday || '',
      bio: userInfo.value.bio || '',
      location: userInfo.value.location || '',
      avatar: userStore.userInfo?.avatar || '',
    })
    // 备份原始数据
    originalData = { ...formData }
  }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  Object.assign(formData, originalData)
  isEditing.value = false
}

// 保存资料
const saveProfile = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        const updateData = { ...formData }
        // TypeScript 会检查 delete 操作符的操作对象是否可选
        // 这里我们可以使用可选的方式构建一个新对象，而不是使用 delete
        const { username, avatar, ...submitData } = updateData

        // 使用 userApi 更新资料
        await userApi.updateProfile(submitData)

        // 刷新用户信息
        const response = await userApi.getMe()
        if (response.success) {
          // 适配 UserInfo 类型要求的字段
          const userData = {
            ...response.data.user,
            permissions: userStore.userInfo?.permissions || [],
            name: response.data.user.name || username, // 确保 name 不为 undefined
          }

          userStore.setUserInfo(userData as any) // 使用 any 类型暂时解决类型问题
        }

        originalData = { ...formData }
        isEditing.value = false
        ElMessage.success('个人资料更新成功')
      } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 头像上传前检查
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传
const handleAvatarUpload = async (options: UploadRequestOptions) => {
  try {
    const avatarFormData = new FormData()
    avatarFormData.append('avatar', options.file)

    // 调用 API 上传头像
    const response = await userApi.uploadAvatar(options.file)
    if (response.data?.avatarUrl) {
      // 更新本地头像
      formData.avatar = response.data.avatarUrl

      // 刷新用户信息
      const userResponse = await userApi.getMe()
      if (userResponse.success) {
        // 适配 UserInfo 类型要求的字段
        const userData = {
          ...userResponse.data.user,
          permissions: userStore.userInfo?.permissions || [],
          name: userResponse.data.user.name || userStore.userInfo?.username || '',
        }

        userStore.setUserInfo(userData as any) // 使用 any 类型暂时解决类型问题
      }

      ElMessage.success('头像上传成功')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '头像上传失败')
  }
}

// 获取角色文本
const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    editor: '编辑',
    user: '普通用户',
  }
  return roleMap[role || 'user'] || '普通用户'
}

// 获取角色标签类型
const getRoleType = (role?: string) => {
  const typeMap: Record<string, string> = {
    admin: 'danger',
    editor: 'warning',
    user: 'success',
  }
  return typeMap[role || 'user'] || 'success'
}

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 获取用户统计数据
const loadUserStats = async () => {
  try {
    // 假设有一个获取用户统计数据的 API
    // 这里我们可以使用适当的方式获取数据
    userStats.value = {
      totalViews: 0,
      totalFavorites: 0,
      joinDays: 0,
    }
  } catch (error: any) {
    console.error('获取用户统计失败:', error)
    ElMessage.error(error.message || '获取用户统计数据失败')
  }
}

// 组件挂载时初始化
onMounted(() => {
  initData()
  loadUserStats()
})
</script>

<style scoped>
.user-profile {
  max-width: 800px;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40px;
}

.user-avatar {
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.user-stats {
  display: flex;
  gap: 30px;
  flex: 1;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-form {
  padding: 10px 0;
}

.account-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.info-item .label {
  width: 100px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar-section {
    margin-right: 0;
    margin-bottom: 20px;
  }

  .user-stats {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
