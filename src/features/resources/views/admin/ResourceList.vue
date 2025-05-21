<template>
  <div class="resource-list-container">
    <div class="header-actions">
      <h2>资源管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加资源
      </el-button>
    </div>

    <el-table :data="resources" style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="资源标题" min-width="200" />
      <el-table-column prop="type" label="资源类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '已发布' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" link @click="handleEdit(row.id)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" link @click="handlePreview(row.id)">
              <el-icon><View /></el-icon>预览
            </el-button>
            <el-popconfirm
              title="确定要删除这条资源吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link>
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { Plus, Edit, Delete, View } from "@element-plus/icons-vue";

const router = useRouter();
const loading = ref(false);
const resources = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const getTypeTagType = (type) => {
  const typeMap = {
    文档: "success",
    视频: "warning",
    音频: "info",
    图片: "danger",
    其他: "",
  };
  return typeMap[type] || "";
};

// 模拟获取资源列表数据
const fetchResources = async () => {
  loading.value = true;
  try {
    // TODO: 替换为实际的API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    resources.value = [
      {
        id: 1,
        title: "思政教育参考资料",
        type: "文档",
        createTime: "2024-01-20 10:00:00",
        status: "已发布",
      },
      {
        id: 2,
        title: "优秀案例视频集锦",
        type: "视频",
        createTime: "2024-01-19 15:30:00",
        status: "草稿",
      },
    ];
    total.value = 100;
  } catch (error) {
    ElMessage.error("获取资源列表失败");
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  router.push("/admin/resources/create");
};

const handleEdit = (id) => {
  router.push(`/admin/resources/edit/${id}`);
};

const handlePreview = (id) => {
  // TODO: 实现预览功能
  ElMessage.info("预览功能开发中...");
};

const handleDelete = async (id) => {
  try {
    // TODO: 替换为实际的API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    ElMessage.success("删除成功");
    fetchResources();
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchResources();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchResources();
};

onMounted(() => {
  fetchResources();
});
</script>

<style scoped>
.resource-list-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-button-group .el-button + .el-button) {
  margin-left: 8px;
}

:deep(.el-button-group .el-button--primary) {
  background-color: transparent;
}
</style>
