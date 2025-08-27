<template>
  <div class="resources-edit">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <a-button type="text"
@click="$router.back()" class="back-btn">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          返回
        </a-button>
        <div class="title-section">
          <h2>编辑资源</h2>
          <p>修改现有的教学资源</p>
        </div>
      </div>
      <div class="header-right">
        <a-button
:loading="saving" @click="handleSave"> 保存修改 </a-button>
        <a-button type="primary"
@click="handlePublish" :loading="publishing">
          {{ formData.status === "published" ? "更新发布" : "发布资源" }}
        </a-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading"
class="loading-container">
      <a-spin size="large" />
    </div>

    <!-- 资源表单 -->
    <div v-else
class="form-container">
      <a-form ref="formRef"
:model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <!-- 左侧主要内容 -->
          <a-col :span="16">
            <div class="main-content">
              <!-- 基本信息 -->
              <a-card title="基本信息"
class="section-card">
                <a-form-item label="资源标题"
name="title">
                  <a-input
                    v-model:value="formData.title"
                    placeholder="请输入资源标题"
                    size="large"
                    show-count
                    :maxlength="100"
                  />
                </a-form-item>

                <a-form-item label="资源描述"
name="description">
                  <QuillEditor
                    ref="quillEditorRef"
                    v-model="formData.description"
                    placeholder="请输入资源描述..."
                    height="300px"
                  />
                </a-form-item>

                <a-form-item label="资源摘要"
name="summary">
                  <a-textarea
                    v-model:value="formData.summary"
                    placeholder="请输入资源摘要（可选）"
                    :rows="3"
                    show-count
                    :maxlength="300"
                  />
                </a-form-item>
              </a-card>

              <!-- 当前文件信息 -->
              <a-card title="当前文件"
class="section-card">
                <div v-if="formData.fileUrl" class="current-file">
                  <div class="file-preview">
                    <!-- 图片预览 -->
                    <div v-if="isImageFile"
class="image-preview">
                      <img
:src="formData.fileUrl" alt="资源图片" />
                    </div>

                    <!-- 视频预览 -->
                    <div v-else-if="isVideoFile"
class="video-preview">
                      <video
:src="formData.fileUrl" controls
width="100%"
/>
                    </div>

                    <!-- 音频预览 -->
                    <div v-else-if="isAudioFile"
class="audio-preview">
                      <audio
                        :src="formData.fileUrl"
                        controls
                        style="width: 100%"
                      />
                    </div>

                    <!-- 文档文件信息 -->
                    <div v-else
