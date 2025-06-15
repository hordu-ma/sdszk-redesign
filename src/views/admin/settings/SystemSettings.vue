<template>
  <div class="system-settings">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-section">
        <h2>系统设置</h2>
        <p>管理网站基本信息和系统配置</p>
      </div>
      <div class="action-section">
        <a-button
          type="primary"
          :loading="saveLoading"
          @click="saveAllSettings"
        >
          保存所有设置
        </a-button>
      </div>
    </div>

    <!-- 设置标签页 -->
    <a-tabs v-model:activeKey="activeTab" type="card">
      <!-- 网站基本信息 -->
      <a-tab-pane key="site" tab="网站信息">
        <div class="settings-form">
          <a-form
            :model="siteSettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            ref="siteFormRef"
          >
            <a-form-item label="网站名称" name="siteName">
              <a-input
                v-model:value="siteSettings.siteName"
                placeholder="请输入网站名称"
              />
            </a-form-item>

            <a-form-item label="网站标题" name="siteTitle">
              <a-input
                v-model:value="siteSettings.siteTitle"
                placeholder="请输入网站标题"
              />
            </a-form-item>

            <a-form-item label="网站描述" name="siteDescription">
              <a-textarea
                v-model:value="siteSettings.siteDescription"
                placeholder="请输入网站描述"
                :rows="3"
              />
            </a-form-item>

            <a-form-item label="关键词" name="siteKeywords">
              <a-select
                v-model:value="siteSettings.siteKeywords"
                mode="tags"
                placeholder="请输入关键词，按回车添加"
                style="width: 100%"
              />
            </a-form-item>

            <a-form-item label="网站Logo" name="siteLogo">
              <div class="logo-upload">
                <a-upload
                  :file-list="logoFileList"
                  list-type="picture-card"
                  :before-upload="beforeLogoUpload"
                  @remove="removeLogo"
                  @preview="previewLogo"
                >
                  <div v-if="logoFileList.length < 1">
                    <PlusOutlined />
                    <div style="margin-top: 8px">上传Logo</div>
                  </div>
                </a-upload>
              </div>
            </a-form-item>

            <a-form-item label="网站图标" name="siteFavicon">
              <div class="favicon-upload">
                <a-upload
                  :file-list="faviconFileList"
                  list-type="picture-card"
                  :before-upload="beforeFaviconUpload"
                  @remove="removeFavicon"
                  @preview="previewFavicon"
                >
                  <div v-if="faviconFileList.length < 1">
                    <PlusOutlined />
                    <div style="margin-top: 8px">上传图标</div>
                  </div>
                </a-upload>
              </div>
            </a-form-item>

            <a-form-item label="联系邮箱" name="contactEmail">
              <a-input
                v-model:value="siteSettings.contactEmail"
                placeholder="请输入联系邮箱"
              />
            </a-form-item>

            <a-form-item label="联系电话" name="contactPhone">
              <a-input
                v-model:value="siteSettings.contactPhone"
                placeholder="请输入联系电话"
              />
            </a-form-item>

            <a-form-item label="网站地址" name="siteUrl">
              <a-input
                v-model:value="siteSettings.siteUrl"
                placeholder="请输入网站地址"
              />
            </a-form-item>

            <a-form-item label="ICP备案号" name="icpNumber">
              <a-input
                v-model:value="siteSettings.icpNumber"
                placeholder="请输入ICP备案号"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-tab-pane>

      <!-- 系统配置 -->
      <a-tab-pane key="system" tab="系统配置">
        <div class="settings-form">
          <a-form
            :model="systemSettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            ref="systemFormRef"
          >
            <a-form-item label="网站状态" name="siteStatus">
              <a-radio-group v-model:value="systemSettings.siteStatus">
                <a-radio value="online">正常运行</a-radio>
                <a-radio value="maintenance">维护模式</a-radio>
                <a-radio value="offline">关闭网站</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="维护提示" name="maintenanceMessage">
              <a-textarea
                v-model:value="systemSettings.maintenanceMessage"
                placeholder="网站维护时显示的提示信息"
                :rows="3"
              />
            </a-form-item>

            <a-form-item label="用户注册" name="allowRegistration">
              <a-switch v-model:checked="systemSettings.allowRegistration" />
              <span class="setting-tip">关闭后新用户无法注册</span>
            </a-form-item>

            <a-form-item label="邮箱验证" name="requireEmailVerification">
              <a-switch
                v-model:checked="systemSettings.requireEmailVerification"
              />
              <span class="setting-tip">新用户注册需要邮箱验证</span>
            </a-form-item>

            <a-form-item label="管理员审核" name="requireAdminApproval">
              <a-switch v-model:checked="systemSettings.requireAdminApproval" />
              <span class="setting-tip">新用户注册需要管理员审核</span>
            </a-form-item>

            <a-form-item label="文件上传大小限制" name="maxFileSize">
              <a-input-number
                v-model:value="systemSettings.maxFileSize"
                :min="1"
                :max="100"
                addon-after="MB"
              />
            </a-form-item>

            <a-form-item label="允许上传的文件类型" name="allowedFileTypes">
              <a-select
                v-model:value="systemSettings.allowedFileTypes"
                mode="multiple"
                placeholder="选择允许上传的文件类型"
                style="width: 100%"
                :options="fileTypeOptions"
              />
            </a-form-item>

            <a-form-item label="评论功能" name="enableComments">
              <a-switch v-model:checked="systemSettings.enableComments" />
              <span class="setting-tip">启用新闻和资源评论功能</span>
            </a-form-item>

            <a-form-item label="评论审核" name="moderateComments">
              <a-switch v-model:checked="systemSettings.moderateComments" />
              <span class="setting-tip">评论需要审核后才能显示</span>
            </a-form-item>

            <a-form-item label="缓存时间" name="cacheTime">
              <a-input-number
                v-model:value="systemSettings.cacheTime"
                :min="0"
                :max="3600"
                addon-after="秒"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-tab-pane>

      <!-- 邮件配置 -->
      <a-tab-pane key="email" tab="邮件设置">
        <div class="settings-form">
          <a-form
            :model="emailSettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            ref="emailFormRef"
          >
            <a-form-item label="邮件服务" name="enabled">
              <a-switch v-model:checked="emailSettings.enabled" />
              <span class="setting-tip">启用邮件发送功能</span>
            </a-form-item>

            <a-form-item label="SMTP服务器" name="smtpHost">
              <a-input
                v-model:value="emailSettings.smtpHost"
                placeholder="如：smtp.qq.com"
              />
            </a-form-item>

            <a-form-item label="SMTP端口" name="smtpPort">
              <a-input-number
                v-model:value="emailSettings.smtpPort"
                :min="1"
                :max="65535"
              />
            </a-form-item>

            <a-form-item label="加密方式" name="encryption">
              <a-radio-group v-model:value="emailSettings.encryption">
                <a-radio value="none">无</a-radio>
                <a-radio value="ssl">SSL</a-radio>
                <a-radio value="tls">TLS</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="用户名" name="username">
              <a-input
                v-model:value="emailSettings.username"
                placeholder="SMTP用户名"
              />
            </a-form-item>

            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="emailSettings.password"
                placeholder="SMTP密码"
              />
            </a-form-item>

            <a-form-item label="发件人名称" name="fromName">
              <a-input
                v-model:value="emailSettings.fromName"
                placeholder="发件人显示名称"
              />
            </a-form-item>

            <a-form-item label="发件人邮箱" name="fromEmail">
              <a-input
                v-model:value="emailSettings.fromEmail"
                placeholder="发件人邮箱地址"
              />
            </a-form-item>

            <a-form-item label="测试邮件" name="testEmail">
              <a-input-group compact>
                <a-input
                  v-model:value="testEmailAddress"
                  placeholder="输入测试邮箱地址"
                  style="width: calc(100% - 100px)"
                />
                <a-button
                  type="primary"
                  :loading="testEmailLoading"
                  @click="sendTestEmail"
                >
                  发送测试
                </a-button>
              </a-input-group>
            </a-form-item>
          </a-form>
        </div>
      </a-tab-pane>

      <!-- 安全设置 -->
      <a-tab-pane key="security" tab="安全设置">
        <div class="settings-form">
          <a-form
            :model="securitySettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            ref="securityFormRef"
          >
            <a-form-item label="登录失败限制" name="maxLoginAttempts">
              <a-input-number
                v-model:value="securitySettings.maxLoginAttempts"
                :min="3"
                :max="10"
                addon-after="次"
              />
              <div class="setting-tip">连续登录失败超过此次数将锁定账户</div>
            </a-form-item>

            <a-form-item label="账户锁定时间" name="lockoutDuration">
              <a-input-number
                v-model:value="securitySettings.lockoutDuration"
                :min="5"
                :max="1440"
                addon-after="分钟"
              />
            </a-form-item>

            <a-form-item label="密码复杂度" name="passwordComplexity">
              <a-checkbox-group
                v-model:value="securitySettings.passwordComplexity"
              >
                <a-checkbox value="uppercase">包含大写字母</a-checkbox>
                <a-checkbox value="lowercase">包含小写字母</a-checkbox>
                <a-checkbox value="numbers">包含数字</a-checkbox>
                <a-checkbox value="symbols">包含特殊字符</a-checkbox>
              </a-checkbox-group>
            </a-form-item>

            <a-form-item label="最小密码长度" name="minPasswordLength">
              <a-input-number
                v-model:value="securitySettings.minPasswordLength"
                :min="6"
                :max="20"
                addon-after="字符"
              />
            </a-form-item>

            <a-form-item label="密码过期时间" name="passwordExpiry">
              <a-input-number
                v-model:value="securitySettings.passwordExpiry"
                :min="0"
                :max="365"
                addon-after="天"
              />
              <div class="setting-tip">0表示密码永不过期</div>
            </a-form-item>

            <a-form-item label="会话超时" name="sessionTimeout">
              <a-input-number
                v-model:value="securitySettings.sessionTimeout"
                :min="30"
                :max="480"
                addon-after="分钟"
              />
            </a-form-item>

            <a-form-item label="强制HTTPS" name="forceHttps">
              <a-switch v-model:checked="securitySettings.forceHttps" />
              <span class="setting-tip">强制使用HTTPS访问</span>
            </a-form-item>

            <a-form-item label="IP白名单" name="ipWhitelist">
              <a-textarea
                v-model:value="securitySettings.ipWhitelist"
                placeholder="每行一个IP地址或IP段，支持CIDR格式"
                :rows="4"
              />
              <div class="setting-tip">留空表示允许所有IP访问</div>
            </a-form-item>
          </a-form>
        </div>
      </a-tab-pane>

      <!-- 备份与恢复 -->
      <a-tab-pane key="backup" tab="备份恢复">
        <div class="backup-section">
          <a-card title="数据备份" class="backup-card">
            <div class="backup-info">
              <p>定期备份系统数据，确保数据安全。</p>
              <div class="backup-stats">
                <a-statistic title="上次备份时间" :value="lastBackupTime" />
                <a-statistic
                  title="备份文件大小"
                  :value="backupSize"
                  suffix="MB"
                />
                <a-statistic title="备份文件数量" :value="backupCount" />
              </div>
            </div>
            <div class="backup-actions">
              <a-space>
                <a-button
                  type="primary"
                  :loading="backupLoading"
                  @click="createBackup"
                >
                  立即备份
                </a-button>
                <a-button @click="downloadBackup">下载备份</a-button>
                <a-button @click="showBackupList">备份列表</a-button>
              </a-space>
            </div>
          </a-card>

          <a-card title="自动备份设置" class="backup-card">
            <a-form
              :model="backupSettings"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 18 }"
            >
              <a-form-item label="自动备份" name="autoBackup">
                <a-switch v-model:checked="backupSettings.autoBackup" />
                <span class="setting-tip">启用自动备份功能</span>
              </a-form-item>

              <a-form-item label="备份频率" name="backupFrequency">
                <a-select v-model:value="backupSettings.backupFrequency">
                  <a-select-option value="daily">每天</a-select-option>
                  <a-select-option value="weekly">每周</a-select-option>
                  <a-select-option value="monthly">每月</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="备份时间" name="backupTime">
                <a-time-picker
                  v-model:value="backupSettings.backupTime"
                  format="HH:mm"
                  placeholder="选择备份时间"
                />
              </a-form-item>

              <a-form-item label="保留份数" name="backupRetention">
                <a-input-number
                  v-model:value="backupSettings.backupRetention"
                  :min="1"
                  :max="30"
                  addon-after="份"
                />
                <div class="setting-tip">超过此数量的旧备份将被自动删除</div>
              </a-form-item>
            </a-form>
          </a-card>

          <a-card title="数据恢复" class="backup-card">
            <div class="restore-section">
              <p>
                从备份文件恢复系统数据。<span style="color: #ff4d4f"
                  >警告：此操作将覆盖当前数据！</span
                >
              </p>
              <a-upload
                :before-upload="beforeRestoreUpload"
                :file-list="restoreFileList"
                @remove="removeRestoreFile"
              >
                <a-button>
                  <UploadOutlined />
                  选择备份文件
                </a-button>
              </a-upload>
              <div class="restore-actions">
                <a-button
                  type="primary"
                  danger
                  :loading="restoreLoading"
                  :disabled="restoreFileList.length === 0"
                  @click="restoreData"
                >
                  恢复数据
                </a-button>
              </div>
            </div>
          </a-card>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 图片预览模态框 -->
    <a-modal v-model:open="previewVisible" :footer="null" :width="800">
      <img alt="preview" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message, Modal } from "ant-design-vue";
