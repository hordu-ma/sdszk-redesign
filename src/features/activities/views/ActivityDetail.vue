&lt;template> &lt;div class="activity-detail"> &lt;a-spin :spinning="loading"> &lt;template
v-if="activity"> &lt;a-row :gutter="24"> &lt;a-col :span="18"> &lt;!-- 活动主体信息 --> &lt;a-card>
&lt;template #title> &lt;div class="flex items-center justify-between"> &lt;h1 class="text-2xl
font-bold mb-0">{{ activity.title }}&lt;/h1> &lt;a-space> &lt;a-tag color="blue">{{
  getCategoryText(activity.category)
}}&lt;/a-tag> &lt;a-tag :color="getStatusColor(activity.status)">
{{ getStatusText(activity.status) }}
&lt;/a-tag> &lt;a-tag v-if="activity.isFeatured" color="orange">推荐&lt;/a-tag> &lt;/a-space>
&lt;/div> &lt;/template> &lt;!-- 活动基本信息 --> &lt;div class="activity-info mb-8">
&lt;a-descriptions> &lt;a-descriptions-item label="活动时间">
{{ formatDate(activity.startDate) }} ~ {{ formatDate(activity.endDate) }}
&lt;/a-descriptions-item> &lt;a-descriptions-item label="活动地点"> &lt;template
v-if="activity.location.isOnline"> 线上活动 &lt;a-button v-if="activity.location.onlineUrl"
type="link" size="small" @click="copyUrl(activity.location.onlineUrl)" > 复制会议链接 &lt;/a-button>
&lt;/template> &lt;template v-else>
{{ activity.location.name }}
&lt;span v-if="activity.location.address" class="text-gray-500"> ({{ activity.location.address }})
&lt;/span> &lt;/template> &lt;/a-descriptions-item> &lt;a-descriptions-item label="主办方">
{{ activity.organizer.name }}
&lt;/a-descriptions-item> &lt;a-descriptions-item v-if="activity.coOrganizers?.length"
label="协办方">
{{ activity.coOrganizers.map(co => co.name).join('、') }}
&lt;/a-descriptions-item> &lt;/a-descriptions> &lt;/div> &lt;!-- 活动海报 --> &lt;div
v-if="activity.poster" class="activity-poster mb-8"> &lt;img :src="activity.poster"
:alt="activity.title" class="w-full" /> &lt;/div> &lt;!-- 活动详情 --> &lt;div
class="activity-content mb-8"> &lt;a-typography> &lt;a-typography-title
:level="4">活动详情&lt;/a-typography-title> &lt;a-typography-paragraph>
{{ activity.description }}
&lt;/a-typography-paragraph> &lt;/a-typography> &lt;/div> &lt;!-- 活动日程 --> &lt;div
v-if="activity.agenda?.length" class="activity-agenda mb-8"> &lt;a-typography-title
:level="4">活动日程&lt;/a-typography-title> &lt;a-timeline> &lt;a-timeline-item v-for="item in
activity.agenda" :key="item.time" > &lt;template #dot> &lt;clock-circle-outlined /> &lt;/template>
&lt;div class="agenda-item"> &lt;div class="font-bold">{{ formatTime(item.time) }}&lt;/div> &lt;div
class="text-lg">{{ item.title }}&lt;/div> &lt;div v-if="item.speaker" class="text-gray-500">
主讲人：{{ item.speaker }}
&lt;/div> &lt;div v-if="item.description" class="mt-2">
{{ item.description }}
&lt;/div> &lt;/div> &lt;/a-timeline-item> &lt;/a-timeline> &lt;/div> &lt;!-- 主讲嘉宾 --> &lt;div
v-if="activity.speakers?.length" class="activity-speakers mb-8"> &lt;a-typography-title
:level="4">主讲嘉宾&lt;/a-typography-title> &lt;a-row :gutter="24"> &lt;a-col v-for="speaker in
activity.speakers" :key="speaker.name" :span="8" > &lt;a-card class="speaker-card"> &lt;template
#cover> &lt;img v-if="speaker.avatar" :src="speaker.avatar" :alt="speaker.name" /> &lt;div v-else
class="avatar-placeholder"> &lt;user-outlined /> &lt;/div> &lt;/template> &lt;a-card-meta
:title="speaker.name"> &lt;template #description> &lt;div>{{ speaker.title }}&lt;/div> &lt;div>{{
  speaker.organization
}}&lt;/div> &lt;/template> &lt;/a-card-meta> &lt;div v-if="speaker.bio" class="mt-4 text-gray-500">
{{ speaker.bio }}
&lt;/div> &lt;/a-card> &lt;/a-col> &lt;/a-row> &lt;/div> &lt;!-- 活动附件 --> &lt;div
v-if="activity.attachments?.length" class="activity-attachments mb-8"> &lt;a-typography-title
:level="4">活动资料&lt;/a-typography-title> &lt;a-list :data-source="activity.attachments"
size="small"> &lt;template #renderItem="{ item }"> &lt;a-list-item> &lt;a :href="item.url"
target="_blank"> &lt;file-outlined /> {{ item.name }}
&lt;/a> &lt;div class="text-gray-500">
{{ formatFileSize(item.size) }}
&lt;/div> &lt;/a-list-item> &lt;/template> &lt;/a-list> &lt;/div> &lt;!-- 活动标签 --> &lt;div
v-if="activity.tags?.length" class="activity-tags mb-8"> &lt;a-space> &lt;a-tag v-for="tag in
activity.tags" :key="tag">
{{ tag }}
&lt;/a-tag> &lt;/a-space> &lt;/div> &lt;/a-card> &lt;/a-col> &lt;a-col :span="6"> &lt;!-- 报名信息
--> &lt;a-card class="mb-4"> &lt;template v-if="activity.registrationRequired"> &lt;div
class="text-center"> &lt;div class="text-lg mb-4">
{{ getRegistrationStatusText(activity) }}
&lt;/div> &lt;div v-if="activity.maxAttendees" class="mb-4"> &lt;a-progress
:percent="(activity.currentAttendees / activity.maxAttendees) * 100" :format="percent =>
`${activity.currentAttendees}/${activity.maxAttendees}`" /> &lt;/div> &lt;div
v-if="activity.registrationDeadline" class="mb-4"> 报名截止时间：{{
  formatDate(activity.registrationDeadline)
}}
&lt;/div> &lt;a-button v-if="canRegister(activity)" type="primary" block
:href="activity.registrationUrl" target="_blank" > 立即报名 &lt;/a-button> &lt;/template>
&lt;template v-else> &lt;div class="text-center text-lg"> 无需报名，欢迎参加 &lt;/div>
&lt;/template> &lt;/template> &lt;/a-card> &lt;!-- 活动二维码 --> &lt;a-card v-if="activity.qrcode"
title="活动二维码" class="mb-4"> &lt;div class="text-center"> &lt;img :src="activity.qrcode"
:alt="activity.title" class="max-w-full" /> &lt;/div> &lt;/a-card> &lt;!-- 相关活动 --> &lt;a-card
title="相关活动"> &lt;a-list :data-source="relatedActivities" size="small"> &lt;template
#renderItem="{ item }"> &lt;a-list-item> &lt;router-link :to="'/activities/' + item.id">
{{ item.title }}
&lt;/router-link> &lt;/a-list-item> &lt;/template> &lt;/a-list> &lt;/a-card> &lt;/a-col> &lt;/a-row>
&lt;/template> &lt;/a-spin> &lt;/div> &lt;/template> &lt;script setup lang="ts"> import { ref,
computed, onMounted } from 'vue' import { useRoute } from 'vue-router' import { useActivityStore }
from '../store/activity' import type { Activity, ActivityStatus } from '../types' import {
ClockCircleOutlined, UserOutlined, FileOutlined, } from '@ant-design/icons-vue' import { message }
from 'ant-design-vue' import dayjs from 'dayjs' const route = useRoute() const activityStore =
useActivityStore() const loading = computed(() => activityStore.loading) const activity =
computed(() => activityStore.currentActivity) const relatedActivities = ref&lt;Activity[]>([]) //
活动类型文本 const getCategoryText = (category: string) => { const texts: Record
<string, string></string,>
