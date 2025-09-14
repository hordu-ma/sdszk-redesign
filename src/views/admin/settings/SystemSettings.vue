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
    <a-tabs v-model:active-key="activeTab" type="card">
      <!-- 网站基本信息 -->
      <a-tab-pane key="site" tab="网站信息">
        <div class="settings-form">
          <a-form
            ref="siteFormRef"
            :model="siteSettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
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

            <a-form-item label="网站图标" name="siteLogo">
              <div class="logo-upload">
                <a-upload
                  :file-list="logoFileList"
                  list-type="picture-card"
                  :before-upload="beforeLogoUpload"
                  @remove="removeLogo"
                  @preview="previewLogo"
                  @change="handleLogoChange"
                >
                  <div v-if="logoFileList.length < 1">
                    <plus-outlined />
                    <div style="margin-top: 8px">上传图标</div>
                  </div>
                </a-upload>
                <div class="upload-tip">
                  支持 JPG、PNG 格式，建议尺寸 200x200px，文件大小不超过 2MB
                </div>
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
            ref="systemFormRef"
            :model="systemSettings"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
          >
            <a-form-item label="网站状态" name="siteStatus">
              <a-radio-group v-model:value="systemSettings.siteStatus">
                <a-radio value="online"> 正常运行 </a-radio>
                <a-radio value="maintenance"> 维护模式 </a-radio>
                <a-radio value="offline"> 关闭网站 </a-radio>
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
    </a-tabs>

    <!-- 图片预览模态框 -->
    <a-modal v-model:open="previewVisible" :footer="null" :width="800">
      <img alt="preview" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import { settingsApi } from "@/api";
import { onLogoSettingChange } from "@/utils/favicon";

// 设置类型定义
interface SiteSettings {
  [key: string]: any;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string[];
  siteLogo: string;
  contactEmail: string;
  contactPhone: string;
  siteUrl: string;
  icpNumber: string;
}

interface SystemSettings {
  [key: string]: any;
  siteStatus: string;
  maintenanceMessage: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  requireAdminApproval: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableComments: boolean;
  moderateComments: boolean;
  cacheTime: number;
}

interface SettingUpdateItem {
  key: string;
  value: any;
  group: string;
  type: string;
}

// 响应式数据
const activeTab = ref("site");
const saveLoading = ref(false);

const previewVisible = ref(false);
const previewImage = ref("");

// 文件列表
const logoFileList = ref<any[]>([]);

// 表单引用
const siteFormRef = ref();
const systemFormRef = ref();

// 网站设置
const siteSettings: SiteSettings = reactive({
  siteName: "山东省大中小学思政课一体化中心平台",
  siteTitle: "思政课一体化中心平台 - 首页",
  siteDescription:
    "山东省大中小学思政课一体化建设中心平台，提供思政课程资源、教学案例、活动组织等服务",
  siteKeywords: ["思政课", "一体化", "教育", "山东省"],
  siteLogo: "",
  contactEmail: "contact@sdszk.edu.cn",
  contactPhone: "0531-12345678",
  siteUrl: "https://sdszk.edu.cn",
  icpNumber: "鲁ICP备12345678号",
});

// 系统设置
const systemSettings: SystemSettings = reactive({
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
  return false; // 阻止自动上传，改为手动处理
};

const handleLogoChange = (info: any) => {
  const { file, fileList } = info;

  // 更新文件列表
  logoFileList.value = fileList.slice(-1); // 只保留最新的一个文件

  if (file.status === "done" || file.originFileObj) {
    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      siteSettings.siteLogo = result;

      // 更新文件列表中的预览URL
      if (logoFileList.value[0]) {
        logoFileList.value[0].url = result;
        logoFileList.value[0].preview = result;
      }

      // 立即更新favicon预览
      onLogoSettingChange(result);
    };
    reader.readAsDataURL(file.originFileObj || file);

    message.success("图标上传成功！请点击「保存所有设置」来保存更改");
  }
};

const removeLogo = () => {
  logoFileList.value = [];
  siteSettings.siteLogo = "";

  // 恢复默认favicon
  onLogoSettingChange("");

  message.success("图标已移除！请点击「保存所有设置」来保存更改");
};

const previewLogo = (file: any) => {
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
    const settingsToUpdate: SettingUpdateItem[] = [];

    // 网站基本信息设置
    Object.keys(siteSettings).forEach((key) => {
      settingsToUpdate.push({
        key: key,
        value: siteSettings[key],
        group: "general",
        type: getSettingType(siteSettings[key]),
      });
    });

    // 系统设置
    Object.keys(systemSettings).forEach((key) => {
      settingsToUpdate.push({
        key: key,
        value: systemSettings[key],
        group: "system",
        type: getSettingType(systemSettings[key]),
      });
    });

    // 调用API批量更新设置
    const response =
      await settingsApi.instance.bulkUpdateSettings(settingsToUpdate);

    if (response.success && response.data) {
      message.success("设置保存成功");
      console.log("Settings update results:", response.data.results);

      // 如果保存的设置中包含logo，更新favicon
      const logoSetting = settingsToUpdate.find((s) => s.key === "siteLogo");
      if (logoSetting) {
        onLogoSettingChange(logoSetting.value);
      }
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

// 数据加载
const loadSettings = async () => {
  try {
    const response = await settingsApi.instance.getAllSettings();

    if (response.success && response.data) {
      const settings = response.data;

      // 更新网站基本设置（general组）
      if (settings.general) {
        settings.general.forEach((setting: any) => {
          if (setting.key in siteSettings) {
            siteSettings[setting.key] = setting.value;
          }
        });
      }

      // 更新系统设置（system组）
      if (settings.system) {
        settings.system.forEach((setting: any) => {
          if (setting.key in systemSettings) {
            systemSettings[setting.key] = setting.value;
          }
        });
      }

      // 更新联系信息设置（contact组）
      if (settings.contact) {
        settings.contact.forEach((setting: any) => {
          if (setting.key in siteSettings) {
            siteSettings[setting.key] = setting.value;
          }
        });
      }

      // 更新外观设置（appearance组）
      if (settings.appearance) {
        settings.appearance.forEach((setting: any) => {
          if (setting.key === "logoUrl" && setting.value) {
            // 兼容处理旧的logoUrl字段
            siteSettings.siteLogo = setting.value;
            // 如果有logo数据，创建文件列表项用于显示
            logoFileList.value = [
              {
                uid: "-1",
                name: "logo.png",
                status: "done",
                url: setting.value,
                preview: setting.value,
              },
            ];
          } else if (setting.key in siteSettings) {
            siteSettings[setting.key] = setting.value;
          }
        });
      }

      // 更新首页设置（homepage组）
      if (settings.homepage) {
        settings.homepage.forEach((setting: any) => {
          if (setting.key in siteSettings) {
            siteSettings[setting.key] = setting.value;
          }
        });
      }

      // 更新页脚设置（footer组）
      if (settings.footer) {
        settings.footer.forEach((setting: any) => {
          if (setting.key in siteSettings) {
            siteSettings[setting.key] = setting.value;
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

.logo-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.4;
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
