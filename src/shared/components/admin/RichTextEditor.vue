<!-- RichTextEditor.vue - 富文本编辑器组件 -->
<template>
  <div class="editor-wrapper" :class="{ focused }">
    <!-- 编辑器工具栏 -->
    <div ref="editorToolbar" class="editor-toolbar"></div>

    <!-- 编辑区 -->
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { message } from "ant-design-vue";

// 自定义图片处理模块
const ImageHandler = {
  upload(quillInstance, uploadUrl, headers) {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      try {
        const file = input.files[0];

        // 检查文件类型
        if (!file.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
          message.error("只能上传图片文件 (JPG, PNG, GIF)");
          return;
        }

        // 检查文件大小
        if (file.size > 5 * 1024 * 1024) {
          // 5MB
          message.error("图片大小不能超过5MB");
          return;
        }

        // 创建FormData
        const formData = new FormData();
        formData.append("file", file);

        // 显示上传中消息
        const loadingMsg = message.loading("上传图片中...", 0);

        // 获取光标位置
        const range = quillInstance.getSelection(true);

        // 上传图片
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: headers,
          body: formData,
        });

        // 关闭加载消息
        loadingMsg();

        // 检查响应
        if (!response.ok) {
          throw new Error("上传失败");
        }

        const result = await response.json();

        if (result.status === "success" && result.data && result.data.url) {
          // 插入图片
          quillInstance.insertEmbed(range.index, "image", result.data.url);
          // 移动光标到图片后
          quillInstance.setSelection(range.index + 1);
          message.success("图片上传成功");
        } else {
          throw new Error(result.message || "上传失败");
        }
      } catch (error) {
        console.error("图片上传失败:", error);
        message.error("图片上传失败: " + error.message);
      }
    };
  },
};

export default {
  name: "RichTextEditor",

  props: {
    value: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "请输入内容...",
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    uploadUrl: {
      type: String,
      default: "/api/uploads/image",
    },
    uploadHeaders: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ["update:value"],

  setup(props, { emit }) {
    const editorToolbar = ref(null);
    const editorContainer = ref(null);
    const editor = ref(null);
    const focused = ref(false);

    // 编辑器配置
    const toolbarOptions = [
      ["bold", "italic", "underline", "strike"],
      [{ header: 1 }, { header: 2 }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ size: ["small", false, "large", "huge"] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["clean"],
      ["link", "image", "video"],
    ];

    // 初始化编辑器
    const initEditor = () => {
      if (!editorContainer.value || !editorToolbar.value) return;

      // Quill 配置
      editor.value = new Quill(editorContainer.value, {
        modules: {
          toolbar: {
            container: editorToolbar.value,
            handlers: {
              image: function () {
                ImageHandler.upload(
                  editor.value,
                  props.uploadUrl,
                  props.uploadHeaders
                );
              },
            },
          },
        },
        placeholder: props.placeholder,
        readOnly: props.readOnly,
        theme: "snow",
      });

      // 设置初始内容
      if (props.value) {
        editor.value.clipboard.dangerouslyPasteHTML(props.value);
      }

      // 监听内容变化
      editor.value.on("text-change", () => {
        const html =
          editorContainer.value.querySelector(".ql-editor").innerHTML;
        emit("update:value", html);
      });

      // 监听焦点
      editor.value.on("selection-change", (range) => {
        focused.value = !!range;
      });
    };

    // 监听 props.value 变化
    watch(
      () => props.value,
      (newValue) => {
        if (editor.value) {
          if (
            newValue !==
            editorContainer.value.querySelector(".ql-editor").innerHTML
          ) {
            editor.value.clipboard.dangerouslyPasteHTML(newValue || "");
          }
        }
      }
    );

    // 监听 readOnly 变化
    watch(
      () => props.readOnly,
      (newValue) => {
        if (editor.value) {
          editor.value.enable(!newValue);
        }
      }
    );

    // 组件挂载后初始化编辑器
    onMounted(() => {
      initEditor();
    });

    // 组件卸载前销毁编辑器
    onBeforeUnmount(() => {
      if (editor.value) {
        editor.value = null;
      }
    });

    return {
      editorToolbar,
      editorContainer,
      focused,
    };
  },
};
</script>

<style>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: border-color 0.3s;
}

.editor-wrapper.focused .editor-toolbar {
  border-color: #40a9ff;
}

.editor-wrapper.focused .editor-container {
  border-color: #40a9ff;
}

.editor-toolbar {
  border-top: 1px solid #d9d9d9;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
}

.editor-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 2px;
}

.ql-toolbar.ql-snow {
  border: none !important;
}

.ql-container.ql-snow {
  border: none !important;
}

.ql-editor {
  min-height: 200px;
  font-size: 14px;
  line-height: 1.6;
}

.ql-editor h1,
.ql-editor h2,
.ql-editor h3,
.ql-editor h4,
.ql-editor h5,
.ql-editor h6 {
  margin-top: 16px;
  margin-bottom: 8px;
}

.ql-editor p {
  margin-bottom: 8px;
}

.ql-editor img {
  max-width: 100%;
  height: auto;
}
</style>
