# filepath:
/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/activities/ActivitiesList.vue
<template>
  <div class="activities-list">
    <div class="page-header">
      <h1>活动管理</h1>
      <a-button type="primary" @click="goToCreate">
        <PlusOutlined /> 创建新活动
      </a-button>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="activities"
        :loading="loading"
        rowKey="_id"
      >
        <template #bodyCell="{ column, record }">
          <!-- 封面列 -->
          <template v-if="column.key === 'poster'">
            <a-image
              :src="record.poster || '/placeholder-activity.jpg'"
              :alt="record.title"
              height="60"
              style="object-fit: cover; border-radius: 4px"
            />
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="goToEdit(record._id)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除这个活动吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record._id)"
              >
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";

export default {
  name: "ActivitiesList",
  components: {
    PlusOutlined,
  },

  setup() {
    const router = useRouter();
    const loading = ref(false);
    const activities = ref([]);

    // 表格列定义
    const columns = [
      {
        title: "封面",
        dataIndex: "poster",
        key: "poster",
        width: 100,
      },
      {
        title: "活动名称",
        dataIndex: "title",
        key: "title",
      },
      {
        title: "活动时间",
        dataIndex: "startDate",
        key: "date",
        customRender: ({ record }) => {
          return `${dayjs(record.startDate).format("YYYY-MM-DD")} 至 ${dayjs(
            record.endDate
          ).format("YYYY-MM-DD")}`;
        },
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 120,
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        key: "updatedAt",
        customRender: ({ text }) => dayjs(text).format("YYYY-MM-DD HH:mm"),
      },
      {
        title: "操作",
        key: "action",
        width: 150,
        align: "center",
      },
    ];

    // 获取活动状态文本
    const getStatusText = (status) => {
      const statusMap = {
        upcoming: "即将开始",
        ongoing: "进行中",
        completed: "已结束",
        canceled: "已取消",
      };
      return statusMap[status] || status;
    };

    // 获取活动状态颜色
    const getStatusColor = (status) => {
      const colorMap = {
        upcoming: "blue",
        ongoing: "green",
        completed: "default",
        canceled: "red",
      };
      return colorMap[status] || "default";
    };

    // 加载活动列表
    const loadActivities = async () => {
      try {
        loading.value = true;
        // TODO: 从API获取活动列表数据
        // 模拟数据
        activities.value = [
          {
            _id: "1",
            title: "2023年暑期思政教师培训",
            startDate: "2023-07-10",
            endDate: "2023-07-15",
            status: "upcoming",
            poster: "/temp/activity-1.jpg",
            updatedAt: "2023-06-20 14:30:00",
          },
          {
            _id: "2",
            title: "思想政治教育线上研讨会",
            startDate: "2023-06-25",
            endDate: "2023-06-25",
            status: "upcoming",
            poster: null,
            updatedAt: "2023-06-19 16:20:00",
          },
          {
            _id: "3",
            title: "第三季度思政教研工作会议",
            startDate: "2023-06-18",
            endDate: "2023-06-18",
            status: "ongoing",
            poster: "/temp/activity-3.jpg",
            updatedAt: "2023-06-18 09:15:00",
          },
        ];
      } catch (error) {
        message.error("加载活动数据失败");
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 删除活动
    const handleDelete = async (id) => {
      try {
        // TODO: 调用API删除活动
        message.success("活动删除成功");
        loadActivities();
      } catch (error) {
        message.error("删除活动失败");
        console.error(error);
      }
    };

    // 路由方法
    const goToCreate = () => router.push("/admin/activities/create");
    const goToEdit = (id) => router.push(`/admin/activities/edit/${id}`);

    onMounted(() => {
      loadActivities();
    });

    return {
      activities,
      columns,
      loading,
      getStatusText,
      getStatusColor,
      handleDelete,
      goToCreate,
      goToEdit,
    };
  },
};
</script>

<style scoped>
.activities-list {
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
