<template>
  <div class="user-history">
    <!-- 操作栏 -->
    <div class="history-header">
      <div class="header-left">
        <el-select
          v-model="selectedType"
          placeholder="内容类型"
          clearable
          @change="loadHistory"
          style="width: 120px; margin-right: 10px"
        >
          <el-option label="全部" value="" />
          <el-option label="新闻资讯" value="news" />
          <el-option label="资源文件" value="resource" />
          <el-option label="活动" value="activity" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadHistory"
          style="width: 250px; margin-right: 10px"
          value-format="YYYY-MM-DD"
        />

        <el-input
          v-model="searchKeyword"
          placeholder="搜索浏览记录"
          @keyup.enter="loadHistory"
          style="width: 200px; margin-right: 10px"
        >
          <template #suffix>
            <el-icon @click="loadHistory" style="cursor: pointer">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="header-right">
        <el-button
          v-if="selectedItems.length > 0"
          type="danger"
          plain
          @click="batchDelete"
          :loading="loading"
        >
          批量删除 ({{ selectedItems.length }})
        </el-button>

        <el-dropdown @command="handleExport">
          <el-button type="primary">
            导出记录
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">JSON格式</el-dropdown-item>
              <el-dropdown-item command="csv">CSV格式</el-dropdown-item>
              <el-dropdown-item command="excel">Excel格式</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button type="danger" plain @click="clearAllHistory">
          清空历史
        </el-button>
      </div>
    </div>

    <!-- 统计面板 -->
    <div class="history-stats">
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalViews || 0 }}</div>
            <div class="stat-label">总浏览量</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ stats.todayViews || 0 }}</div>
            <div class="stat-label">今日浏览</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ stats.weekViews || 0 }}</div>
            <div class="stat-label">本周浏览</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ stats.monthViews || 0 }}</div>
            <div class="stat-label">本月浏览</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">
              {{ formatDuration(stats.avgDuration) }}
            </div>
            <div class="stat-label">平均时长</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <div class="stat-number">{{ stats.mostActiveHour || 0 }}点</div>
            <div class="stat-label">活跃时段</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 推荐内容 -->
    <el-card v-if="recommendations.length > 0" class="recommendations-card">
      <template #header>
        <div class="card-header">
          <i class="fas fa-lightbulb"></i>
          <span>为您推荐</span>
        </div>
      </template>

      <div class="recommendations-list">
        <div
          v-for="item in recommendations"
          :key="item._id"
          class="recommendation-item"
          @click="openResource(item)"
        >
          <div class="rec-content">
            <h4 class="rec-title">{{ item.title }}</h4>
            <div class="rec-meta">
              <el-tag :type="getTypeColor(item.type)" size="small">
                {{ getTypeText(item.type) }}
              </el-tag>
              <span class="rec-reason">{{ item.reason }}</span>
              <span class="rec-score"
                >推荐度: {{ Math.round(item.score * 100) }}%</span
              >
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 历史记录列表 -->
    <div class="history-list">
      <div class="list-header">
        <el-checkbox
          v-model="selectAll"
          @change="handleSelectAll"
          class="select-all-checkbox"
        >
          全选
        </el-checkbox>

        <div class="view-mode">
          <el-radio-group v-model="viewMode" @change="loadHistory">
            <el-radio-button label="list">列表视图</el-radio-button>
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="timeline">时间轴</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading && !history.length" class="loading-wrapper">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="!history.length" class="empty-state">
        <el-empty description="暂无浏览记录">
          <el-button type="primary" @click="$router.push('/')">
            去首页逛逛
          </el-button>
        </el-empty>
      </div>

      <!-- 列表视图 -->
      <el-table
        v-else-if="viewMode === 'list'"
        :data="history"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="内容标题" min-width="200">
          <template #default="scope">
            <div class="title-cell">
              <i
                :class="getTypeIcon(scope.row.resourceType)"
                class="type-icon"
              ></i>
              <a
                :href="scope.row.resourceUrl"
                target="_blank"
                class="title-link"
              >
                {{ scope.row.resourceTitle }}
              </a>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeColor(scope.row.resourceType)" size="small">
              {{ getTypeText(scope.row.resourceType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="浏览时长" width="100">
          <template #default="scope">
            {{ formatDuration(scope.row.viewDuration) }}
          </template>
        </el-table-column>

        <el-table-column label="设备信息" width="150">
          <template #default="scope">
            <div class="device-info">
              <div>{{ scope.row.device?.type || "-" }}</div>
              <small>{{ scope.row.device?.browser || "-" }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="浏览时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="addToFavorites(scope.row)"
            >
              收藏
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="deleteHistory(scope.row._id)"
              class="delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="history-cards">
        <div
          v-for="item in history"
          :key="item._id"
          class="history-card"
          :class="{ selected: selectedItems.includes(item._id) }"
        >
          <el-checkbox
            :model-value="selectedItems.includes(item._id)"
            @change="(checked) => handleItemSelect(item._id, checked)"
            class="card-checkbox"
          />

          <div class="card-content" @click="openResource(item)">
            <div class="card-header">
              <i :class="getTypeIcon(item.resourceType)" class="type-icon"></i>
              <h3 class="card-title">{{ item.resourceTitle }}</h3>
            </div>

            <div class="card-meta">
              <el-tag :type="getTypeColor(item.resourceType)" size="small">
                {{ getTypeText(item.resourceType) }}
              </el-tag>
              <span class="view-time">{{
                formatDateTime(item.createdAt)
              }}</span>
            </div>

            <div class="card-stats">
              <span class="duration">
                <i class="fas fa-clock"></i>
                {{ formatDuration(item.viewDuration) }}
              </span>
              <span class="device">
                <i class="fas fa-desktop"></i>
                {{ item.device?.type || "Unknown" }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <el-button type="text" size="small" @click="addToFavorites(item)">
              <i class="fas fa-heart"></i>
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="deleteHistory(item._id)"
              class="delete-btn"
            >
              <i class="fas fa-trash"></i>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 时间轴视图 -->
      <el-timeline v-else-if="viewMode === 'timeline'" class="history-timeline">
        <el-timeline-item
          v-for="item in history"
          :key="item._id"
          :timestamp="formatDateTime(item.createdAt)"
          placement="top"
        >
          <div class="timeline-content">
            <div class="timeline-header">
              <i :class="getTypeIcon(item.resourceType)" class="type-icon"></i>
              <a
                :href="item.resourceUrl"
                target="_blank"
                class="timeline-title"
              >
                {{ item.resourceTitle }}
              </a>
              <el-tag :type="getTypeColor(item.resourceType)" size="small">
                {{ getTypeText(item.resourceType) }}
              </el-tag>
            </div>

            <div class="timeline-meta">
              <span class="duration">
                浏览时长: {{ formatDuration(item.viewDuration) }}
              </span>
              <span class="device">
                设备: {{ item.device?.type || "Unknown" }}
              </span>
            </div>

            <div class="timeline-actions">
              <el-button type="text" size="small" @click="addToFavorites(item)">
                收藏
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="deleteHistory(item._id)"
                class="delete-btn"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadHistory"
          @current-change="loadHistory"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, ArrowDown } from "@element-plus/icons-vue";
import { viewHistoryApi } from "@/api/modules/viewHistory";
import { favoriteApi } from "@/api/modules/favorite";

// 响应式数据
const loading = ref(false);
// 定义历史记录接口
interface ViewHistory {
  _id: string;
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  resourceUrl?: string;
  viewDuration: number;
  createdAt: string;
  device?: {
    type?: string;
    browser?: string;
  };
}

// 定义统计数据接口
interface HistoryStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  avgDuration: number;
  mostViewedType: string;
  mostActiveHour: number;
}

// 定义推荐内容接口
interface Recommendation {
  _id: string;
  title: string;
  type: "news" | "resource" | "activity";
  url: string;
  score: number;
  reason: string;
  thumbnail?: string;
}

const history = ref<ViewHistory[]>([]);
const stats = ref<HistoryStats>({
  totalViews: 0,
  todayViews: 0,
  weekViews: 0,
  monthViews: 0,
  avgDuration: 0,
  mostViewedType: "",
  mostActiveHour: 0,
});
const recommendations = ref<Recommendation[]>([]);
const selectedItems = ref<string[]>([]);
const selectAll = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const viewMode = ref("list");

// 筛选条件
const selectedType = ref("");
const dateRange = ref<string[]>([]);
const searchKeyword = ref("");

// 加载浏览历史
const loadHistory = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      resourceType: selectedType.value,
      keyword: searchKeyword.value,
    };

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    const response = await viewHistoryApi.instance.getViewHistory(params);
    history.value = response.data.histories || [];
    total.value = response.data.total || 0;

    // 清空选择
    selectedItems.value = [];
    selectAll.value = false;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "加载浏览历史失败";
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await viewHistoryApi.instance.getHistoryStats();
    stats.value = response.data || {};
  } catch (error) {
    console.error("加载统计失败:", error);
  }
};

