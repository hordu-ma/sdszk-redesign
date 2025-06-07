<template>
  <div class="quill-editor-wrapper">
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

interface Props {
  modelValue: string
  placeholder?: string
  height?: string
  readonly?: boolean
  theme?: 'snow' | 'bubble'
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入内容...',
  height: '300px',
  readonly: false,
  theme: 'snow',
})

const emit = defineEmits<Emits>()

const quillRef = ref()

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
      [{ size: ['small', false, 'large', 'huge'] }],

      // 文本样式
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],

      // 段落格式
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],

      // 插入内容
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],

      // 其他
      ['clean'],
    ],
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true,
    },
  },
}))

// 内容变化处理
const handleContentChange = (content: string) => {
  emit('update:modelValue', content)
  emit('change', content)
}

// 编辑器准备就绪
const onEditorReady = (quill: any) => {
  // 设置编辑器高度
  if (quillRef.value) {
    const editorElement = quillRef.value.$el.querySelector('.ql-editor')
    if (editorElement) {
      editorElement.style.minHeight = props.height
    }
  }
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newValue => {
    if (quillRef.value && quillRef.value.getHTML() !== newValue) {
      quillRef.value.setHTML(newValue)
    }
  }
)

// 获取编辑器实例方法
const getQuill = () => {
  return quillRef.value?.getQuill()
}

// 获取文本内容
const getText = () => {
  return quillRef.value?.getText() || ''
}

// 获取HTML内容
const getHTML = () => {
  return quillRef.value?.getHTML() || ''
}

// 设置内容
const setHTML = (html: string) => {
  quillRef.value?.setHTML(html)
}

// 插入文本
const insertText = (text: string, index?: number) => {
  const quill = getQuill()
  if (quill) {
    const insertIndex = index !== undefined ? index : quill.getLength()
    quill.insertText(insertIndex, text)
  }
}

// 插入HTML
const insertHTML = (html: string, index?: number) => {
  const quill = getQuill()
  if (quill) {
    const insertIndex = index !== undefined ? index : quill.getLength()
    quill.clipboard.dangerouslyPasteHTML(insertIndex, html)
  }
}

// 清空内容
const clear = () => {
  quillRef.value?.setHTML('')
}

// 聚焦编辑器
const focus = () => {
  const quill = getQuill()
  if (quill) {
    quill.focus()
  }
}

// 暴露方法给父组件
defineExpose({
  getQuill,
  getText,
  getHTML,
  setHTML,
  insertText,
  insertHTML,
  clear,
  focus,
})

onBeforeUnmount(() => {
  // 清理编辑器
  if (quillRef.value) {
    const quill = getQuill()
    if (quill) {
      quill.off('text-change')
    }
  }
})
</script>

<style lang="scss">
.quill-editor-wrapper {
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
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.85em;
          padding: 2px 4px;
        }

        pre {
          background-color: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 3px;
          color: #262626;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
}
</style>