class="file-info">
                      <div class="file-icon">
                        <FileOutlined style="font-size: 48px; color: #1890ff" />
                      </div>
                      <div class="file-details">
                        <h4>{{ formData.fileName }}</h4>
                        <p>文件大小: {{ formatFileSize(formData.fileSize) }}</p>
                        <p>文件类型: {{ formData.fileType }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="file-actions">
                    <a-button @click="showReplaceModal">
                      <template #icon>
                        <SwapOutlined />
                      </template>
                      替换文件
                    </a-button>
                    <a-button danger
@click="removeFile">
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                      删除文件
                    </a-button>
                  </div>
                </div>

                <!-- 无文件状态 -->
                <div v-else
class="no-file">
                  <a-empty description="暂无文件" />
                  <a-button type="primary"
@click="showReplaceModal">
                    <template #icon>
                      <UploadOutlined />
                    </template>
                    上传文件
                  </a-button>
                </div>
              </a-card>
            </div>
          </a-col>

          <!-- 右侧设置面板 -->
          <a-col :span="8">
            <div class="settings-panel">
              <!-- 发布设置 -->
              <a-card title="发布设置"
size="small" class="setting-card">
                <a-form-item label="资源分类"
name="categoryId">
                  <a-select
                    v-model:value="formData.categoryId"
                    placeholder="请选择分类"
                    allow-clear
                  >
                    <a-select-option
                      v-for="category in categories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </a-select-option>
                  </a-select>
                </a-form-item>

                <a-form-item label="发布状态">
                  <a-tag :color="getStatusColor(formData.status)">
                    {{ getStatusText(formData.status) }}
                  </a-tag>
                </a-form-item>

                <a-form-item label="资源类型"
name="type">
                  <a-select
                    v-model:value="formData.type"
                    placeholder="请选择类型"
                  >
                    <a-select-option value="document"> 文档 </a-select-option>
                    <a-select-option value="video"> 视频 </a-select-option>
                    <a-select-option value="image"> 图片 </a-select-option>
                    <a-select-option value="audio"> 音频 </a-select-option>
                    <a-select-option value="other"> 其他 </a-select-option>
                  </a-select>
                </a-form-item>

                <a-form-item label="发布时间"
name="publishDate">
                  <a-date-picker
                    v-model:value="formData.publishDate"
                    show-time
                    format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </a-form-item>

                <a-form-item label="标签"
name="tags">
                  <a-select
                    v-model:value="formData.tags"
                    mode="tags"
                    placeholder="请输入标签"
                    :max-tag-count="5"
                  />
                </a-form-item>
              </a-card>

              <!-- 访问权限 -->
              <a-card title="访问权限"
size="small" class="setting-card">
                <a-form-item name="accessLevel">
                  <a-radio-group v-model:value="formData.accessLevel">
                    <a-radio value="public"> 公开 </a-radio>
                    <a-radio value="registered"> 注册用户 </a-radio>
                    <a-radio value="vip"> VIP用户 </a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.allowDownload">
                    允许下载
                  </a-checkbox>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.allowComment">
                    允许评论
                  </a-checkbox>
                </a-form-item>
              </a-card>

              <!-- 首页展示图 -->
              <a-card title="首页展示图"
size="small" class="setting-card">
                <a-form-item name="thumbnail">
                  <div class="thumbnail-upload">
                    <a-upload
                      v-model:file-list="thumbnailFileList"
                      name="file"
                      list-type="picture-card"
                      :show-upload-list="false"
                      :before-upload="beforeThumbnailUpload"
                      accept="image/*"
                      @change="handleThumbnailChange"
                    >
                      <div v-if="formData.thumbnail"
class="thumbnail-preview">
                        <img
:src="formData.thumbnail" alt="缩略图" />
                        <div class="thumbnail-actions">
                          <a-button
                            type="text"
                            size="small"
                            danger
                            @click.stop="removeThumbnail"
                          >
                            删除
                          </a-button>
                        </div>
                      </div>
                      <div v-else
class="thumbnail-upload-placeholder">
                        <plus-outlined />
                        <div class="upload-text">上传图片</div>
                      </div>
                    </a-upload>
                    <div class="thumbnail-tip">
                      建议尺寸：300x200px，支持JPG、PNG格式
                    </div>
                  </div>
                </a-form-item>
              </a-card>

              <!-- 高级设置 -->
              <a-card title="高级设置"
size="small" class="setting-card">
                <a-form-item>
                  <a-checkbox v-model:checked="formData.isFeatured">
                    推荐资源
                  </a-checkbox>
                </a-form-item>

                <a-form-item>
                  <a-checkbox v-model:checked="formData.isTop">
                    置顶显示
                  </a-checkbox>
                </a-form-item>

                <a-form-item label="排序权重"
name="sortOrder">
                  <a-input-number
                    v-model:value="formData.sortOrder"
                    placeholder="数字越大排序越靠前"
                    :min="0"
                    :max="999"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-card>

              <!-- 统计信息 -->
              <a-card title="统计信息"
size="small" class="setting-card">
                <div class="stats-info">
                  <div class="stat-item">
                    <span class="label">浏览量：</span>
                    <span class="value">{{
                      resourceData?.viewCount || 0
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">下载量：</span>
                    <span class="value">{{
                      resourceData?.downloadCount || 0
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">创建时间：</span>
                    <span class="value">{{
                      formatDate(resourceData?.createdAt)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">更新时间：</span>
                    <span class="value">{{
                      formatDate(resourceData?.updatedAt)
                    }}</span>
                  </div>
                </div>
              </a-card>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <!-- 文件替换模态框 -->
    <a-modal
      v-model:open="replaceModalVisible"
      title="替换文件"
      :confirm-loading="uploading"
      @ok="handleFileReplace"
    >
      <a-upload-dragger
        v-model:file-list="newFileList"
        name="file"
        :multiple="false"
        :before-upload="beforeUpload"
        @change="handleNewFileChange"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined style="font-size: 48px; color: #1890ff" />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持单个文件上传。支持格式：PDF、DOC、DOCX、PPT、PPTX、XLS、XLSX、ZIP、RAR、MP4、MP3、JPG、PNG等
        </p>
      </a-upload-dragger>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
  ArrowLeftOutlined,
  FileOutlined,
  SwapOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  InboxOutlined,
} from "@ant-design/icons-vue";
import {
  adminResourceApi,
  type ResourceFormData,
  type ResourceItem,
} from "@/api/modules/adminResource";
import {
  ResourceCategoryApi,
  type ResourceCategory,
} from "@/api/modules/resourceCategory";
import QuillEditor from "@/components/common/QuillEditor.vue";

// 创建分类API实例
const resourceCategoryApi = new ResourceCategoryApi();
import type { Rule } from "ant-design-vue/es/form";
import type { UploadProps } from "ant-design-vue";
import dayjs from "dayjs";

// 引入富文本编辑器

const router = useRouter();
const route = useRoute();
const formRef = ref();
const quillEditorRef = ref();

// 状态管理
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const uploading = ref(false);
const categories = ref<ResourceCategory[]>([]);
const resourceData = ref<any>(null);
const replaceModalVisible = ref(false);
const newFileList = ref<any[]>([]);
const thumbnailFileList = ref([]);
const thumbnailUploading = ref(false);

// 表单数据
const formData = reactive<ResourceFormData>({
  title: "",
  description: "",
  categoryId: "",
  fileUrl: "",
  fileName: "",
  fileSize: 0,
  fileType: "",
  thumbnail: "",
  tags: [],
  status: "draft",
  isTop: false,
  isFeatured: false,
  downloadPermission: "public",
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  title: [
    { required: true, message: "请输入资源标题", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "标题长度应在2-100个字符之间",
      trigger: "blur",
    },
  ],
  description: [{ required: true, message: "请输入资源描述", trigger: "blur" }],
  categoryId: [
    { required: true, message: "请选择资源分类", trigger: "change" },
  ],
  type: [{ required: true, message: "请选择资源类型", trigger: "change" }],
};

// 文件类型判断
const isImageFile = computed(() => {
  return formData.fileType?.includes("image");
});

const isVideoFile = computed(() => {
  return formData.fileType?.includes("video");
});

const isAudioFile = computed(() => {
  return formData.fileType?.includes("audio");
});

// 获取资源详情
const fetchResourceDetail = async () => {
  const id = route.params.id as string;
  if (!id) return;

  loading.value = true;
  try {
    const response = await adminResourceApi.getDetail(id);
    resourceData.value = response.data;

    // 填充表单数据
    Object.assign(formData, {
      ...response.data,
      publishDate: response.data.publishDate
        ? dayjs(response.data.publishDate)
        : undefined,
    });
  } catch (error: any) {
    message.error(error.message || "获取资源详情失败");
    router.push("/admin/resources/list");
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await resourceCategoryApi.getList();
    console.log("编辑页面资源分类响应数据:", response);

    // 处理不同的响应格式
    if ((response as any).status === "success") {
      // 处理 { status: 'success', data: [...] } 格式
      categories.value = (response as any).data || [];
    } else if ((response as any).data?.status === "success") {
      // 处理嵌套格式 { data: { status: 'success', data: [...] } }
      categories.value = (response as any).data.data || [];
    } else {
      // 处理标准 ApiResponse 格式 { success: true, data: [...] }
      categories.value = response.data || [];
    }

    console.log("编辑页面解析后的资源分类数据:", categories.value);
  } catch (error: any) {
    console.error("获取资源分类列表失败:", error);
    message.error(error.message || "获取分类列表失败");
  }
};

// 文件上传前验证
const beforeUpload: UploadProps["beforeUpload"] = (file) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-rar-compressed",
    "video/mp4",
    "audio/mp3",
    "audio/mpeg",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    message.error("不支持的文件格式!");
    return false;
  }

  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    message.error("文件大小不能超过 100MB!");
    return false;
  }

  return false; // 阻止自动上传，手动处理
};

// 新文件变化处理
const handleNewFileChange = (info: any) => {
  console.log("新文件选择:", info);
};

// 显示替换文件模态框
const showReplaceModal = () => {
  replaceModalVisible.value = true;
  newFileList.value = [];
};

// 处理文件替换
const handleFileReplace = async () => {
  if (newFileList.value.length === 0) {
    message.error("请选择要上传的文件");
    return;
  }

  uploading.value = true;
  try {
    // 这里应该是实际的文件上传逻辑
    const file = newFileList.value[0];
    formData.fileName = file.name;
    formData.fileSize = file.size;
    formData.fileType = file.type;
    formData.fileUrl = URL.createObjectURL(file);

    message.success("文件替换成功");
    replaceModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || "文件替换失败");
  } finally {
    uploading.value = false;
  }
};

// 删除文件
const removeFile = () => {
  formData.fileUrl = "";
  formData.fileName = "";
  formData.fileSize = 0;
  formData.fileType = "";
  message.success("文件已删除");
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 缩略图上传处理
const beforeThumbnailUpload = (file: any) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("只能上传图片文件！");
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("图片大小不能超过2MB！");
    return false;
  }

  return false; // 阻止自动上传，手动处理
};

const handleThumbnailChange = async (info: any) => {
  if (info.file && !thumbnailUploading.value) {
    thumbnailUploading.value = true;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", info.file);

      const response = await adminResourceApi.upload(formDataUpload);

      if (response.data?.fileUrl) {
        formData.thumbnail = response.data.fileUrl;
        message.success("缩略图上传成功");
      } else {
        throw new Error("上传响应格式错误");
      }
    } catch (error: any) {
      console.error("缩略图上传失败:", error);
      message.error(error.message || "缩略图上传失败");
    } finally {
      thumbnailUploading.value = false;
    }
  }
};

const removeThumbnail = () => {
  formData.thumbnail = "";
  thumbnailFileList.value = [];
  message.success("已删除缩略图");
};

// 格式化日期
const formatDate = (date?: string) => {
  return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
};

// 获取状态颜色和文本
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    published: "success",
    draft: "default",
    archived: "warning",
  };
  return colors[status] || "default";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    published: "已发布",
    draft: "草稿",
    archived: "归档",
  };
  return texts[status] || status;
};