// 加载推荐内容
const loadRecommendations = async () => {
  try {
    const response = await viewHistoryApi.instance.getRecommendedContent({
      limit: 5,
    });
    recommendations.value = response.data || [];
  } catch (error) {
    console.error("加载推荐失败:", error);
  }
};

// 全选处理
const handleSelectAll = (checked: boolean | string | number) => {
  const isChecked = Boolean(checked);
  if (isChecked) {
    selectedItems.value = history.value.map((item) => item._id);
  } else {
    selectedItems.value = [];
  }
};

// 表格选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedItems.value = selection.map((item) => item._id);
};

// 单项选择处理
const handleItemSelect = (id: string, checked: boolean | string | number) => {
  const isChecked = Boolean(checked);
  if (isChecked) {
    selectedItems.value.push(id);
  } else {
    const index = selectedItems.value.indexOf(id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    }
  }
};

// 打开资源
const openResource = (item: any) => {
  if (item.resourceUrl) {
    window.open(item.resourceUrl, "_blank");
  }
};

// 删除单条历史
const deleteHistory = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这条浏览记录吗？", "确认删除", {
      type: "warning",
    });

    await viewHistoryApi.instance.deleteViewHistory(id);
    ElMessage.success("删除成功");
    loadHistory();
    loadStats();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 条记录吗？`,
      "批量删除",
      { type: "warning" },
    );

    loading.value = true;
    await viewHistoryApi.instance.batchDeleteHistory(selectedItems.value);
    ElMessage.success("批量删除成功");
    selectedItems.value = [];
    selectAll.value = false;
    loadHistory();
    loadStats();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "批量删除失败");
    }
  } finally {
    loading.value = false;
  }
};

// 清空所有历史
const clearAllHistory = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有浏览历史吗？此操作不可恢复！",
      "清空历史",
      {
        type: "warning",
        confirmButtonText: "确定清空",
        cancelButtonText: "取消",
      },
    );

    loading.value = true;
    await viewHistoryApi.instance.clearAllHistory();
    ElMessage.success("历史记录已清空");
    history.value = [];
    total.value = 0;
    loadStats();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "清空失败");
    }
  } finally {
    loading.value = false;
  }
};

// 导出历史
const handleExport = async (format: string) => {
  try {
    const params: any = {
      format,
      resourceType: selectedType.value,
    };

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    const blob = await viewHistoryApi.instance.exportHistory(params);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `浏览历史_${new Date().toLocaleDateString()}.${format === "excel" ? "xlsx" : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success("导出成功");
  } catch (error: any) {
    ElMessage.error(error.message || "导出失败");
  }
};

