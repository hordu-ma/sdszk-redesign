<template>
  <div class="resources-management">
    <div class="page-header">
      <h2>资源管理</h2>
      <a-button type="primary" @click="showModal">
        <template #icon><plus-outlined /></template>
        添加资源
      </a-button>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a @click="handlePreview(record)">预览</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除这个资源吗？"
                @confirm="() => handleDelete(record)"
              >
                <a class="delete-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ record.type }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'size'">
            {{ formatFileSize(record.size) }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑资源模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      width="800px"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-form-item label="标题" name="title">
          <a-input
            v-model:value="formState.title"
            placeholder="请输入资源标题"
          />
        </a-form-item>
        <a-form-item label="分类" name="type">
          <a-select v-model:value="formState.type" placeholder="请选择资源分类">
            <a-select-option value="视频">视频</a-select-option>
            <a-select-option value="文档">文档</a-select-option>
            <a-select-option value="图片">图片</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="作者" name="author">
          <a-input v-model:value="formState.author" placeholder="请输入作者" />
        </a-form-item>
        <a-form-item label="单位" name="unit">
          <a-input
            v-model:value="formState.unit"
            placeholder="请输入所属单位"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            :rows="4"
            placeholder="请输入资源描述"
          />
        </a-form-item>
        <a-form-item label="文件" name="file">
          <a-upload
            v-model:fileList="fileList"
            :beforeUpload="beforeUpload"
            @change="handleUploadChange"
          >
            <a-button>
              <upload-outlined />
              选择文件
            </a-button>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="资源预览"
      :footer="null"
      width="800px"
    >
      <div class="preview-content">
        <h3>{{ previewData.title }}</h3>
        <p class="preview-meta">
          作者：{{ previewData.author }} | 单位：{{ previewData.unit }}
        </p>
        <div class="preview-description">
          {{ previewData.description }}
        </div>
        <!-- 根据资源类型显示不同的预览内容 -->
        <div class="preview-file">
          <a :href="previewData.url" target="_blank">
            <download-outlined /> 下载文件
          </a>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons-vue";

// 表格列定义
const columns = [
  {
    title: "标题",
    dataIndex: "title",
    key: "title",
    ellipsis: true,
    width: "30%",
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "作者",
    dataIndex: "author",
    key: "author",
  },
  {
    title: "单位",
    dataIndex: "unit",
    key: "unit",
  },
  {
    title: "大小",
    dataIndex: "size",
    key: "size",
    width: "100px",
  },
  {
    title: "上传时间",
    dataIndex: "uploadTime",
    key: "uploadTime",
    sorter: true,
  },
  {
    title: "操作",
    key: "action",
    width: "180px",
  },
];

// 表格数据
const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 获取表格数据
const fetchTableData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    tableData.value = [
      {
        id: 1,
        title: "大中小学思政课一体化教材",
        type: "文档",
        author: "张教授",
        unit: "山东大学",
        size: 1024576, // 1MB
        uploadTime: "2025-04-28",
      },
      {
        id: 2,
        title: "课程思政示范课视频",
        type: "视频",
        author: "李教授",
        unit: "山东师范大学",
        size: 52428800, // 50MB
        uploadTime: "2025-04-29",
      },
    ];
    pagination.total = 100;
  } catch (error) {
    message.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取类型对应的颜色
const getTypeColor = (type) => {
  const colors = {
    视频: "blue",
    文档: "green",
    图片: "purple",
    其他: "orange",
  };
  return colors[type] || "default";
};

// 表格变化处理
const handleTableChange = (pag, filters, sorter) => {
  console.log("table change:", pag, filters, sorter);
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchTableData();
};

// 文件上传相关
const fileList = ref([]);
const beforeUpload = (file) => {
  // 这里可以添加文件类型和大小的校验
  return false; // 阻止自动上传
};

const handleUploadChange = (info) => {
  fileList.value = info.fileList.slice(-1); // 只保留最后一个文件
};

// 编辑模态框相关
const modalVisible = ref(false);
const modalTitle = ref("添加资源");
const formRef = ref(null);
const formState = reactive({
  title: "",
  type: undefined,
  author: "",
  unit: "",
  description: "",
});

const rules = {
  title: [{ required: true, message: "请输入资源标题" }],
  type: [{ required: true, message: "请选择资源类型" }],
  author: [{ required: true, message: "请输入作者" }],
  unit: [{ required: true, message: "请输入所属单位" }],
  description: [{ required: true, message: "请输入资源描述" }],
};

const showModal = () => {
  modalTitle.value = "添加资源";
  formState.title = "";
  formState.type = undefined;
  formState.author = "";
  formState.unit = "";
  formState.description = "";
  fileList.value = [];
  modalVisible.value = true;
};

const handleModalOk = () => {
  formRef.value
    .validate()
    .then(() => {
      if (fileList.value.length === 0) {
        return message.error("请选择上传文件");
      }
      // 在这里处理表单提交
      console.log("form values:", formState);
      console.log("file:", fileList.value[0]);
      modalVisible.value = false;
      message.success("操作成功");
      fetchTableData();
    })
    .catch((error) => {
      console.log("validation failed:", error);
    });
};

const handleModalCancel = () => {
  modalVisible.value = false;
};

// 预览模态框相关
const previewVisible = ref(false);
const previewData = reactive({
  title: "",
  author: "",
  unit: "",
  description: "",
  url: "",
});

const handlePreview = (record) => {
  Object.assign(previewData, record);
  previewVisible.value = true;
};

const handleEdit = (record) => {
  modalTitle.value = "编辑资源";
  Object.assign(formState, record);
  modalVisible.value = true;
};

const handleDelete = (record) => {
  console.log("delete record:", record);
  message.success("删除成功");
  fetchTableData();
};

onMounted(() => {
  fetchTableData();
});
</script>

<style scoped>
.resources-management {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  color: #ff7875;
}

.preview-content {
  padding: 16px;
}

.preview-content h3 {
  margin-bottom: 16px;
  color: #1890ff;
}

.preview-meta {
  color: #666;
  margin-bottom: 16px;
}

.preview-description {
  margin-bottom: 24px;
  line-height: 1.6;
}

.preview-file {
  text-align: center;
  padding: 24px;
  background: #f5f5f5;
  border-radius: 4px;
}

.preview-file a {
  font-size: 16px;
}
</style>
