<template>
  <div class="quill-editor-wrapper">
    <!-- 工具栏扩展 -->
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
      <span
        v-if="maxLength"
        :class="{ 'limit-warning': charCount > maxLength * 0.9 }"
      >
        限制：{{ charCount }}/{{ maxLength }}
      </span>
    </div>

    <!-- 编辑器主体 -->
    <div :class="['editor-container', { fullscreen: isFullscreen }]">
      <QuillEditor
        ref="quillRef"
        :content="modelValue"
        content-type="html"
        :options="editorOptions"
        @update:content="handleContentChange"
        @ready="onEditorReady"
        class="quill-editor"
      />
    </div>

    <!-- 图片上传模态框 -->
    <a-modal
      v-model:open="imageModalVisible"
      title="插入图片"
      @ok="handleImageUpload"
      @cancel="imageModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="图片URL">
          <a-input
            v-model:value="imageUrl"
            placeholder="请输入图片URL"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="或上传图片">
          <a-upload
            v-model:file-list="imageFileList"
            :before-upload="beforeImageUpload"
            :custom-request="customImageUpload"
            list-type="picture-card"
            :show-upload-list="false"
          >
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="预览" />
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined />
              <div>上传图片</div>
            </div>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 链接插入模态框 -->
    <a-modal
      v-model:open="linkModalVisible"
      title="插入链接"
      @ok="handleLinkInsert"
      @cancel="linkModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="链接地址">
          <a-input
            v-model:value="linkUrl"
            placeholder="请输入链接地址"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="链接文本">
          <a-input
            v-model:value="linkText"
            placeholder="请输入链接文本"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="linkNewWindow">
            在新窗口打开
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 表格插入模态框 -->
    <a-modal
      v-model:open="tableModalVisible"
      title="插入表格"
      @ok="handleTableInsert"
      @cancel="tableModalVisible = false"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="行数">
              <a-input-number
                v-model:value="tableRows"
                :min="1"
                :max="20"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="列数">
              <a-input-number
                v-model:value="tableCols"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from "vue";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import {
  TableOutlined,
  CodeOutlined,
  LinkOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PlusOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

interface Props {
  modelValue: string;
  placeholder?: string;
  height?: string;
  readonly?: boolean;
  theme?: "snow" | "bubble";
  showToolbar?: boolean;
  showWordCount?: boolean;
  maxLength?: number;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
  (e: "wordCount", count: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "请输入内容...",
  height: "300px",
  readonly: false,
  theme: "snow",
  showToolbar: true,
  showWordCount: true,
  maxLength: 0,
});

const emit = defineEmits<Emits>();

const quillRef = ref<any>(null);
let quillInstance: any = null;

// 状态管理
const isFullscreen = ref(false);
const wordCount = ref(0);
const charCount = ref(0);

// 模态框状态
const imageModalVisible = ref(false);
const linkModalVisible = ref(false);
const tableModalVisible = ref(false);

// 图片上传相关
const imageUrl = ref("");
const imageFileList = ref([]);
const imagePreview = ref("");

// 链接插入相关
const linkUrl = ref("");
const linkText = ref("");
const linkNewWindow = ref(true);

// 表格插入相关
const tableRows = ref(3);
const tableCols = ref(3);

// 编辑器配置
const editorOptions = computed(() => ({
  theme: props.theme,
  placeholder: props.placeholder,
  readOnly: props.readonly,
  modules: {
    toolbar: [
      // 文本格式
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],

      // 文本样式
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],

      // 段落格式
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],

      // 插入内容
      ["link", "image", "video"],
      ["blockquote", "code-block"],

      // 其他
      ["clean"],
    ],
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true,
    },
    keyboard: {
      bindings: {
        tab: {
          key: 9,
          handler: function () {
            return true;
          },
        },
      },
    },
  },
}));

// 内容变化处理
const handleContentChange = (content: string) => {
  emit("update:modelValue", content);
  emit("change", content);
  updateWordCount(content);
};