// 保存修改
const handleSave = async () => {
  try {
    saving.value = true;

    await formRef.value.validate();
    await adminResourceApi.update(route.params.id as string, formData);

    message.success("保存成功");
    router.push("/admin/resources/list");
  } catch (error: any) {
    if (error.errorFields) {
      message.error("请检查表单填写是否正确");
    } else {
      message.error(error.message || "保存失败");
    }
  } finally {
    saving.value = false;
  }
};

// 发布资源
const handlePublish = async () => {
  try {
    publishing.value = true;
    formData.status = "published";

    await formRef.value.validate();
    await adminResourceApi.update(route.params.id as string, formData);

    message.success("发布成功");
    router.push("/admin/resources/list");
  } catch (error: any) {
    if (error.errorFields) {
      message.error("请检查表单填写是否正确");
    } else {
      message.error(error.message || "发布失败");
    }
  } finally {
    publishing.value = false;
  }
};

onMounted(async () => {
  await fetchCategories();
  await fetchResourceDetail();
});
</script>

<style scoped lang="scss">
// 复用 ResourcesCreate 的样式
.resources-edit {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;

      .back-btn {
        margin-top: 4px;
        color: #666;

        &:hover {
          color: #1890ff;
        }
      }

      .title-section {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .form-container {
    .main-content {
      .section-card {
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
    }

    .settings-panel {
      .setting-card {
        margin-bottom: 16px;

        :deep(.ant-card-head) {
          padding: 12px 16px;
          min-height: auto;

          .ant-card-head-title {
            font-size: 14px;
            font-weight: 500;
          }
        }

        :deep(.ant-card-body) {
          padding: 16px;
        }
      }
    }
  }

  .file-upload {
    .resource-uploader {
      margin-bottom: 16px;
    }

    .upload-progress {
      margin-top: 16px;
    }
  }

  .file-preview {
    .image-preview {
      text-align: center;

      img {
        max-width: 100%;
        max-height: 400px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .video-preview,
    .audio-preview {
      text-align: center;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;

      .file-icon {
        flex-shrink: 0;
      }

      .file-details {
        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #333;
        }

        p {
          margin: 4px 0;
          color: #666;
          font-size: 14px;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.current-file {
  .file-preview {
    margin-bottom: 16px;
  }

  .file-actions {
    display: flex;
    gap: 12px;
  }
}

.no-file {
  text-align: center;
  padding: 40px;

  .ant-btn {
    margin-top: 16px;
  }
}

.stats-info {
  .stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #666;
      font-size: 14px;
    }

    .value {
      color: #333;
      font-size: 14px;
      font-weight: 500;
    }
  }

  /* 缩略图上传样式 */
  .thumbnail-upload {
    text-align: center;
  }

  .thumbnail-upload :deep(.ant-upload) {
    width: 100%;
    height: 120px;
  }

  .thumbnail-preview {
    position: relative;
    width: 100%;
    height: 120px;
  }

  .thumbnail-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-actions {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .thumbnail-preview:hover .thumbnail-actions {
    opacity: 1;
  }

  .thumbnail-upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 120px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    background: #fafafa;
    cursor: pointer;
    transition: all 0.3s;
  }

  .thumbnail-upload-placeholder:hover {
    border-color: #1890ff;
    background: #f0f8ff;
  }

  .thumbnail-upload-placeholder .anticon {
    font-size: 28px;
    color: #999;
    margin-bottom: 8px;
  }

  .upload-text {
    color: #666;
    font-size: 14px;
  }

  .thumbnail-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
  }
}
</style>
