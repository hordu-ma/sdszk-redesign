<template>
  <div class="news-management">
    <div class="page-header">
      <h2>新闻管理</h2>
      <a-button type="primary" @click="showModal">
        <template #icon><plus-outlined /></template>
        添加新闻
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
              <a-popconfirm
                title="确定要删除这条新闻吗？"
                @confirm="() => handleDelete(record)"
              >
                <a class="delete-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === '已发布' ? 'green' : 'orange'">
              {{ record.status }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑新闻模态框 -->
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
            placeholder="请输入新闻标题"
          />
        </a-form-item>
        <a-form-item label="分类" name="category">
          <a-select
            v-model:value="formState.category"
            placeholder="请选择新闻分类"
          >
            <a-select-option value="中心动态">中心动态</a-select-option>
            <a-select-option value="通知公告">通知公告</a-select-option>
            <a-select-option value="政策文件">政策文件</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="发布单位" name="unit">
          <a-input
            v-model:value="formState.unit"
            placeholder="请输入发布单位"
          />
        </a-form-item>
        <a-form-item label="内容" name="content">
          <a-textarea
            v-model:value="formState.content"
            :rows="6"
            placeholder="请输入新闻内容"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formState.status">
            <a-radio value="已发布">发布</a-radio>
            <a-radio value="草稿">保存为草稿</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";

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
    title: "分类",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "发布单位",
    dataIndex: "unit",
    key: "unit",
  },
  {
    title: "发布时间",
    dataIndex: "publishTime",
    key: "publishTime",
    sorter: true,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "操作",
    key: "action",
    width: "150px",
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
        title: "关于举办2025年度思政课教学创新大赛的通知",
        category: "通知公告",
        unit: "山东省教育厅",
        publishTime: "2025-04-28",
        status: "已发布",
      },
      {
        id: 2,
        title: '校际协同，星辰引航："星空下的思政课"开讲',
        category: "中心动态",
        unit: "青岛理工大学",
        publishTime: "2025-04-29",
        status: "已发布",
      },
    ];
    pagination.total = 100;
  } catch (error) {
    message.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 表格变化处理
const handleTableChange = (pag, filters, sorter) => {
  console.log("table change:", pag, filters, sorter);
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchTableData();
};

// 模态框相关
const modalVisible = ref(false);
const modalTitle = ref("添加新闻");
const formRef = ref(null);
const formState = reactive({
  title: "",
  category: undefined,
  unit: "",
  content: "",
  status: "草稿",
});

const rules = {
  title: [{ required: true, message: "请输入新闻标题" }],
  category: [{ required: true, message: "请选择新闻分类" }],
  unit: [{ required: true, message: "请输入发布单位" }],
  content: [{ required: true, message: "请输入新闻内容" }],
  status: [{ required: true, message: "请选择发布状态" }],
};

const showModal = () => {
  modalTitle.value = "添加新闻";
  formState.title = "";
  formState.category = undefined;
  formState.unit = "";
  formState.content = "";
  formState.status = "草稿";
  modalVisible.value = true;
};

const handleModalOk = () => {
  formRef.value
    .validate()
    .then(() => {
      // 在这里处理表单提交
      console.log("form values:", formState);
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

const handleEdit = (record) => {
  modalTitle.value = "编辑新闻";
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
.news-management {
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
</style>