// 更新字数统计
const updateWordCount = (content: string) => {
  // 移除HTML标签计算纯文本
  const textContent = content.replace(/<[^>]*>/g, "");
  wordCount.value = textContent.length;
  charCount.value = content.length;
  emit("wordCount", wordCount.value);
};

// 编辑器准备就绪
const onEditorReady = (quill: any) => {
  quillInstance = quill;

  // 设置编辑器高度
  try {
    if (quill && quill.root) {
      quill.root.style.minHeight = props.height;
    }
  } catch (e) {
    // 容错
  }

  // 初始化字数统计
  updateWordCount(props.modelValue);
};

// 工具栏功能
const insertTable = () => {
  tableModalVisible.value = true;
};

const insertCodeBlock = () => {
  if (quillInstance) {
    quillInstance.format("code-block", true);
  }
};

const insertLink = () => {
  linkModalVisible.value = true;
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

// 图片上传处理
const beforeImageUpload = (file: File) => {
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
  return true;
};

const customImageUpload = ({ file }: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string;
    imageUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const handleImageUpload = () => {
  if (imageUrl.value && quillInstance) {
    const range = quillInstance.getSelection();
    if (range) {
      quillInstance.insertEmbed(range.index, "image", imageUrl.value);
    }
    imageModalVisible.value = false;
    imageUrl.value = "";
    imagePreview.value = "";
    imageFileList.value = [];
  }
};

// 链接插入处理
const handleLinkInsert = () => {
  if (linkUrl.value && quillInstance) {
    const range = quillInstance.getSelection();
    if (range) {
      const linkText =
        range.length > 0
          ? quillInstance.getText(range.index, range.length)
          : "链接";
      const linkHTML = `<a href="${linkUrl.value}"${linkNewWindow.value ? ' target="_blank"' : ""}>${linkText}</a>`;
      quillInstance.clipboard.dangerouslyPasteHTML(range.index, linkHTML);
    }
    linkModalVisible.value = false;
    linkUrl.value = "";
    linkText.value = "";
  }
};

// 表格插入处理
const handleTableInsert = () => {
  if (quillInstance) {
    const range = quillInstance.getSelection();
    if (range) {
      let tableHTML =
        '<table border="1" style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < tableRows.value; i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < tableCols.value; j++) {
          tableHTML +=
            '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
        }
        tableHTML += "</tr>";
      }
      tableHTML += "</table>";
      quillInstance.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
    }
    tableModalVisible.value = false;
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (
      quillInstance &&
      quillInstance.root &&
      quillInstance.root.innerHTML !== newValue
    ) {
      quillInstance.root.innerHTML = newValue;
      updateWordCount(newValue);
    }
  }
);

// 获取编辑器实例方法
const getQuill = () => quillInstance;
const getText = () => (quillInstance ? quillInstance.getText() : "");
const getHTML = () => (quillInstance ? quillInstance.root.innerHTML : "");
const setHTML = (html: string) => {
  if (quillInstance && quillInstance.root) {
    quillInstance.root.innerHTML = html;
    updateWordCount(html);
  }
};
const insertText = (text: string, index?: number) => {
  if (quillInstance) {
    const insertIndex = index !== undefined ? index : quillInstance.getLength();
    quillInstance.insertText(insertIndex, text);
  }
};
const insertHTML = (html: string, index?: number) => {
  if (quillInstance) {
    const insertIndex = index !== undefined ? index : quillInstance.getLength();
    quillInstance.clipboard.dangerouslyPasteHTML(insertIndex, html);
  }
};
const clear = () => {
  if (quillInstance) {
    quillInstance.root.innerHTML = "";
    updateWordCount("");
  }
};
const focus = () => {
  if (quillInstance) {
    quillInstance.focus();
  }
};

defineExpose({
  getQuill,
  getText,
  getHTML,
  setHTML,
  insertText,
  insertHTML,
  clear,
  focus,
  wordCount,
  charCount,
});

