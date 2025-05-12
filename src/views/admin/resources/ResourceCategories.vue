# filepath:
/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/resources/ResourceCategories.vue
<template>
  <div class="resource-categories">
    <div class="page-header">
      <h1>资源分类</h1>
      <a-button type="primary" @click="showAddModal">
        <PlusOutlined /> 添加分类
      </a-button>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="categories"
        :loading="loading"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="editCategory(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除这个分类吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteCategory(record.id)"
              >
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑分类的模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEditing ? '编辑分类' : '添加分类'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
    >
      <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="分类名称" name="name">
          <a-input
            v-model:value="formState.name"
            placeholder="请输入分类名称"
          />
        </a-form-item>
        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            placeholder="请输入分类描述"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="排序" name="order">
          <a-input-number
            v-model:value="formState.order"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";

export default {
  name: "ResourceCategories",
  components: {
    PlusOutlined,
  },

  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const isEditing = ref(false);
    const formRef = ref();

    // 表格列定义
    const columns = [
      {
        title: "分类名称",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "描述",
        dataIndex: "description",
        key: "description",
      },
      {
        title: "包含资源数",
        dataIndex: "resourceCount",
        key: "resourceCount",
      },
      {
        title: "排序",
        dataIndex: "order",
        key: "order",
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        key: "updatedAt",
      },
      {
        title: "操作",
        key: "action",
        align: "center",
        width: 150,
      },
    ];

    // 分类数据
    const categories = ref([]);

    // 表单数据
    const formState = reactive({
      id: null,
      name: "",
      description: "",
      order: 0,
    });

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: "请输入分类名称", trigger: "blur" },
        {
          min: 2,
          max: 50,
          message: "分类名称长度应在2-50个字符之间",
          trigger: "blur",
        },
      ],
      description: [
        { max: 200, message: "描述不能超过200个字符", trigger: "blur" },
      ],
      order: [
        { required: true, message: "请输入排序值", trigger: "blur" },
        { type: "number", message: "排序值必须为数字", trigger: "blur" },
      ],
    };

    // 加载分类数据
    const loadCategories = async () => {
      try {
        loading.value = true;
        // TODO: 从API获取分类数据
        // 模拟数据
        categories.value = [
          {
            id: 1,
            name: "教学课件",
            description: "各门课程的教学课件资源",
            resourceCount: 25,
            order: 1,
            updatedAt: "2023-06-20 14:30:00",
          },
          {
            id: 2,
            name: "教学视频",
            description: "教学相关的视频资源",
            resourceCount: 15,
            order: 2,
            updatedAt: "2023-06-19 16:20:00",
          },
          {
            id: 3,
            name: "教案资源",
            description: "教师教案和教学设计文档",
            resourceCount: 30,
            order: 3,
            updatedAt: "2023-06-18 09:15:00",
          },
        ];
      } catch (error) {
        message.error("加载分类数据失败");
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 显示添加模态框
    const showAddModal = () => {
      isEditing.value = false;
      formState.id = null;
      formState.name = "";
      formState.description = "";
      formState.order = 0;
      modalVisible.value = true;
    };

    // 显示编辑模态框
    const editCategory = (record) => {
      isEditing.value = true;
      formState.id = record.id;
      formState.name = record.name;
      formState.description = record.description;
      formState.order = record.order;
      modalVisible.value = true;
    };

    // 处理模态框确认
    const handleModalOk = () => {
      formRef.value
        .validate()
        .then(() => {
          modalLoading.value = true;
          // TODO: 调用API保存分类数据
          setTimeout(() => {
            modalLoading.value = false;
            modalVisible.value = false;
            message.success(isEditing.value ? "分类更新成功" : "分类添加成功");
            loadCategories();
          }, 1000);
        })
        .catch((error) => {
          console.log("验证失败:", error);
        });
    };

    // 处理模态框取消
    const handleModalCancel = () => {
      modalVisible.value = false;
      formRef.value.resetFields();
    };

    // 删除分类
    const deleteCategory = async (id) => {
      try {
        // TODO: 调用API删除分类
        message.success("分类删除成功");
        loadCategories();
      } catch (error) {
        message.error("删除分类失败");
        console.error(error);
      }
    };

    onMounted(() => {
      loadCategories();
    });

    return {
      loading,
      columns,
      categories,
      modalVisible,
      modalLoading,
      isEditing,
      formRef,
      formState,
      rules,
      showAddModal,
      editCategory,
      handleModalOk,
      handleModalCancel,
      deleteCategory,
    };
  },
};
</script>

<style scoped>
.resource-categories {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.danger-link {
  color: #ff4d4f;
}

.danger-link:hover {
  color: #ff7875;
}
</style>