import dayjs from "dayjs";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons-vue";
import { settingsApi } from "@/api";

// 响应式数据
const activeTab = ref("site");
const saveLoading = ref(false);
const testEmailLoading = ref(false);
const backupLoading = ref(false);
const restoreLoading = ref(false);
const previewVisible = ref(false);
const previewImage = ref("");

const testEmailAddress = ref("");
const lastBackupTime = ref("2024-05-20 03:00:00");
const backupSize = ref(245);
const backupCount = ref(15);

// 文件列表
const logoFileList = ref<any[]>([]);
const faviconFileList = ref<any[]>([]);
const restoreFileList = ref<any[]>([]);

// 表单引用
const siteFormRef = ref();
const systemFormRef = ref();
const emailFormRef = ref();
const securityFormRef = ref();

// 网站设置
const siteSettings = reactive({
  siteName: "山东省大中小学思政课一体化中心平台",
  siteTitle: "思政课一体化中心平台 - 首页",
  siteDescription:
    "山东省大中小学思政课一体化建设中心平台，提供思政课程资源、教学案例、活动组织等服务",
  siteKeywords: ["思政课", "一体化", "教育", "山东省"],
  siteLogo: "",
  siteFavicon: "",
  contactEmail: "contact@sdszk.edu.cn",
  contactPhone: "0531-12345678",
  siteUrl: "https://sdszk.edu.cn",
  icpNumber: "鲁ICP备12345678号",
});

