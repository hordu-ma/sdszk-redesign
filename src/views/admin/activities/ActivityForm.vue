# filepath:
/Users/liguoma/my-devs/sdszk-redesign/src/views/admin/activities/ActivityForm.vue
<template>
  <div class="activity-form">
    <div class="page-header">
      <h1>{{ isEdit ? "编辑活动" : "创建活动" }}</h1>
    </div>

    <a-card>
      <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
        <!-- 基本信息 -->
        <a-form-item label="活动名称" name="title">
          <a-input
            v-model:value="formState.title"
            placeholder="请输入活动名称"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" name="startDate">
              <a-date-picker
                v-model:value="formState.startDate"
                style="width: 100%"
                :show-time="{ format: 'HH:mm' }"
                format="YYYY-MM-DD HH:mm"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" name="endDate">
              <a-date-picker
                v-model:value="formState.endDate"
                style="width: 100%"
                :show-time="{ format: 'HH:mm' }"
                format="YYYY-MM-DD HH:mm"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="活动地点" name="location">
          <a-input
            v-model:value="formState.location"
            placeholder="请输入活动地点"
          />
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
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            list-type="picture-card"
            class="poster-uploader"
            :show-upload-list="false"
          >
            <img v-if="imageUrl" :src="imageUrl" alt="活动海报" />
            <div v-else>
              <PlusOutlined />
              <div class="ant-upload-text">上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <!-- 活动描述 -->
        <a-form-item label="活动描述" name="description">
          <RichTextEditor v-model:value="formState.description" />
        </a-form-item>

        <!-- 提交按钮 -->
        <a-form-item>
          <a-space>
            <a-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
            >
              保存
            </a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import RichTextEditor from "@/components/admin/RichTextEditor.vue";

export default {
  name: "ActivityForm",
  components: {
    PlusOutlined,
    RichTextEditor,
  },

  setup() {
    const router = useRouter();
    const route = useRoute();
    const formRef = ref();
    const submitting = ref(false);
    const isEdit = ref(false);
    const imageUrl = ref("");
    const fileList = ref([]);

    // 表单数据
    const formState = reactive({
      title: "",
      startDate: null,
      endDate: null,
      location: "",
      status: "upcoming",
      poster: "",
      description: "",
    });

    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: "请输入活动名称", trigger: "blur" },
        {
          min: 2,
          max: 100,
          message: "活动名称长度应在2-100个字符之间",
          trigger: "blur",
        },
      ],
      startDate: [
        { required: true, message: "请选择开始时间", trigger: "change" },
      ],
      endDate: [
        { required: true, message: "请选择结束时间", trigger: "change" },
      ],
      location: [
        { required: true, message: "请输入活动地点", trigger: "blur" },
      ],
      status: [
        { required: true, message: "请选择活动状态", trigger: "change" },
      ],
      description: [
        { required: true, message: "请输入活动描述", trigger: "blur" },
      ],
    };

    // 检查是否是编辑模式
    const checkEditMode = async () => {
      const id = route.params.id;
      if (id) {
        isEdit.value = true;
        try {
          // TODO: 从API获取活动数据
          // 模拟数据
          const data = {
            _id: "1",
            title: "2023年暑期思政教师培训",
            startDate: "2023-07-10 09:00",
            endDate: "2023-07-15 17:00",
            location: "山东省会议中心",
            status: "upcoming",
            poster: "/temp/activity-1.jpg",
            description: "为提高思政课教学质量，特举办本次培训...",
          };

          // 填充表单数据
          formState.title = data.title;
          formState.startDate = dayjs(data.startDate);
          formState.endDate = dayjs(data.endDate);
          formState.location = data.location;
          formState.status = data.status;
          formState.description = data.description;

          if (data.poster) {
            imageUrl.value = data.poster;
          }
        } catch (error) {
          message.error("加载活动数据失败");
          console.error(error);
        }
      }
    };

    // 上传前的校验
    const beforeUpload = (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        message.error("只能上传 JPG/PNG 格式的图片！");
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("图片大小不能超过 2MB！");
      }
      return isJpgOrPng && isLt2M;
    };

    // 提交表单
    const handleSubmit = () => {
      formRef.value
        .validate()
        .then(() => {
          submitting.value = true;
          // TODO: 调用API保存数据
          setTimeout(() => {
            submitting.value = false;
            message.success(isEdit.value ? "活动更新成功" : "活动创建成功");
            goBack();
          }, 1000);
        })
        .catch((error) => {
          console.log("验证失败:", error);
        });
    };

    // 返回列表页
    const goBack = () => {
      router.push("/admin/activities/list");
    };

    onMounted(() => {
      checkEditMode();
    });

    return {
      formRef,
      formState,
      rules,
      submitting,
      isEdit,
      imageUrl,
      fileList,
      beforeUpload,
      handleSubmit,
      goBack,
    };
  },
};
</script>

<style scoped>
.activity-form {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.poster-uploader {
  width: 300px;
}

:deep(.ant-upload-select-picture-card) {
  width: 300px;
  height: 169px;
}

:deep(.ant-upload-select-picture-card img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
