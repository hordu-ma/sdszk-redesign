<template>
  <div class="simple-editor-wrapper">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <a-space>
        <a-button-group>
          <a-button size="small" @click="insertTable">
            <template #icon>
              <table-outlined />
            </template>
            插入表格
          </a-button>
          <a-button size="small" @click="insertCodeBlock">
            <template #icon>
              <code-outlined />
            </template>
            代码块
          </a-button>
          <a-button size="small" @click="insertImage">
            <template #icon>
              <upload-outlined />
            </template>
            插入图片
          </a-button>
          <a-button size="small" @click="insertLink">
            <template #icon>
              <link-outlined />
            </template>
            插入链接
          </a-button>
        </a-button-group>
        <a-divider type="vertical" />
        <a-button size="small" @click="toggleFullscreen">
          <template #icon>
            <fullscreen-outlined v-if="!isFullscreen" />
            <fullscreen-exit-outlined v-else />
          </template>
          {{ isFullscreen ? "退出全屏" : "全屏编辑" }}
        </a-button>
      </a-space>
    </div>

    <!-- 字数统计 -->
    <div v-if="showWordCount" class="word-count">
      <span>字数：{{ wordCount }}</span>
      <span>字符：{{ charCount }}</span>
      <span v-if="maxLength" :class="{ 'text-danger': charCount > maxLength }">
        / {{ maxLength }}
      </span>
    </div>

    <!-- 编辑器容器 -->
    <div
      ref="editorContainer"
      class="editor-container"
      :class="{
        fullscreen: isFullscreen,
        readonly: readonly,
        error: hasError,
      }"
    >
      <!-- 简单的文本编辑器 -->
      <a-textarea
        v-model:value="content"
        :placeholder="placeholder"
        :disabled="readonly"
        :rows="rows"
        :maxlength="maxLength"
        :auto-size="autoSize"
        class="simple-textarea"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>

    <!-- 图片上传对话框 -->
    <a-modal
      v-model:open="imageModalVisible"
      title="插入图片"
      @ok="handleImageInsert"
      @cancel="imageModalVisible = false"
    >
      <div class="image-upload-form">
        <a-form layout="vertical">
          <a-form-item label="图片链接">
            <a-input
              v-model:value="imageUrl"
              placeholder="请输入图片URL或上传图片"
              :status="imageUrlError ? 'error' : ''"
            />
            <div v-if="imageUrlError" class="error-text">
              {{ imageUrlError }}
            </div>
          </a-form-item>
          <a-form-item label="或者上传图片">
            <a-upload
              :custom-request="handleImageUpload"
              :show-upload-list="false"
              accept="image/*"
              :before-upload="validateImage"
            >
              <a-button :loading="uploading">
                <upload-outlined />
                {{ uploading ? "上传中..." : "选择图片" }}
              </a-button>
            </a-upload>
          </a-form-item>
          <a-form-item label="替代文本">
            <a-input v-model:value="imageAlt" placeholder="图片描述（可选）" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 链接插入对话框 -->
    <a-modal
      v-model:open="linkModalVisible"
      title="插入链接"
      @ok="handleLinkInsert"
      @cancel="linkModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="链接地址" required>
          <a-input
            v-model:value="linkUrl"
            placeholder="https://example.com"
            :status="linkUrlError ? 'error' : ''"
          />
          <div v-if="linkUrlError" class="error-text">
            {{ linkUrlError }}
          </div>
        </a-form-item>
        <a-form-item label="链接文本">
          <a-input v-model:value="linkText" placeholder="链接描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import {
  TableOutlined,
  CodeOutlined,
  LinkOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UploadOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import api from "@/utils/api";

interface Props {
  modelValue?: string;
  placeholder?: string;
  readonly?: boolean;
  showToolbar?: boolean;
  showWordCount?: boolean;
  maxLength?: number;
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  uploadUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入内容...",
  readonly: false,
  showToolbar: true,
  showWordCount: true,
  rows: 10,
  autoSize: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  blur: [value: string];
  focus: [value: string];
  error: [message: string];
}>();

// 响应式数据
const content = ref(props.modelValue);
const isFullscreen = ref(false);
const hasError = ref(false);
const editorContainer = ref<HTMLElement>();

// 对话框状态
const imageModalVisible = ref(false);
const linkModalVisible = ref(false);
const imageUrl = ref("");
const imageAlt = ref("");
const linkUrl = ref("");
const linkText = ref("");

// 验证状态
const imageUrlError = ref("");
const linkUrlError = ref("");
const uploading = ref(false);

// 计算属性
const wordCount = computed(() => {
  return content.value.replace(/\s/g, "").length;
});

const charCount = computed(() => {
  return content.value.length;
});

// 监听器
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== content.value) {
      content.value = newValue;
    }
  },
);

watch(content, (newValue) => {
  emit("update:modelValue", newValue);
});

// 事件处理
const handleChange = () => {
  emit("change", content.value);
};

const handleBlur = () => {
  emit("blur", content.value);
};

const handleFocus = () => {
  emit("focus", content.value);
};

// 工具栏功能
const insertTable = () => {
  const tableMarkdown = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`;
  insertText(tableMarkdown);
};

const insertCodeBlock = () => {
  const codeBlock = "\n```\n// 在这里输入代码\n```\n";
  insertText(codeBlock);
};

const insertLink = () => {
  linkUrl.value = "";
  linkText.value = "";
  linkUrlError.value = "";
  linkModalVisible.value = true;
};

const insertImage = () => {
  imageUrl.value = "";
  imageAlt.value = "";
  imageUrlError.value = "";
  imageModalVisible.value = true;
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
};