// 系统设置
const systemSettings = reactive({
  siteStatus: "online",
  maintenanceMessage:
    "网站正在维护中，预计1小时后恢复正常，给您带来不便敬请谅解。",
  allowRegistration: true,
  requireEmailVerification: true,
  requireAdminApproval: false,
  maxFileSize: 10,
  allowedFileTypes: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
  ],
  enableComments: true,
  moderateComments: true,
  cacheTime: 300,
});

// 邮件设置
const emailSettings = reactive({
  enabled: true,
  smtpHost: "smtp.qq.com",
  smtpPort: 587,
  encryption: "tls",
  username: "",
  password: "",
  fromName: "思政课一体化平台",
  fromEmail: "noreply@sdszk.edu.cn",
});

// 安全设置
const securitySettings = reactive({
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordComplexity: ["lowercase", "numbers"],
  minPasswordLength: 8,
  passwordExpiry: 90,
  sessionTimeout: 120,
  forceHttps: false,
  ipWhitelist: "",
});

// 备份设置
const backupSettings = reactive({
  autoBackup: true,
  backupFrequency: "daily",
  backupTime: dayjs("03:00", "HH:mm"),
  backupRetention: 7,
});

// 文件类型选项
const fileTypeOptions = [
  { label: "JPEG图片", value: "jpg" },
  { label: "JPEG图片", value: "jpeg" },
  { label: "PNG图片", value: "png" },
  { label: "GIF图片", value: "gif" },
  { label: "PDF文档", value: "pdf" },
  { label: "Word文档", value: "doc" },
  { label: "Word文档", value: "docx" },
  { label: "PowerPoint", value: "ppt" },
  { label: "PowerPoint", value: "pptx" },
  { label: "Excel表格", value: "xls" },
  { label: "Excel表格", value: "xlsx" },
  { label: "ZIP压缩包", value: "zip" },
  { label: "RAR压缩包", value: "rar" },
  { label: "MP4视频", value: "mp4" },
  { label: "MP3音频", value: "mp3" },
];

