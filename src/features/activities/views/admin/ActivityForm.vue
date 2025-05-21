<template>
  <div class="activity-form">
    <div class="page-header">
      <h1>{{ isEdit ? '编辑活动' : '创建活动' }}</h1>
    </div>

    <a-card>
      <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
        <!-- 基本信息 -->
        <a-form-item label="活动名称" name="title">
          <a-input v-model:value="formState.title" placeholder="请输入活动名称" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" name="startDateObj">
              <a-date-picker
                v-model:value="startDateObj"
                style="width: 100%"
                :show-time="{ format: 'HH:mm' }"
                format="YYYY-MM-DD HH:mm"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" name="endDateObj">
              <a-date-picker
                v-model:value="endDateObj"
                style="width: 100%"
                :show-time="{ format: 'HH:mm' }"
                format="YYYY-MM-DD HH:mm"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="活动地点" name="location">
          <a-input v-model:value="formState.location.name" placeholder="请输入活动地点" />
          <a-checkbox v-model:checked="formState.location.isOnline" class="mt-2">
            线上活动
          </a-checkbox>
          <a-input
            v-if="formState.location.isOnline"
            v-model:value="formState.location.onlineUrl"
            placeholder="请输入线上会议链接"
            class="mt-2"
          />
          <a-input
            v-else
            v-model:value="formState.location.address"
            placeholder="请输入详细地址"
            class="mt-2"
          />
        </a-form-item>

        <a-form-item label="活动分类" name="category">
          <a-select v-model:value="formState.category">
            <a-select-option value="conference">会议</a-select-option>
            <a-select-option value="seminar">研讨会</a-select-option>
            <a-select-option value="workshop">工作坊</a-select-option>
            <a-select-option value="competition">竞赛</a-select-option>
            <a-select-option value="lecture">讲座</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="活动状态" name="status">
          <a-select v-model:value="formState.status">
            <a-select-option value="upcoming">即将开始</a-select-option>
            <a-select-option value="ongoing">进行中</a-select-option>
            <a-select-option value="completed">已结束</a-select-option>
            <a-select-option value="canceled">已取消</a-select-option>
          </a-select>
        </a-form-item>

        <!-- 活动海报 -->
        <a-form-item label="活动海报" name="poster">
          <a-upload-dragger
            v-model:file-list="posterFile"
            :before-upload="beforeUploadPoster"
            :multiple="false"
            :show-upload-list="false"
            accept="image/*"
            class="poster-uploader"
          >
            <div class="poster-content">
              <img v-if="previewUrl" :src="previewUrl" alt="活动海报" class="poster-preview" />
              <template v-else>
                <p class="ant-upload-drag-icon">
                  <PictureOutlined />
                </p>
                <p class="ant-upload-text">点击或拖拽图片到此处上传</p>
                <p class="ant-upload-hint">支持单个图片上传，大小不超过 2MB</p>
              </template>
            </div>
          </a-upload-dragger>
        </a-form-item>

        <!-- 活动附件 -->
        <a-form-item label="活动附件" name="attachments">
          <a-upload-dragger
            v-model:file-list="fileList"
            :before-upload="beforeUploadFile"
            :multiple="true"
            :show-upload-list="true"
            :remove="handleRemoveFile"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            class="file-uploader"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p class="ant-upload-hint">支持多个文件上传，每个文件大小不超过 10MB</p>
          </a-upload-dragger>
        </a-form-item>

        <!-- 活动描述 -->
        <a-form-item label="活动描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            :rows="6"
            placeholder="请输入活动描述"
          />
        </a-form-item>

        <!-- 提交按钮 -->
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSubmit"> 保存 </a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { PictureOutlined, InboxOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue/es/upload/interface'
import type {
  Activity,
  CreateActivityDTO as ApiCreateActivityDTO,
  UpdateActivityDTO as ApiUpdateActivityDTO,
} from '../../types'
import { useActivityStore } from '../../store/activity'
import { Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()
const formRef = ref<FormInstance>()
const isEdit = route.params.id !== undefined

// 导航方法
const goBack = () => router.back()

// 文件上传相关状态
const posterFile = ref<UploadFile[]>([])
const fileList = ref<UploadFile[]>([])
const previewUrl = ref<string>('')

// 日期处理
const startDateObj = ref<Dayjs | null>(null)
const endDateObj = ref<Dayjs | null>(null)

// 表单状态
// 分开定义必需字段类型和可选字段类型
// 活动地点类型
interface ActivityLocation {
  name: string
  address?: string
  coordinates?: {
    longitude: number
    latitude: number
  }
  isOnline: boolean
  onlineUrl?: string
}

// 活动组织者类型
interface ActivityOrganizer {
  name: string
  logo?: string
  description?: string
  contact?: string
}

// 活动类型
type ActivityCategory = 'conference' | 'seminar' | 'workshop' | 'competition' | 'lecture' | 'other'

// 活动状态
type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'canceled' | 'postponed'

// 活动附件类型
interface ActivityAttachment {
  name: string
  url: string
  size: number
  type: string
}

// 活动图片类型
interface ActivityImage {
  url: string
  caption?: string
}

// 活动议程项目类型
interface ActivityAgendaItem {
  time: string
  title: string
  description?: string
  speaker?: string
}

// 活动讲者类型
interface ActivitySpeaker {
  name: string
  title?: string
  organization?: string
  bio?: string
  avatar?: string
}

// 活动表单状态类型
interface ActivityFormState {
  title: string
  description: string
  location: ActivityLocation
  organizer: ActivityOrganizer
  category: ActivityCategory
  status: ActivityStatus
  startDate?: string
  endDate?: string
  registrationRequired: boolean
  isPublished: boolean
  isFeatured: boolean
  summary?: string
  poster?: string | File
  coOrganizers?: Array<Pick<ActivityOrganizer, 'name' | 'logo'>>
  registrationDeadline?: string
  registrationUrl?: string
  maxAttendees?: number
  tags?: string[]
  attachments?: ActivityAttachment[]
  images?: ActivityImage[]
  agenda?: ActivityAgendaItem[]
  speakers?: ActivitySpeaker[]
}

// 活动基础数据类型
interface ActivityBase {
  title: string
  description: string
  summary?: string
  poster?: File | string
  startDate: string
  endDate: string
  location: ActivityLocation
  organizer: ActivityOrganizer
  category: ActivityCategory
  status: ActivityStatus
  registrationRequired: boolean
  registrationDeadline?: string
  registrationUrl?: string
  maxAttendees?: number
  isPublished: boolean
  isFeatured: boolean
  tags?: string[]
  attachments?: ActivityAttachment[]
  images?: ActivityImage[]
  agenda?: ActivityAgendaItem[]
  speakers?: ActivitySpeaker[]
  coOrganizers?: Array<Pick<ActivityOrganizer, 'name' | 'logo'>>
}

// 完整活动数据类型
interface ActivityData extends ActivityBase {
  id: string
}

// 创建和更新活动的 DTO 类型
type CreateActivityDTO = ApiCreateActivityDTO
type UpdateActivityDTO = ApiUpdateActivityDTO

const formState = reactive<ActivityFormState>({
  title: '',
  description: '',
  summary: '',
  category: 'other',
  status: 'upcoming',
  location: {
    name: '',
    address: '',
    isOnline: false,
    onlineUrl: '',
    coordinates: {
      longitude: 0,
      latitude: 0,
    },
  },
  organizer: {
    name: '',
    logo: '',
    description: '',
    contact: '',
  },
  registrationRequired: false,
  registrationDeadline: '',
  registrationUrl: '',
  maxAttendees: 0,
  isPublished: false,
  isFeatured: false,
  tags: [],
  attachments: [],
  images: [],
  agenda: [],
  speakers: [],
  coOrganizers: [],
})

// 表单验证规则
const rules: Record<string, Rule[]> = {
  title: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 200, message: '活动名称长度在2-200个字符之间', trigger: 'blur' },
  ],
  startDateObj: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endDateObj: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule: Rule, value: Dayjs) => {
        if (startDateObj.value && value && value.isBefore(startDateObj.value)) {
          return Promise.reject('结束时间必须晚于开始时间')
        }
        return Promise.resolve()
      },
      trigger: 'change',
    },
  ],
  'location.name': [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  'location.onlineUrl': [
    {
      validator: (_rule: Rule, value: string) => {
        if (formState.location.isOnline && !value) {
          return Promise.reject('线上活动必须提供会议链接')
        }
        return Promise.resolve()
      },
      trigger: 'change',
    },
  ],
  'organizer.name': [{ required: true, message: '请输入主办方名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择活动分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择活动状态', trigger: 'change' }],
  registrationDeadline: [
    {
      validator: (_rule: Rule, value: string) => {
        if (formState.registrationRequired && !value) {
          return Promise.reject('需要报名的活动必须设置报名截止时间')
        }
        if (value && startDateObj.value && dayjs(value).isAfter(startDateObj.value)) {
          return Promise.reject('报名截止时间必须早于活动开始时间')
        }
        return Promise.resolve()
      },
      trigger: 'change',
    },
  ],
  maxAttendees: [
    {
      validator: (_rule: Rule, value: number) => {
        if (formState.registrationRequired && (!value || value < 1)) {
          return Promise.reject('需要报名的活动必须设置最大参与人数')
        }
        return Promise.resolve()
      },
      trigger: 'change',
    },
  ],
}

