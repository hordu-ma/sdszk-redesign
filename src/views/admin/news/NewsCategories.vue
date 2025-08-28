<template>
  <div class="news-categories">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>新闻分类管理</h2>
        <p>管理新闻分类，包括创建、编辑、删除等操作</p>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showCreateModal">
          <template #icon>
            <plus-outlined />
          </template>
          新建分类
        </a-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-list">
      <a-table
        :columns="columns"
        :data-source="categories"
        :loading="loading"
        row-key="_id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="category-name">
              <span class="name-text">{{ record.name }}</span>
              <a-tag v-if="record.isDefault" color="blue" size="small">
                默认
              </a-tag>
            </div>
          </template>

          <template v-if="column.key === 'newsCount'">
            <span>{{ record.newsCount || 0 }} 篇</span>
          </template>

          <template v-if="column.key === 'status'">
            <a-switch
              v-model:checked="record.status"
              :checked-value="true"
              :un-checked-value="false"
              @change="handleStatusChange(record)"
            />
          </template>

          <template v-if="column.key === 'createdAt'">
            <span>{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-popconfirm
                :title="`确定要删除分类「${record.name}」吗？`"
                ok-text="确定"
                cancel-text="取消"
                :disabled="record.isDefault"
                @confirm="handleDelete(record)"
              >
                <a-button
                  type="link"
                  size="small"
                  danger
                  :disabled="record.isDefault"
                >
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 创建/编辑分类模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingCategory ? '编辑分类' : '新建分类'"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="modalFormRef"
        :model="modalForm"
        :rules="modalRules"
        layout="vertical"
      >
        <a-form-item label="分类名称" name="name">
          <a-input
            v-model:value="modalForm.name"
            placeholder="请输入分类名称"
            :maxlength="50"
            show-count
            @blur="generateKeyFromName"
          />
        </a-form-item>

        <a-form-item label="分类标识" name="key">
          <a-input
            v-model:value="modalForm.key"
            placeholder="请输入分类标识，如：center、notice、policy"
            :maxlength="50"
            show-count
          />
          <div class="form-help">
            分类标识用于系统内部识别，建议使用英文、数字、短横线，如：center、my-category
          </div>
        </a-form-item>

        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="modalForm.description"
            placeholder="请输入分类描述（可选）"
            :maxlength="200"
            :rows="3"
            show-count
          />
        </a-form-item>

        <a-form-item label="排序" name="sort">
          <a-input-number
            v-model:value="modalForm.sort"
            placeholder="数字越小排序越靠前"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item name="status">
          <a-checkbox v-model:checked="modalForm.status"> 启用分类 </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import { NewsCategoryApi, type NewsCategory } from "@/api/modules/newsCategory";
import type { TableColumnsType } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import type { AxiosResponse } from "axios";

// 创建分类API实例
const newsCategoryApi = new NewsCategoryApi();

// 数据状态
const loading = ref(false);
const categories = ref<NewsCategory[]>([]);
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingCategory = ref<NewsCategory | null>(null);
const modalFormRef = ref();

// 模态框表单
const modalForm = reactive({
  name: "",
  description: "",
  sort: 0,
  status: true,
  key: "",
});

// 表格列配置
const columns: TableColumnsType = [
  {
    title: "分类名称",
    key: "name",
    dataIndex: "name",
    width: 200,
  },
  {
    title: "描述",
    key: "description",
    dataIndex: "description",
    ellipsis: true,
  },
  {
    title: "新闻数量",
    key: "newsCount",
    dataIndex: "newsCount",
    width: 120,
  },
  {
    title: "排序",
    key: "sort",
    dataIndex: "sort",
    width: 100,
    sorter: (a: any, b: any) => a.sort - b.sort,
  },
  {
    title: "状态",
    key: "status",
    dataIndex: "status",
    width: 100,
  },
  {
    title: "创建时间",
    key: "createdAt",
    dataIndex: "createdAt",
    width: 180,
  },
  {
    title: "操作",
    key: "actions",
    width: 150,
    fixed: "right",
  },
];

// 表单验证规则
const modalRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "分类名称长度应在2-50个字符之间",
      trigger: "blur",
    },
  ],
  key: [
    { required: true, message: "请输入分类标识", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "分类标识长度应在2-50个字符之间",
      trigger: "blur",
    },
    {
      pattern: /^[a-z0-9-_]+$/,
      message: "分类标识只能包含小写字母、数字、短横线、下划线",
      trigger: "blur",
    },
  ],
  sort: [
    {
      type: "number",
      min: 0,
      max: 999,
      message: "排序值应在0-999之间",
      trigger: "blur",
    },
  ],
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    console.log("🔄 fetchCategories 开始调用");
    loading.value = true;
    const response = await newsCategoryApi.getList();
    console.log("📡 原始响应:", response);
    console.log("📊 响应类型:", typeof response);
    console.log("📋 响应键:", Object.keys(response || {}));

    // 统一处理不同响应格式
    let data: NewsCategory[] = [];
    if ((response as any).status === "success") {
      // 处理 { status: 'success', data: [...] } 格式
      data = (response as any).data || [];
      console.log("✅ 使用 response.status=success 路径");
    } else if ((response as any).data?.status === "success") {
      // 处理嵌套格式 { data: { status: 'success', data: [...] } }
      data = (response as any).data.data || [];
      console.log("✅ 使用 response.data.status=success 路径");
    } else if (response?.data && Array.isArray(response.data)) {
      // 处理标准 ApiResponse 格式 { success: true, data: [...] }
      data = response.data;
      console.log("✅ 使用 response.data 路径");
    } else if (Array.isArray(response)) {
      data = response;
      console.log("✅ 使用 response 直接路径");
    } else {
      console.warn("⚠️ 无法解析响应数据结构:", response);
    }

    console.log("📦 解析后的数据:", data);
    console.log(
      "🔢 数据类型:",
      typeof data,
      "是否为数组:",
      Array.isArray(data),
    );

    if (!Array.isArray(data)) {
      console.warn("❌ 响应数据不是数组格式:", data);
      categories.value = [];
      return;
    }

    categories.value = data
      .map((item: any) => {
        console.log("🔄 处理项目:", item);
        return {
          ...item,
          sort: item.order, // 表格用 sort 字段
          status: item.isActive, // 直接用布尔值
        };
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log("✅ 最终 categories 数量:", categories.value.length);
    console.log("📋 最终 categories:", categories.value);
  } catch (error: any) {
    console.error("❌ fetchCategories 报错:", error);
    console.error("📊 错误详情:", {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
    });
    message.error(error.message || "获取分类列表失败");
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// 显示创建模态框
const showCreateModal = () => {
  editingCategory.value = null;
  Object.assign(modalForm, {
    name: "",
    description: "",
    sort: 0,
    status: true,
    key: "",
  });
  modalVisible.value = true;
};

// 处理编辑
const handleEdit = (record: NewsCategory) => {
  editingCategory.value = record;
  Object.assign(modalForm, {
    name: record.name,
    description: record.description || "",
    sort: record.order || 0,
    status: record.isActive,
    key: record.key || "",
  });
  modalVisible.value = true;
};

// 处理状态变化
const handleStatusChange = async (record: NewsCategory) => {
  try {
    await newsCategoryApi.update(record._id, {
      isActive: !record.isActive,
    });
    record.isActive = !record.isActive;
    message.success("状态更新成功");
  } catch (error: any) {
    // 恢复原状态
    record.isActive = !record.isActive;
    message.error(error.message || "状态更新失败");
  }
};

// 处理删除
const handleDelete = async (record: NewsCategory) => {
  try {
    await newsCategoryApi.delete(record._id);
    message.success("删除成功");
    fetchCategories();
  } catch (error: any) {
    message.error(error.message || "删除失败");
  }
};

// 处理模态框确认
const handleModalOk = async () => {
  try {
    await modalFormRef.value.validate();
    modalLoading.value = true;

    const data = {
      name: modalForm.name,
      description: modalForm.description,
      order: modalForm.sort,
      isActive: modalForm.status,
      key: modalForm.key,
    };

    if (editingCategory.value) {
      await newsCategoryApi.update(editingCategory.value._id, data);
      message.success("编辑成功");
    } else {
      await newsCategoryApi.create(data);
      message.success("创建成功");
    }

    modalVisible.value = false;
    fetchCategories();
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      message.error("请检查表单填写是否正确");
    } else {
      // 处理API错误
      let errorMessage = "操作失败，请重试";

      // 检查是否是API错误对象
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  } finally {
    modalLoading.value = false;
  }
};

// 处理模态框取消
const handleModalCancel = () => {
  modalVisible.value = false;
  editingCategory.value = null;
};

// 生成分类标识
const generateKeyFromName = () => {
  if (modalForm.name && !modalForm.key) {
    // 将中文转为拼音或简化处理，这里简化为移除特殊字符
    modalForm.key = modalForm.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // 移除特殊字符
      .replace(/\s+/g, "-") // 空格替换为短横线
      .replace(/[^a-z0-9-_]/g, "") // 只保留允许的字符
      .substring(0, 50); // 限制长度
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped lang="scss">
.news-categories {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
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

  .categories-list {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.ant-table) {
      .category-name {
        display: flex;
        align-items: center;
        gap: 8px;

        .name-text {
          font-weight: 500;
        }
      }
    }
  }
}

.form-help {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