// 工具函数
const beforeLogoUpload = (file: any) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("只能上传图片文件！");
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("图片大小不能超过 2MB！");
    return false;
  }
  return false; // 阻止自动上传
};

const beforeFaviconUpload = (file: any) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("只能上传图片文件！");
    return false;
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("图标大小不能超过 1MB！");
    return false;
  }
  return false;
};

const beforeRestoreUpload = (file: any) => {
  const isBackup = file.name.endsWith(".sql") || file.name.endsWith(".backup");
  if (!isBackup) {
    message.error("只能上传备份文件（.sql 或 .backup）！");
    return false;
  }
  return false;
};

const removeLogo = () => {
  logoFileList.value = [];
  siteSettings.siteLogo = "";
};

const removeFavicon = () => {
  faviconFileList.value = [];
  siteSettings.siteFavicon = "";
};

const removeRestoreFile = () => {
  restoreFileList.value = [];
};

const previewLogo = (file: any) => {
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
};

const previewFavicon = (file: any) => {
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
};

// 工具函数
const getSettingType = (value: any): string => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "json";
  return "text"; // string 类型映射为 text
};

// 事件处理
const saveAllSettings = async () => {
  try {
    saveLoading.value = true;

    // 构建批量更新的设置数组
    const settingsToUpdate = [];

    // 网站基本信息设置
    Object.keys(siteSettings).forEach((key) => {
      settingsToUpdate.push({
        key: `site.${key}`,
        value: siteSettings[key],
        group: "site",
        type: getSettingType(siteSettings[key]),
      });
    });

    // 系统设置
    Object.keys(systemSettings).forEach((key) => {
      settingsToUpdate.push({
        key: `system.${key}`,
        value: systemSettings[key],
        group: "system",
        type: getSettingType(systemSettings[key]),
      });
    });

    // 邮件设置
    Object.keys(emailSettings).forEach((key) => {
      settingsToUpdate.push({
        key: `email.${key}`,
        value: emailSettings[key],
        group: "email",
        type: getSettingType(emailSettings[key]),
      });
    });

    // 安全设置
    Object.keys(securitySettings).forEach((key) => {
      settingsToUpdate.push({
        key: `security.${key}`,
        value: securitySettings[key],
        group: "security",
        type: getSettingType(securitySettings[key]),
      });
    });

    // 备份设置
    Object.keys(backupSettings).forEach((key) => {
      const value =
        key === "backupTime"
          ? backupSettings[key].format("HH:mm")
          : backupSettings[key];
      settingsToUpdate.push({
        key: `backup.${key}`,
        value: value,
        group: "backup",
        type: getSettingType(value),
      });
    });

    // 调用API批量更新设置
    const response = await settingsApi.bulkUpdateSettings(settingsToUpdate);

    if (response.status === "success") {
      message.success("设置保存成功");
      console.log("Settings update results:", response.data.results);
    } else {
      message.error("设置保存失败");
    }
  } catch (error) {
    console.error("保存设置失败:", error);
    message.error("设置保存失败");
  } finally {
    saveLoading.value = false;
  }
};