// 海报上传前的验证
const beforeUploadPoster = (file: File) => {
  const isImage = /^image\//.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！')
    return false
  }

  // 生成预览URL
  previewUrl.value = URL.createObjectURL(file)
  posterFile.value = [
    {
      uid: '-1',
      name: file.name,
      status: 'done',
      url: previewUrl.value,
      originFileObj: file,
    } as UploadFile,
  ]
  return false
}

// 附件上传前的验证
const beforeUploadFile = (file: File) => {
  const isValidType = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i.test(file.name)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    message.error('只能上传 PDF、Word、PPT 或 Excel 文件！')
    return false
  }
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！')
    return false
  }

  fileList.value = [
    ...fileList.value,
    {
      uid: String(Date.now()),
      name: file.name,
      status: 'done',
      size: file.size,
      type: file.type,
      originFileObj: file,
    } as UploadFile,
  ]
  return false
}

// 删除附件
const handleRemoveFile = async (file: UploadFile) => {
  if (isEdit && file.url) {
    try {
      // 如果是编辑模式且文件已上传，调用删除API
      const attachmentId = file.uid
      await activityStore.deleteAttachment(route.params.id as string, attachmentId)
    } catch (e) {
      const error = e as Error
      message.error('删除文件失败：' + (error?.message || '未知错误'))
      return false
    }
  }
  const index = fileList.value.indexOf(file)
  fileList.value.splice(index, 1)
  return true
}

