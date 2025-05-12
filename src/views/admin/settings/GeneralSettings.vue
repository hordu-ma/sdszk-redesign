<template>
  <div class="general-settings">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="settings-form"
    >
      <!-- 基本设置 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <h3>基本设置</h3>
          </div>
        </template>
        <el-form-item label="网站标题" prop="siteTitle">
          <el-input v-model="form.siteTitle" />
        </el-form-item>
        <el-form-item label="网站描述" prop="siteDescription">
          <el-input v-model="form.siteDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备案号" prop="icp">
          <el-input v-model="form.icp" />
        </el-form-item>
      </el-card>

      <!-- 联系方式 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <h3>联系方式</h3>
          </div>
        </template>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="办公地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
      </el-card>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          保存设置
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

const formRef = ref(null);
const loading = ref(false);

// 表单数据
const form = ref({
  siteTitle: "",
  siteDescription: "",
  icp: "",
  phone: "",
  email: "",
  address: "",
});

// 表单验证规则
const rules = {
  siteTitle: [
    { required: true, message: "请输入网站标题", trigger: "blur" },
    { min: 2, max: 50, message: "长度在2到50个字符", trigger: "blur" },
  ],
  siteDescription: [
    { required: true, message: "请输入网站描述", trigger: "blur" },
    { min: 10, max: 200, message: "长度在10到200个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入联系邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
};

// 初始化数据
onMounted(async () => {
  // 这里应该从API获取设置数据
  // 暂时使用模拟数据
  form.value = {
    siteTitle: "山东省大中小学思政课一体化指导中心",
    siteDescription:
      "为全省大中小学思政课教学提供专业指导和服务支持的综合性平台",
    icp: "鲁ICP备XXXXXXXX号",
    phone: "0531-XXXXXXXX",
    email: "contact@sdszk.edu.cn",
    address: "山东省济南市历下区文化东路88号",
  };
});

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 这里应该调用API保存设置
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟API调用
    ElMessage.success("设置保存成功");
  } catch (error) {
    console.error("表单验证失败:", error);
    ElMessage.error("请检查表单填写是否正确");
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};
</script>

<style scoped>
.general-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.setting-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.settings-form {
  max-width: 800px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f8f9fa;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