const sendTestEmail = async () => {
  if (!testEmailAddress.value) {
    message.error("请输入测试邮箱地址");
    return;
  }

  try {
    testEmailLoading.value = true;

    // 这里需要调用后端API发送测试邮件
    // await settingsApi.sendTestEmail({
    //   to: testEmailAddress.value,
    //   settings: emailSettings
    // })

    message.success("测试邮件发送成功，请检查邮箱");
  } catch (error) {
    message.error("测试邮件发送失败");
  } finally {
    testEmailLoading.value = false;
  }
};

const createBackup = async () => {
  try {
    backupLoading.value = true;

    // 这里需要调用后端API创建备份
    // await settingsApi.createBackup()

    message.success("备份创建成功");
    // 更新备份统计信息
  } catch (error) {
    message.error("备份创建失败");
  } finally {
    backupLoading.value = false;
  }
};

const downloadBackup = () => {
  // 实现备份下载
  message.info("备份下载功能待实现");
};

const showBackupList = () => {
  // 显示备份文件列表
  message.info("备份列表功能待实现");
};

const restoreData = () => {
  Modal.confirm({
    title: "确认恢复数据",
    content: "此操作将覆盖当前所有数据，且不可恢复。确定要继续吗？",
    okText: "确认恢复",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        restoreLoading.value = true;

        // 这里需要调用后端API恢复数据
        // await settingsApi.restoreData(restoreFileList.value[0])

        message.success("数据恢复成功");
        restoreFileList.value = [];
      } catch (error) {
        message.error("数据恢复失败");
      } finally {
        restoreLoading.value = false;
      }
    },
  });
};

