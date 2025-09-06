<template>
  <div class="activity-signup-container">
    <header class="page-header">
      <h1>平台活动报名</h1>
      <p>请选择您感兴趣的活动并填写报名信息</p>
    </header>

    <main class="content-area">
      <div class="activity-list">
        <h2>可选活动</h2>
        <div v-if="loading">正在加载活动...</div>
        <div v-else-if="activities.length === 0">暂无可报名的活动</div>
        <div v-else>
          <div
            v-for="activity in activities"
            :key="activity._id"
            class="activity-item"
            :class="{ selected: selectedActivity === activity._id }"
            @click="selectActivity(activity._id)"
          >
            <h3>{{ activity.title }}</h3>
            <p>{{ new Date(activity.startDate).toLocaleDateString() }} 开始</p>
          </div>
        </div>
      </div>

      <div class="signup-form-wrapper">
        <h2>填写报名信息</h2>
        <form v-if="selectedActivity" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">姓名</label>
              <input type="text" id="name" v-model="form.name" required />
            </div>
            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label><input type="radio" v-model="form.gender" value="男" />
                  男</label>
                <label><input type="radio" v-model="form.gender" value="女" />
                  女</label>
              </div>
            </div>
            <div class="form-group">
              <label for="organization">单位名称</label>
              <input
                type="text"
                id="organization"
                v-model="form.organization"
                required
              />
            </div>
            <div class="form-group">
              <label for="schoolType">学校类别</label>
              <select id="schoolType" v-model="form.schoolType" required>
                <option disabled value="">请选择</option>
                <option>大学</option>
                <option>高中</option>
                <option>初中</option>
                <option>小学</option>
              </select>
            </div>
            <div class="form-group">
              <label for="position">职务</label>
              <input type="text" id="position" v-model="form.position" />
            </div>
            <div class="form-group">
              <label for="professionalTitle">职称</label>
              <input
                type="text"
                id="professionalTitle"
                v-model="form.professionalTitle"
              />
            </div>
            <div class="form-group">
              <label for="educationLevel">学历</label>
              <input
                type="text"
                id="educationLevel"
                v-model="form.educationLevel"
              />
            </div>
            <div class="form-group">
              <label for="phone">联系电话</label>
              <input type="tel" id="phone" v-model="form.phone" required />
            </div>
            <div class="form-group full-width">
              <label for="email">邮箱地址</label>
              <input type="email" id="email" v-model="form.email" required />
            </div>
            <div class="form-group full-width">
              <label for="attachment">上传文件 (可选)</label>
              <input type="file" id="attachment" @change="handleFileUpload" />
            </div>
            <div class="form-group full-width">
              <label for="notes">备注</label>
              <textarea id="notes" v-model="form.notes" />
            </div>
          </div>
          <button type="submit" :disabled="submitting" class="full-width">
            {{ submitting ? "正在提交..." : "确认报名" }}
          </button>
        </form>
        <div v-else class="form-placeholder">
          <p>请先从左侧选择一个活动</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// 模拟的API调用，后续需要替换为真实API
// import { getActivities } from '@/api/activity';
// import { createRegistration } from '@/api/activityRegistration';

const initialFormState = {
  name: "",
  gender: "男",
  organization: "",
  schoolType: "",
  position: "",
  professionalTitle: "",
  educationLevel: "",
  phone: "",
  email: "",
  attachmentPath: "",
  notes: "",
};

// --- Reactive State ---
const activities = ref<any[]>([]);
const loading = ref(true);
const selectedActivity = ref<string | null>(null);
const form = ref({ ...initialFormState });
const submitting = ref(false);
const selectedFile = ref<File | null>(null);

// --- Functions ---
const fetchActivities = async () => {
  loading.value = true;
  try {
    console.log("Fetching activities...");
    activities.value = [
      { _id: "1", title: "思政课教学方法研讨会", startDate: "2025-10-15" },
      { _id: "2", title: "新时代教师职业发展论坛", startDate: "2025-11-01" },
    ];
  } catch (error) {
    console.error("获取活动列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const selectActivity = (activityId: string) => {
  selectedActivity.value = activityId;
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    // 在真实场景中，这里会调用上传文件的API
    // form.value.attachmentPath = await uploadFile(selectedFile.value);
    console.log("File selected:", selectedFile.value.name);
  }
};

const handleSubmit = async () => {
  if (!selectedActivity.value) {
    alert("请先选择一个活动");
    return;
  }

  submitting.value = true;
  try {
    // 伪代码: 如果有文件，先上传文件获取路径
    // if (selectedFile.value) {
    //   form.value.attachmentPath = await uploadFile(selectedFile.value);
    // }

    const registrationData = {
      activityId: selectedActivity.value,
      ...form.value,
    };
    console.log("Submitting registration:", registrationData);
    alert("报名成功！");
    form.value = { ...initialFormState };
    selectedActivity.value = null;
    selectedFile.value = null;
    // 重置文件输入框
    const fileInput = document.getElementById("attachment") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  } catch (error) {
    console.error("报名失败:", error);
    alert("报名失败，请稍后再试。");
  } finally {
    submitting.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchActivities();
});
</script>

<style scoped>
.activity-signup-container {
  padding: 2rem;
  font-family: sans-serif;
  max-width: 1200px;
  margin: auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.2rem; /* 缩小字体 */
}

.content-area {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.activity-list {
  flex: 1;
  min-width: 300px;
}

.activity-item {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.activity-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-item.selected {
  background-color: #e7f3ff;
  border-color: #007bff;
}

.signup-form-wrapper {
  flex: 1.5;
  min-width: 400px;
  border: 1px solid #eee;
  padding: 2rem;
  border-radius: 8px;
}

.form-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group input[type="tel"],
.form-group input[type="email"],
.form-group input[type="file"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  height: 100%;
}

.radio-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

button.full-width {
  width: 100%;
  margin-top: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