// 插入文本
const insertText = (text: string) => {
  try {
    const textarea = editorContainer.value?.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const before = content.value.substring(0, start);
      const after = content.value.substring(end);
      content.value = before + text + after;

      nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      });
    }
  } catch (error) {
    console.error("插入文本时发生错误:", error);
    emit("error", "插入文本失败");
  }
};

// URL验证函数
const isValidUrl = (url: string): boolean => {
  // 支持相对路径URL（如 /uploads/images/xxx.jpg）
  if (url.startsWith("/")) {
    return true;
  }

  // 支持完整HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// 处理图片插入
const handleImageInsert = () => {
  imageUrlError.value = "";

  if (!imageUrl.value.trim()) {
    imageUrlError.value = "请输入图片链接";
    return;
  }

  if (!imageUrl.value.startsWith("blob:") && !isValidUrl(imageUrl.value)) {
    imageUrlError.value = "请输入有效的图片链接";
    return;
  }

  const altText = imageAlt.value.trim() || "图片";
  const imageMarkdown = `![${altText}](${imageUrl.value})`;
  insertText(imageMarkdown);
  imageModalVisible.value = false;
  // 重置表单
  imageUrl.value = "";
  imageAlt.value = "";
  imageUrlError.value = "";
};

// 处理链接插入
const handleLinkInsert = () => {
  linkUrlError.value = "";

  if (!linkUrl.value.trim()) {
    linkUrlError.value = "请输入链接地址";
    return;
  }

  if (!isValidUrl(linkUrl.value)) {
    linkUrlError.value = "请输入有效的链接地址";
    return;
  }

  const text = linkText.value.trim() || linkUrl.value;
  const linkMarkdown = `[${text}](${linkUrl.value})`;
  insertText(linkMarkdown);
  linkModalVisible.value = false;
  // 重置表单
  linkUrl.value = "";
  linkText.value = "";
  linkUrlError.value = "";
};

// 图片验证函数（不阻止上传）
const validateImage = (file: File) => {
  console.log("开始验证图片:", file.name, file.type, file.size);

  try {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      const errorMsg = "只能上传图片文件!";
      console.error(errorMsg);
      emit("error", errorMsg);
      hasError.value = true;
      message.error(errorMsg);
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      const errorMsg = "图片大小不能超过 2MB!";
      console.error(errorMsg);
      emit("error", errorMsg);
      hasError.value = true;
      message.error(errorMsg);
      return false;
    }

    hasError.value = false;
    console.log("图片验证通过");
    return true; // 返回true允许继续上传
  } catch (error) {
    const errorMsg = "处理图片时发生错误";
    console.error(errorMsg, error);
    emit("error", errorMsg);
    hasError.value = true;
    message.error(errorMsg);
    return false;
  }
};

// 处理图片上传
const handleImageUpload = async ({ file }: any) => {
  console.log("开始上传图片:", file.name);

  try {
    uploading.value = true;

    // 创建FormData
    const formData = new FormData();
    formData.append("file", file);

    console.log("发送上传请求到 /api/upload/single");

    // 使用项目统一的API实例（会自动添加认证token）
    const response = await api.post("/api/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("上传响应:", response.data);

    if (response.data && response.data.status === "success") {
      // 使用服务器返回的真实URL
      imageUrl.value = response.data.data.fileUrl;
      console.log("设置图片URL:", imageUrl.value);
      message.success("图片上传成功");

      // 上传成功后自动插入图片到编辑器
      nextTick(() => {
        console.log("自动插入图片到编辑器");

        // 清除任何现有的错误状态
        imageUrlError.value = "";

        // 直接插入图片到编辑器 - 使用HTML格式而非Markdown
        const altText = imageAlt.value.trim() || "图片";
        const imageHtml = `<img src="${imageUrl.value}" alt="${altText}" style="max-width: 100%;" />`;
        insertText(imageHtml);

        // 关闭对话框并重置表单
        imageModalVisible.value = false;
        imageUrl.value = "";
        imageAlt.value = "";
        imageUrlError.value = "";

        console.log("图片插入完成，对话框已关闭");
      });
    } else {
      throw new Error(`上传响应格式错误: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.error("图片上传失败:", error);
    console.error("错误详情:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "图片上传失败";
    message.error(errorMsg);
    emit("error", errorMsg);
    hasError.value = true;
  } finally {
    uploading.value = false;
    console.log("上传流程结束");
  }
};

// 清理函数
const cleanup = () => {
  if (isFullscreen.value) {
    document.body.style.overflow = "auto";
  }

  // 清理图片URL
  if (imageUrl.value && imageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imageUrl.value);
  }
};

// 组件卸载时清理
onUnmounted(() => {
  cleanup();
});

// 暴露方法
defineExpose({
  insertText,
  insertImage,
  toggleFullscreen,
  cleanup,
});
</script>

<style scoped>
.simple-editor-wrapper {
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
}

.editor-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.word-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 10;
}

.word-count .text-danger {
  color: #ff4d4f;
}

.editor-container {
  position: relative;
  transition: all 0.3s ease;
}

.editor-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #fff;
  border-radius: 0;
}

.editor-container.readonly {
  background: #f5f5f5;
}

.editor-container.error {
  border-color: #ff4d4f;
}

.simple-textarea {
  border: none !important;
  box-shadow: none !important;
  resize: vertical;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  line-height: 1.6;
}

.simple-textarea:focus {
  border: none !important;
  box-shadow: none !important;
}

.fullscreen .simple-textarea {
  height: calc(100vh - 120px) !important;
  resize: none;
}

.image-upload-form {
  margin-top: 16px;
}

.error-text {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
  }

  .word-count {
    font-size: 11px;
    bottom: 6px;
    right: 8px;
  }
}
</style>