// 数据加载
const loadSettings = async () => {
  try {
    const response = await settingsApi.getAllSettings();

    if (response.status === "success" && response.data) {
      const settings = response.data;

      // 更新网站设置
      if (settings.site) {
        settings.site.forEach((setting) => {
          const key = setting.key.replace("site.", "");
          if (key in siteSettings) {
            siteSettings[key] = setting.value;
          }
        });
      }

      // 更新系统设置
      if (settings.system) {
        settings.system.forEach((setting) => {
          const key = setting.key.replace("system.", "");
          if (key in systemSettings) {
            systemSettings[key] = setting.value;
          }
        });
      }

      // 更新邮件设置
      if (settings.email) {
        settings.email.forEach((setting) => {
          const key = setting.key.replace("email.", "");
          if (key in emailSettings) {
            emailSettings[key] = setting.value;
          }
        });
      }

      // 更新安全设置
      if (settings.security) {
        settings.security.forEach((setting) => {
          const key = setting.key.replace("security.", "");
          if (key in securitySettings) {
            securitySettings[key] = setting.value;
          }
        });
      }

      // 更新备份设置
      if (settings.backup) {
        settings.backup.forEach((setting) => {
          const key = setting.key.replace("backup.", "");
          if (key in backupSettings) {
            if (key === "backupTime") {
              backupSettings[key] = dayjs(setting.value, "HH:mm");
            } else {
              backupSettings[key] = setting.value;
            }
          }
        });
      }

      console.log("Settings loaded successfully:", settings);
    }
  } catch (error) {
    console.error("加载设置失败:", error);
    message.error("加载设置失败");
  }
};

// 生命周期
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.system-settings {
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

.settings-form {
  max-width: 800px;
  padding: 20px 0;
}

.setting-tip {
  margin-left: 8px;
  color: #8c8c8c;
  font-size: 12px;
}

.logo-upload,
.favicon-upload {
  display: flex;
  gap: 16px;
  align-items: center;
}

.backup-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.backup-card {
  border: 1px solid #e8e8e8;
}

.backup-info {
  margin-bottom: 16px;
}

.backup-stats {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.backup-actions {
  margin-top: 16px;
}

.restore-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.restore-actions {
  margin-top: 16px;
}

:deep(.ant-tabs-card .ant-tabs-tab) {
  border-radius: 6px 6px 0 0;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  width: 80px;
  height: 80px;
}

:deep(.ant-upload-select-picture-card) {
  width: 80px;
  height: 80px;
}

:deep(.ant-form-item) {
  margin-bottom: 20px;
}

:deep(.ant-statistic-title) {
  color: #8c8c8c;
  font-size: 13px;
}

:deep(.ant-statistic-content) {
  font-size: 16px;
}

:deep(.ant-card-head) {
  background: #fafafa;
}

:deep(.ant-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.ant-checkbox-group .ant-checkbox-wrapper) {
  margin-right: 0;
}
</style>
