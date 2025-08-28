<template>
  <el-dialog
    v-model="dialogVisible"
    title="裁剪头像"
    width="500px"
    :before-close="handleClose"
    append-to-body
  >
    <div class="avatar-cropper-container">
      <div class="cropper-container">
        <vue-cropper
          ref="cropperRef"
          :img="imgSrc"
          :output-size="outputSize"
          :output-type="outputType"
          :info="true"
          :full="false"
          :can-move="true"
          :can-scale="true"
          :auto-crop="true"
          :auto-crop-width="200"
          :auto-crop-height="200"
          :fixed="true"
          :fixed-number="[1, 1]"
          :center-box="true"
          :high="true"
          @real-time="realTime"
        />
      </div>
      <div class="preview-container">
        <div class="preview-title">预览</div>
        <div
          class="preview-box"
          :style="{
            overflow: 'hidden',
            width: '100px',
            height: '100px',
            margin: '0 auto',
            borderRadius: '50%',
          }"
        >
          <div :style="previews.div" class="preview-content">
            <img :src="imgSrc" :style="previews.img" class="preview-img">
          </div>
        </div>
      </div>
      <div class="control-container">
        <div class="control-group">
          <div class="control-title">旋转</div>
          <div class="control-buttons">
            <el-button size="small" @click="rotateLeft"> 逆时针 </el-button>
            <el-button size="small" @click="rotateRight"> 顺时针 </el-button>
          </div>
        </div>
        <div class="control-group">
          <div class="control-title">缩放</div>
          <el-slider v-model="zoom" :min="1" :max="3" :step="0.1" />
        </div>
        <div class="control-group">
          <div class="control-title">图片质量 ({{ outputSize }})</div>
          <el-slider
            v-model="outputSize"
            :min="0.1"
            :max="1"
            :step="0.1"
            :format-tooltip="(value: number) => `${Math.round(value * 100)}%`"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleCrop">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

interface Props {
  visible: boolean;
  imgFile?: File;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "crop-success", blob: Blob, dataUrl: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const dialogVisible = ref(props.visible);
const imgSrc = ref("");
const cropperRef = ref();
const previews = reactive({
  div: {},
  img: {},
});

// 裁剪配置
const outputSize = ref(0.8); // 裁剪生成图片的质量(0.1-1)
const outputType = ref("png"); // 裁剪生成图片的格式
const zoom = ref(1); // 缩放比例

// 监听visible属性变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
  },
);

// 监听dialogVisible变化，同步回父组件
watch(
  () => dialogVisible.value,
  (newVal) => {
    emit("update:visible", newVal);
  },
);

// 监听imgFile变化
watch(
  () => props.imgFile,
  (newFile) => {
    if (newFile) {
      loadImage(newFile);
      // 重置缩放比例
      zoom.value = 1;
    }
  },
);

// 监听zoom变化
watch(
  () => zoom.value,
  (newZoom) => {
    handleZoom(newZoom);
  },
);

// 加载图片
const loadImage = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgSrc.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// 定义实时预览数据接口
interface RealTimeData {
  div: {
    width: string;
    height: string;
    overflow: string;
    margin: string;
  };
  img: {
    width: string;
    height: string;
    transform: string;
    marginLeft: string;
    marginTop: string;
  };
}

// 实时预览
const realTime = (data: RealTimeData) => {
  previews.div = data.div;
  previews.img = data.img;
};

// 裁剪图片
const handleCrop = () => {
  if (!cropperRef.value) return;

  cropperRef.value.getCropBlob((blob: Blob) => {
    const dataUrl = URL.createObjectURL(blob);
    emit("crop-success", blob, dataUrl);
    handleClose();
  });
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 逆时针旋转
const rotateLeft = () => {
  if (cropperRef.value) {
    cropperRef.value.rotateLeft();
  }
};

// 顺时针旋转
const rotateRight = () => {
  if (cropperRef.value) {
    cropperRef.value.rotateRight();
  }
};

// 处理缩放
const handleZoom = (value: number) => {
  if (cropperRef.value) {
    cropperRef.value.changeScale(value);
  }
};

// 组件挂载时，如果有imgFile则加载图片
onMounted(() => {
  if (props.imgFile) {
    loadImage(props.imgFile);
  }
});
</script>

<style scoped>
.avatar-cropper-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cropper-container {
  height: 300px;
  width: 100%;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.preview-title {
  font-size: 14px;
  color: #606266;
}

.preview-box {
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preview-content {
  overflow: hidden;
}

.preview-img {
  max-width: none !important;
}

.control-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-title {
  font-size: 14px;
  color: #606266;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .cropper-container {
    height: 250px;
  }

  .control-buttons {
    flex-wrap: wrap;
  }
}
</style>
