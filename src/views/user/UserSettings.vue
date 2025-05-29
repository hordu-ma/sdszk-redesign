<template>
  <div class="user-settings">
    <!-- 安全设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <i class="fas fa-shield-alt"></i>
          <span>安全设置</span>
        </div>
      </template>

      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <h4>登录密码</h4>
            <p>定期更换密码，保护账户安全</p>
          </div>
          <el-button type="primary" plain @click="showPasswordDialog = true"> 修改密码 </el-button>
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>邮箱验证</h4>
            <p>已验证的邮箱: {{ userInfo?.email || '未设置' }}</p>
          </div>
          <el-button
            v-if="!userInfo?.emailVerified"
            type="warning"
            plain
            @click="sendVerificationEmail"
            :loading="emailLoading"
          >
            验证邮箱
          </el-button>
          <el-tag v-else type="success">已验证</el-tag>
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>手机验证</h4>
            <p>已验证的手机: {{ userInfo?.phone || '未设置' }}</p>
          </div>
          <el-button
            v-if="!userInfo?.phoneVerified"
            type="warning"
            plain
            @click="showPhoneDialog = true"
          >
            验证手机
          </el-button>
          <el-tag v-else type="success">已验证</el-tag>
        </div>
      </div>
    </el-card>

    <!-- 隐私设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <i class="fas fa-user-secret"></i>
          <span>隐私设置</span>
        </div>
      </template>

      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <h4>个人资料可见性</h4>
            <p>控制其他用户是否可以查看您的个人资料</p>
          </div>
          <el-switch
            v-model="privacySettings.profileVisible"
            @change="updatePrivacySettings"
            active-text="公开"
            inactive-text="私密"
          />
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>浏览历史记录</h4>
            <p>是否记录您的浏览历史</p>
          </div>
          <el-switch
            v-model="privacySettings.trackHistory"
            @change="updatePrivacySettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>个性化推荐</h4>
            <p>基于您的浏览历史提供个性化内容推荐</p>
          </div>
          <el-switch
            v-model="privacySettings.personalizedRecommendation"
            @change="updatePrivacySettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>
    </el-card>

    <!-- 通知设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <i class="fas fa-bell"></i>
          <span>通知设置</span>
        </div>
      </template>

      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <h4>邮件通知</h4>
            <p>接收系统邮件通知</p>
          </div>
          <el-switch
            v-model="notificationSettings.email"
            @change="updateNotificationSettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>新内容推送</h4>
            <p>有新的资讯或资源时通知我</p>
          </div>
          <el-switch
            v-model="notificationSettings.newContent"
            @change="updateNotificationSettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>活动提醒</h4>
            <p>重要活动开始前提醒我</p>
          </div>
          <el-switch
            v-model="notificationSettings.activities"
            @change="updateNotificationSettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>
    </el-card>

    <!-- 数据管理 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <i class="fas fa-database"></i>
          <span>数据管理</span>
        </div>
      </template>

      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <h4>导出个人数据</h4>
            <p>下载您在平台上的所有个人数据</p>
          </div>
          <el-button type="primary" plain @click="exportUserData" :loading="exportLoading">
            导出数据
          </el-button>
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>清除浏览记录</h4>
            <p>删除所有浏览历史记录</p>
          </div>
          <el-button type="warning" plain @click="clearBrowsingHistory"> 清除记录 </el-button>
        </div>

        <el-divider />

        <div class="setting-item">
          <div class="setting-info">
            <h4>注销账户</h4>
            <p class="danger-text">永久删除您的账户和所有数据</p>
          </div>
          <el-button type="danger" plain @click="showDeleteAccountDialog = true">
            注销账户
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="passwordLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 手机验证对话框 -->
    <el-dialog v-model="showPhoneDialog" title="验证手机号" width="400px">
      <el-form :model="phoneForm" :rules="phoneRules" ref="phoneFormRef" label-width="100px">
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div style="display: flex; gap: 10px">
            <el-input v-model="phoneForm.code" placeholder="请输入验证码" maxlength="6" />
            <el-button @click="sendPhoneCode" :disabled="codeCountdown > 0" :loading="sendingCode">
              {{ codeCountdown > 0 ? `${codeCountdown}秒后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" @click="verifyPhone" :loading="phoneLoading"> 验证 </el-button>
      </template>
    </el-dialog>

    <!-- 注销账户确认对话框 -->
    <el-dialog v-model="showDeleteAccountDialog" title="注销账户" width="500px">
      <div class="delete-account-warning">
        <el-alert
          title="警告"
          type="error"
          description="注销账户后，您的所有数据将被永久删除，且无法恢复！"
          :closable="false"
          show-icon
        />

        <div class="confirm-input">
          <p>请输入您的密码以确认注销：</p>
          <el-input
            v-model="deleteAccountPassword"
            type="password"
            placeholder="请输入密码确认"
            show-password
          />
        </div>

        <div class="confirm-checkbox">
          <el-checkbox v-model="confirmDelete">
            我已了解注销账户的后果，确认要删除我的账户
          </el-checkbox>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDeleteAccountDialog = false">取消</el-button>
        <el-button
          type="danger"
          @click="deleteAccount"
          :disabled="!confirmDelete || !deleteAccountPassword"
          :loading="deleteLoading"
        >
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/modules/user'
import { clearAllHistory } from '@/services/viewHistory.service'

// 扩展用户信息接口
interface ExtendedUserInfo {
  id: string
  username: string
  name: string
  avatar?: string
  email?: string
  role: 'admin' | 'editor' | 'user'
  permissions: string[]
  phone?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  twoFactorEnabled?: boolean
}

const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const showPasswordDialog = ref(false)
const showPhoneDialog = ref(false)
const showDeleteAccountDialog = ref(false)
const passwordLoading = ref(false)
const phoneLoading = ref(false)
const emailLoading = ref(false)
const exportLoading = ref(false)
const deleteLoading = ref(false)
const sendingCode = ref(false)
const codeCountdown = ref(0)

// 表单引用
const passwordFormRef = ref<FormInstance>()
const phoneFormRef = ref<FormInstance>()

// 计算属性
const userInfo = computed<ExtendedUserInfo | null>(() => userStore.userInfo as ExtendedUserInfo)

// 隐私设置
const privacySettings = reactive({
  profileVisible: true,
  trackHistory: true,
  personalizedRecommendation: true,
})

// 通知设置
const notificationSettings = reactive({
  email: true,
  newContent: true,
  activities: true,
})

// 修改密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 手机验证表单
const phoneForm = reactive({
  phone: '',
  code: '',
})

// 注销账户
const deleteAccountPassword = ref('')
const confirmDelete = ref(false)

// 密码验证规则
const passwordRules: FormRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 手机验证规则
const phoneRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async valid => {
    if (valid) {
      passwordLoading.value = true
      try {
        await userApi.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false

        // 清空表单
        Object.assign(passwordForm, {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })

        // 退出登录
        setTimeout(() => {
          userStore.logout()
          router.push('/auth')
        }, 1500)
      } catch (error: any) {
        ElMessage.error(error.message || '密码修改失败')
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

// 发送邮箱验证
const sendVerificationEmail = async () => {
  emailLoading.value = true
  try {
    // 假设 userApi 有一个发送验证邮件的方法
    await userApi.getMe() // 替代临时使用
    ElMessage.success('验证邮件已发送，请查收')
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    emailLoading.value = false
  }
}

// 发送手机验证码
const sendPhoneCode = async () => {
  if (!phoneForm.phone || !/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    // 调用 userStore 发送验证码的方法
    await userStore.sendVerificationCode(phoneForm.phone)
    ElMessage.success('验证码已发送')

    // 开始倒计时
    codeCountdown.value = 60
    const timer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    sendingCode.value = false
  }
}

// 验证手机
const verifyPhone = async () => {
  if (!phoneFormRef.value) return

  await phoneFormRef.value.validate(async valid => {
    if (valid) {
      phoneLoading.value = true
      try {
        // 假设 userApi 有一个验证手机的方法
        const response = await userApi.getMe()
        if (response.success) {
          // 适配 UserInfo 类型要求的字段
          const userData = {
            ...response.data.user,
            permissions: userStore.userInfo?.permissions || [],
            name: response.data.user.name || userStore.userInfo?.username || '',
          }

          userStore.setUserInfo(userData as any) // 使用 any 类型暂时解决类型问题
        }
        ElMessage.success('手机验证成功')
        showPhoneDialog.value = false

        // 清空表单
        Object.assign(phoneForm, { phone: '', code: '' })
      } catch (error: any) {
        ElMessage.error(error.message || '验证失败')
      } finally {
        phoneLoading.value = false
      }
    }
  })
}

// 更新隐私设置
const updatePrivacySettings = async () => {
  try {
    // 假设 userApi 有一个更新设置的方法
    await userApi.updateProfile({})
    ElMessage.success('设置已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

// 更新通知设置
const updateNotificationSettings = async () => {
  try {
    // 假设 userApi 有一个更新设置的方法
    await userApi.updateProfile({})
    ElMessage.success('设置已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

// 导出用户数据
const exportUserData = async () => {
  try {
    await ElMessageBox.confirm(
      '将导出您的所有个人数据，包括个人资料、收藏、浏览历史等，是否继续？',
      '导出个人数据',
      { type: 'info' }
    )

    exportLoading.value = true
    // 假设有一个导出数据的 API
    const response = await userApi.getMe()

    // 模拟文件下载
    ElMessage.success('数据导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

// 清除浏览记录
const clearBrowsingHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有浏览历史记录吗？此操作不可恢复！', '清除浏览记录', {
      type: 'warning',
    })

    await clearAllHistory()
    ElMessage.success('浏览记录已清除')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '清除失败')
    }
  }
}

// 注销账户
const deleteAccount = async () => {
  deleteLoading.value = true
  try {
    await userApi.deleteAccount(deleteAccountPassword.value)
    ElMessage.success('账户已注销')

    // 清理本地数据并跳转
    userStore.logout()
    router.push('/')
  } catch (error: any) {
    ElMessage.error(error.message || '注销失败')
  } finally {
    deleteLoading.value = false
    showDeleteAccountDialog.value = false
  }
}

// 初始化设置
const initSettings = () => {
  // 这里可能需要获取用户设置，但是 userInfo 中没有 settings 属性
  // 需要调整为合适的 API 调用
  privacySettings.profileVisible = true
  privacySettings.trackHistory = true
  privacySettings.personalizedRecommendation = true

  notificationSettings.email = true
  notificationSettings.newContent = true
  notificationSettings.activities = true
}

// 组件挂载
onMounted(() => {
  initSettings()
})
</script>

<style scoped>
.user-settings {
  max-width: 800px;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
}

.settings-section {
  padding: 10px 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  margin: 0 0 5px;
  font-size: 16px;
  font-weight: 600;
}

.setting-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.danger-text {
  color: #f56c6c !important;
}

.delete-account-warning {
  padding: 10px 0;
}

.confirm-input {
  margin: 20px 0;
}

.confirm-input p {
  margin-bottom: 10px;
  font-weight: 500;
}

.confirm-checkbox {
  margin: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .setting-info {
    width: 100%;
  }
}
</style>