onMounted(() => {
  // 监听ESC键退出全屏
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen.value) {
      toggleFullscreen();
    }
  };
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  // 清理全屏状态
  if (isFullscreen.value) {
    document.body.style.overflow = "";
  }

  // 彻底销毁 quill 实例
  if (quillInstance && typeof quillInstance.destroy === "function") {
    quillInstance.destroy();
  }
  quillInstance = null;
});
</script>

<style lang="scss">
.quill-editor-wrapper {
  position: relative;

  .editor-toolbar {
    background: #fafafa;
    padding: 12px 16px;
    border: 1px solid #d9d9d9;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .word-count {
    background: #f5f5f5;
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    border-top: none;
    border-radius: 0 0 6px 6px;
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #666;

    .limit-warning {
      color: #faad14;
      font-weight: 500;
    }
  }

  .editor-container {
    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      background: white;
      padding: 20px;

      .quill-editor {
        height: calc(100vh - 120px);
      }
    }
  }

  .quill-editor {
    border: 1px solid #d9d9d9;
    border-radius: 6px;

    &:hover {
      border-color: #40a9ff;
    }

    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    .ql-toolbar {
      border-bottom: 1px solid #d9d9d9;
      border-radius: 6px 6px 0 0;
      background-color: #fafafa;

      .ql-formats {
        margin-right: 15px;
      }

      button {
        &:hover {
          color: #1890ff;
        }

        &.ql-active {
          color: #1890ff;
        }
      }

      .ql-picker {
        &:hover .ql-picker-label {
          color: #1890ff;
        }

        &.ql-expanded .ql-picker-label {
          color: #1890ff;
        }
      }
    }

    .ql-container {
      border: none;
      border-radius: 0 0 6px 6px;
      font-size: 14px;

      .ql-editor {
        line-height: 1.6;
        color: #262626;

        &.ql-blank::before {
          color: #bfbfbf;
          font-style: normal;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 0.5em 0;
          color: #262626;
        }

        p {
          margin: 0.5em 0;
        }

        ul,
        ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }

        blockquote {
          border-left: 3px solid #1890ff;
          margin: 1em 0;
          padding-left: 1em;
          color: #595959;
          background-color: #f6f6f6;
        }

        code {
          background-color: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 3px;
          color: #d73e48;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          font-size: 0.85em;
          padding: 2px 4px;
        }

        pre {
          background-color: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 3px;
          color: #262626;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          font-size: 0.85em;
          overflow-x: auto;
          padding: 1em;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        a {
          color: #1890ff;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;

          td,
          th {
            border: 1px solid #d9d9d9;
            padding: 8px 12px;
            text-align: left;
          }

          th {
            background-color: #fafafa;
            font-weight: 600;
          }

          tr:nth-child(even) {
            background-color: #fafafa;
          }
        }
      }
    }
  }

  // 只读模式样式
  &.readonly {
    .quill-editor {
      .ql-toolbar {
        display: none;
      }

      .ql-container {
        border-radius: 6px;
      }
    }
  }

  // 错误状态样式
  &.error {
    .quill-editor {
      border-color: #ff4d4f;

      &:focus-within {
        border-color: #ff4d4f;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .quill-editor-wrapper {
    .quill-editor {
      .ql-toolbar {
        background-color: #1f1f1f;
        border-color: #434343;

        button {
          color: #fff;

          &:hover {
            color: #40a9ff;
          }
        }

        .ql-picker-label {
          color: #fff;
        }
      }

      .ql-container {
        .ql-editor {
          background-color: #141414;
          color: #fff;

          &.ql-blank::before {
            color: #8c8c8c;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            color: #fff;
          }

          blockquote {
            background-color: #262626;
            color: #bfbfbf;
          }

          code,
          pre {
            background-color: #262626;
            border-color: #434343;
            color: #fff;
          }

          table {
            td,
            th {
              border-color: #434343;
            }

            th,
            tr:nth-child(even) {
              background-color: #262626;
            }
          }
        }
      }
    }
  }

  // 图片上传样式
  .image-preview {
    position: relative;
    width: 100px;
    height: 100px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    color: #666;
    font-size: 12px;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
}
</style>
