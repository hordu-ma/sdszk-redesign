&lt;template> &lt;div class="activity-list"> &lt;!-- 顶部操作栏 --> &lt;a-card class="mb-4"> &lt;div
class="flex items-center justify-between mb-4"> &lt;div class="flex-1"> &lt;a-input-search
v-model:value="filters.search" placeholder="搜索活动..." @search="handleSearch" class="max-w-md" />
&lt;/div> &lt;a-button type="primary" @click="handleAdd"> &lt;plus-outlined /> 添加活动
&lt;/a-button> &lt;/div> &lt;!-- 筛选器 --> &lt;div class="flex flex-wrap gap-4"> &lt;a-select
v-model:value="filters.category" placeholder="活动类型" class="w-40" @change="handleFilterChange" >
&lt;a-select-option value="">全部类型&lt;/a-select-option> &lt;a-select-option v-for="cat in
categories" :key="cat" :value="cat">
{{ cat }}
&lt;/a-select-option> &lt;/a-select> &lt;a-select v-model:value="filters.status"
placeholder="活动状态" class="w-40" @change="handleFilterChange" > &lt;a-select-option
value="">全部状态&lt;/a-select-option> &lt;a-select-option
value="upcoming">即将开始&lt;/a-select-option> &lt;a-select-option
value="ongoing">进行中&lt;/a-select-option> &lt;a-select-option
value="completed">已结束&lt;/a-select-option> &lt;a-select-option
value="canceled">已取消&lt;/a-select-option> &lt;a-select-option
value="postponed">已延期&lt;/a-select-option> &lt;/a-select> &lt;a-range-picker
v-model:value="dateRange" @change="handleDateRangeChange" class="w-72" /> &lt;a-checkbox
v-model:checked="filters.registrationOpen" @change="handleFilterChange" > 报名中 &lt;/a-checkbox>
&lt;a-checkbox v-model:checked="filters.featured" @change="handleFilterChange" > 推荐活动
&lt;/a-checkbox> &lt;/div> &lt;/a-card> &lt;!-- 活动列表 --> &lt;a-card> &lt;a-table
:dataSource="activities" :columns="columns" :loading="loading" :pagination="pagination"
@change="handleTableChange" > &lt;template #bodyCell="{ column, record }"> &lt;template
v-if="column.key === 'title'"> &lt;router-link :to="'/admin/activities/edit/' + record.id">
{{ record.title }}
&lt;/router-link> &lt;/template> &lt;template v-if="column.key === 'status'"> &lt;a-tag
:color="getStatusColor(record.status)">
{{ getStatusText(record.status) }}
&lt;/a-tag> &lt;/template> &lt;template v-if="column.key === 'registrationStatus'"> &lt;a-tag
:color="getRegistrationStatusColor(record)">
{{ getRegistrationStatusText(record) }}
&lt;/a-tag> &lt;/template> &lt;template v-if="column.key === 'action'"> &lt;a-space> &lt;a-button
type="link" @click="handleEdit(record)">编辑&lt;/a-button> &lt;a-button type="link"
@click="handleTogglePublish(record)" :disabled="!hasPermission('activities.publish')" >
{{ record.isPublished ? '取消发布' : '发布' }}
&lt;/a-button> &lt;a-button type="link" @click="handleToggleFeatured(record)"
:disabled="!hasPermission('activities.update')" >
{{ record.isFeatured ? '取消推荐' : '推荐' }}
&lt;/a-button> &lt;a-popconfirm title="确定要删除这个活动吗？" @confirm="handleDelete(record)"
:disabled="!hasPermission('activities.delete')" > &lt;a-button type="link" danger
:disabled="!hasPermission('activities.delete')" > 删除 &lt;/a-button> &lt;/a-popconfirm>
&lt;/a-space> &lt;/template> &lt;/template> &lt;/a-table> &lt;/a-card> &lt;/div> &lt;/template>
&lt;script setup lang="ts"> import { ref, onMounted, computed } from 'vue' import { useRouter } from
'vue-router' import { PlusOutlined } from '@ant-design/icons-vue' import { useActivityStore } from
'../../store/activity' import type { Activity, ActivityStatus } from '../../types' import {
useUserStore } from '@/stores/user' import { Modal } from 'ant-design-vue' import type {
TableColumnsType } from 'ant-design-vue' import dayjs from 'dayjs' const router = useRouter() const
activityStore = useActivityStore() const userStore = useUserStore() const hasPermission =
userStore.hasPermission // 表格列定义 const columns: TableColumnsType = [ { title: '标题',
dataIndex: 'title', key: 'title', width: 300, }, { title: '类型', dataIndex: 'category', key:
'category', width: 120, }, { title: '开始时间', dataIndex: 'startDate', key: 'startDate', width:
180, customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'), }, { title: '状态',
dataIndex: 'status', key: 'status', width: 100, }, { title: '报名状态', key: 'registrationStatus',
width: 120, }, { title: '浏览量', dataIndex: 'viewCount', key: 'viewCount', width: 100, }, { title:
'操作', key: 'action', width: 250, fixed: 'right', }, ] // 活动类型 const categories = [
'conference', 'seminar', 'workshop', 'competition', 'lecture', 'other', ] // 状态相关 const
getStatusColor = (status: ActivityStatus) => { const colors: Record
<ActivityStatus, string></ActivityStatus,>
