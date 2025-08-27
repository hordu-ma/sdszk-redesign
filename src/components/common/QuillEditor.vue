<template>
  <div class="simple-editor-wrapper">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <a-space>
        <a-button-group>
          <a-button size="small" @click="insertTable">
            <template #icon>
              <TableOutlined />
            </template>
            插入表格
          </a-button>
          <a-button size="small" @click="insertCodeBlock">
            <template #icon>
              <CodeOutlined />
            </template>
            代码块
          </a-button>
          <a-button size="small" @click="insertLink">
            <template #icon>
              <LinkOutlined />
            </template>
            插入链接
          </a-button>
        </a-button-group>
        <a-divider type="vertical" />
        <a-button size="small" @click="toggleFullscreen">
          <template #icon>
            <FullscreenOutlined v-if="!isFullscreen" />
            <FullscreenExitOutlined v-else />
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
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
        class="simple-textarea"
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
            />
          </a-form-item>
          <a-form-item label="或者上传图片">
            <a-upload
              :before-upload="beforeImageUpload"
              :show-upload-list="false"
              accept="image/*"
            >
              <a-button>
                <UploadOutlined />
                选择图片
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
          <a-input v-model:value="linkUrl" placeholder="https://example.com" />
        </a-form-item>
        <a-form-item label="链接文本">
          <a-input v-model:value="linkText" placeholder="链接描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  TableOutlined,
  CodeOutlined,
  LinkOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UploadOutlined,
} from "@ant-design/icons-vue";

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
  linkModalVisible.value = true;
};

const insertImage = () => {
  imageUrl.value = "";
  imageAlt.value = "";
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
  const textarea = editorContainer.value?.querySelector("textarea");
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.value.substring(0, start);
    const after = content.value.substring(end);
    content.value = before + text + after;

    nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    });
  }
};

// 处理图片插入
const handleImageInsert = () => {
  if (imageUrl.value) {
    const imageMarkdown = `![${imageAlt.value || "图片"}](${imageUrl.value})`;
    insertText(imageMarkdown);
    imageModalVisible.value = false;
  }
};

// 处理链接插入
const handleLinkInsert = () => {
  if (linkUrl.value) {
    const linkMarkdown = `[${linkText.value || linkUrl.value}](${linkUrl.value})`;
    insertText(linkMarkdown);
    linkModalVisible.value = false;
  }
};

// 图片上传前处理
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    console.error("只能上传图片文件!");
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    console.error("图片大小不能超过 2MB!");
    return false;
  }

  // 创建临时URL用于预览
  const url = URL.createObjectURL(file);
  imageUrl.value = url;

  return false; // 阻止自动上传
};

// 清理函数
const cleanup = () => {
  if (isFullscreen.value) {
    document.body.style.overflow = "auto";
  }
};

// 暴露方法
defineExpose({
  insertText,
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