// 加载活动数据
const loadActivityData = async () => {
  if (isEdit) {
    try {
      const activity = await activityStore.getActivity(route.params.id as string)
      if (activity) {
        // 处理日期
        startDateObj.value = activity.startDate ? dayjs(activity.startDate) : null
        endDateObj.value = activity.endDate ? dayjs(activity.endDate) : null

        // 设置其他表单数据
        Object.assign(formState, {
          ...activity,
          startDate: undefined,
          endDate: undefined,
        })

        // 设置海报预览
        if (activity.poster) {
          previewUrl.value = activity.poster
          posterFile.value = [
            {
              uid: '-1',
              name: '活动海报',
              status: 'done',
              url: activity.poster,
            } as UploadFile,
          ]
        }

        // 设置附件列表
        if (activity.attachments) {
          fileList.value = activity.attachments.map(
            attachment =>
              ({
                uid: attachment.url,
                name: attachment.name,
                status: 'done',
                url: attachment.url,
                size: attachment.size,
                type: attachment.type,
              }) as UploadFile
          )
        }
      }
    } catch (e) {
      const error = e as Error
      message.error('加载活动数据失败：' + (error?.message || '未知错误'))
    }
  }
}

// 表单提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    if (!startDateObj.value || !endDateObj.value) {
      message.error('请选择活动时间')
      return
    }

    const formData = {
      ...formState,
      startDate: startDateObj.value.format('YYYY-MM-DD[T]HH:mm:ss[Z]'),
      endDate: endDateObj.value.format('YYYY-MM-DD[T]HH:mm:ss[Z]'),

      // 处理海报
      poster: posterFile.value[0]?.originFileObj ?? undefined,

      // 处理附件
      attachments: fileList.value.map(file => ({
        name: file.name,
        size: file.size ?? 0,
        type: file.type ?? '',
        url: file.url ?? '',
        file: file.originFileObj,
      })),

      // 处理可选字段
      ...(formState.registrationDeadline
        ? {
            registrationDeadline: dayjs(formState.registrationDeadline).format(
              'YYYY-MM-DD[T]HH:mm:ss[Z]'
            ),
          }
        : {}),

      // 确保数字字段有效
      maxAttendees:
        formState.maxAttendees && formState.maxAttendees > 0 ? formState.maxAttendees : undefined,

      // 数组字段的空值处理
      tags: formState.tags?.length ? formState.tags : undefined,
      images: formState.images?.length ? formState.images : undefined,
      agenda: formState.agenda?.length ? formState.agenda : undefined,
      speakers: formState.speakers?.length ? formState.speakers : undefined,
      coOrganizers: formState.coOrganizers?.length ? formState.coOrganizers : undefined,

      // 位置信息处理
      location: {
        ...formState.location,
        coordinates:
          formState.location.coordinates?.latitude && formState.location.coordinates?.longitude
            ? formState.location.coordinates
            : undefined,
      },
    }

    try {
      const id = route.params.id as string
      if (isEdit && id) {
        const updatePayload: UpdateActivityDTO = {
          id,
          ...formData,
        }
        await activityStore.updateActivity(id, updatePayload)
        message.success('活动更新成功')
      } else {
        const createPayload: CreateActivityDTO = {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          category: formData.category,
          status: formData.status,
          location: formData.location,
          organizer: formData.organizer,
          poster: formData.poster,
          registrationRequired: formData.registrationRequired,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
          // 可选字段
          summary: formData.summary,
          coOrganizers: formData.coOrganizers,
          registrationDeadline: formData.registrationDeadline,
          registrationUrl: formData.registrationUrl,
          maxAttendees: formData.maxAttendees,
          tags: formData.tags,
          attachments: formData.attachments,
          images: formData.images,
          agenda: formData.agenda,
          speakers: formData.speakers,
        }
        await activityStore.createActivity(createPayload)
        message.success('活动创建成功')
      }
      router.push('/admin/activities')
    } catch (error) {
      if (error instanceof Error) {
        message.error('保存失败：' + error.message)
      } else {
        message.error('保存失败：未知错误')
      }
    }
  } catch (e) {
    message.error('表单验证失败，请检查必填项')
  }
}

onMounted(() => {
  loadActivityData()
})
</script>

<style lang="less" scoped>
.activity-form {
  .page-header {
    margin-bottom: 24px;
  }

  .poster-uploader {
    .poster-content {
      padding: 24px;

      .poster-preview {
        max-width: 100%;
        max-height: 300px;
        object-fit: contain;
      }
    }
  }

  .file-uploader {
    .ant-upload-hint {
      color: rgba(0, 0, 0, 0.45);
    }
  }
}
</style>
