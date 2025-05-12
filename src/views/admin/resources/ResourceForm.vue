<template>
  <div class="resource-form-container">
    <!-- 表单头部 -->
    <div class="form-header">
      <h2>{{ isEdit ? "编辑资源" : "新增资源" }}</h2>
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </div>

    <!-- 主表单内容 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="resource-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资源标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入资源标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择资源类型">
                <el-option label="理论研究" value="theory" />
                <el-option label="教学研究" value="teaching" />
                <el-option label="教学课件" value="courseware" />
                <el-option label="视频资源" value="video" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input
                v-model="formData.author"
                placeholder="请输入作者姓名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属单位" prop="affiliation">
              <el-input
                v-model="formData.affiliation"
                placeholder="请输入所属单位"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="资源简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            rows="4"
            placeholder="请输入资源简介"
          />
        </el-form-item>
      </div>

      <!-- 资源内容 -->
      <div class="form-section">
        <h3 class="section-title">资源内容</h3>
        <el-form-item
          v-if="formData.type === 'video'"
          label="视频上传"
          prop="videoUrl"
        >
          <el-upload
            class="resource-upload"
            action="/api/upload"
            :limit="1"
            :on-success="handleVideoUpload"
          >
            <el-button type="primary">上传视频</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持mp4格式视频文件，单个文件不超过500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item v-else label="正文内容" prop="content">
          <rich-text-editor v-model="formData.content" />
        </el-form-item>

        <el-form-item label="附件上传">
          <el-upload
            class="resource-upload"
            action="/api/upload"
            :on-success="handleAttachmentUpload"
            multiple
          >
            <el-button type="primary">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持doc、pdf、ppt等格式文件，单个文件不超过50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </div>

      <!-- 发布信息 -->
      <div class="form-section">
        <h3 class="section-title">发布信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布日期" prop="publishDate">
              <el-date-picker
                v-model="formData.publishDate"
                type="datetime"
                placeholder="选择发布日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio label="draft">草稿</el-radio>
                <el-radio label="published">发布</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入标签"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useResourceStore } from "@/stores/resource";
import RichTextEditor from "@/components/admin/RichTextEditor.vue";
import { message } from "ant-design-vue";

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const resourceStore = useResourceStore();

// 判断是否为编辑模式
const isEdit = computed(() => route.params.id !== undefined);

// 表单数据
const formData = ref({
  title: "",
  type: "",
  author: "",
  affiliation: "",
  description: "",
  content: "",
  videoUrl: "",
  attachments: [],
  publishDate: new Date(),
  status: "draft",
  tags: [],
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: "请输入资源标题", trigger: "blur" },
    { min: 2, max: 100, message: "标题长度在2-100个字符之间", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择资源类型", trigger: "change" }],
  author: [{ required: true, message: "请输入作者姓名", trigger: "blur" }],
  affiliation: [{ required: true, message: "请输入所属单位", trigger: "blur" }],
  description: [
    { required: true, message: "请输入资源简介", trigger: "blur" },
    {
      min: 10,
      max: 500,
      message: "简介长度在10-500个字符之间",
      trigger: "blur",
    },
  ],
  content: [{ required: true, message: "请输入正文内容", trigger: "blur" }],
  publishDate: [
    { required: true, message: "请选择发布日期", trigger: "change" },
  ],
};

// 标签选项
const tagOptions = ref([
  "思政理论",
  "教学方法",
  "课程建设",
  "实践教学",
  "教材建设",
  "教学创新",
]);

// 处理视频上传
const handleVideoUpload = (response) => {
  formData.value.videoUrl = response.url;
  message.success("视频上传成功");
};

// 处理附件上传
const handleAttachmentUpload = (response) => {
  formData.value.attachments.push({
    name: response.name,
    url: response.url,
    size: response.size,
  });
  message.success("附件上传成功");
};

// 加载资源数据(编辑模式)
const loadResourceData = async (id) => {
  try {
    const data = await resourceStore.fetchResourceById(id);
    formData.value = {
      ...data,
      publishDate: new Date(data.publishDate),
    };
  } catch (error) {
    message.error("加载资源数据失败");
    console.error("加载资源数据失败:", error);
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();

    // 根据模式调用不同的API
    if (isEdit.value) {
      await resourceStore.updateResource(route.params.id, formData.value);
      message.success("更新成功");
    } else {
      await resourceStore.createResource(formData.value);
      message.success("创建成功");
    }

    router.push("/admin/resources/list");
  } catch (error) {
    if (error.name === "ValidationError") {
      return; // 验证错误已经由 element-plus 展示
    }
    message.error("保存失败，请重试");
    console.error("保存资源失败:", error);
  }
};

// 取消编辑
const handleCancel = () => {
  router.back();
};

// 组件挂载时，如果是编辑模式则加载数据
onMounted(() => {
  if (isEdit.value) {
    loadResourceData(route.params.id);
  }
});
</script>

<style scoped>
.resource-form-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.form-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 20px;
  padding-left: 12px;
  border-left: 3px solid #9a2314;
}

.resource-upload {
  display: block;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-upload__tip) {
  margin-top: 8px;
  color: #666;
}

@media screen and (max-width: 768px) {
  .resource-form-container {
    padding: 16px;
  }

  .form-section {
    padding: 16px;
  }

  .el-row {
    margin: 0 !important;
  }

  .el-col {
    padding: 0 !important;
  }
}
</style>