// 添加到收藏
const addToFavorites = async (item: any) => {
  try {
    await favoriteApi.instance.addFavorite({
      itemType: item.resourceType,
      itemId: item.resourceId,
      notes: `从浏览历史添加于 ${formatDateTime(new Date().toISOString())}`,
    });
    ElMessage.success("已添加到收藏");
  } catch (error: any) {
    ElMessage.error(error.message || "添加收藏失败");
  }
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    news: "fas fa-newspaper",
    resource: "fas fa-file-alt",
    activity: "fas fa-calendar-alt",
  };
  return iconMap[type] || "fas fa-file";
};

// 获取类型颜色
const getTypeColor = (
  type: string,
): "success" | "warning" | "danger" | "info" | "primary" => {
  const colorMap: Record<
    string,
    "success" | "warning" | "danger" | "info" | "primary"
  > = {
    news: "primary",
    resource: "success",
    activity: "warning",
  };
  return colorMap[type] || "info";
};

// 获取类型文本
const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    news: "新闻",
    resource: "资源",
    activity: "活动",
  };
  return textMap[type] || "未知";
};

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return "0秒";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
};

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString("zh-CN");
};

// 监听选择状态
watch(
  () => selectedItems.value.length,
  (newLength) => {
    selectAll.value = newLength > 0 && newLength === history.value.length;
  },
);

// 组件挂载
onMounted(() => {
  loadHistory();
  loadStats();
  loadRecommendations();
});
</script>

<style scoped>
.user-history {
  max-width: 100%;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.history-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.recommendations-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
}

.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.recommendation-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.rec-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
}

.rec-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.rec-reason {
  color: #666;
}

.rec-score {
  color: #409eff;
  margin-left: auto;
}

.history-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  color: #409eff;
}

.title-link {
  color: #303133;
  text-decoration: none;
}

.title-link:hover {
  color: #409eff;
}

.device-info {
  font-size: 14px;
}

.device-info small {
  color: #999;
}

.delete-btn {
  color: #f56c6c;
}

/* 卡片视图样式 */
.history-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.history-card {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  background: white;
}

.history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.card-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
}

.card-content {
  cursor: pointer;
  padding-right: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}

.view-time {
  color: #999;
}

.card-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.card-stats i {
  margin-right: 4px;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

/* 时间轴样式 */
.history-timeline {
  margin-top: 20px;
}

.timeline-content {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 15px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  text-decoration: none;
  flex: 1;
}

.timeline-title:hover {
  color: #409eff;
}

.timeline-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.timeline-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 30px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-wrapper {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-left,
  .header-right {
    flex-wrap: wrap;
    gap: 10px;
  }

  .history-cards {
    grid-template-columns: 1fr;
  }

  .recommendations-list {
    grid-template-columns: 1fr;
  }

  .card-meta,
  .timeline-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
