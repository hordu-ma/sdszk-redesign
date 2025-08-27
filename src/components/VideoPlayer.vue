<template>
  <div
    class="video-player-container"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <video
      ref="videoRef"
      class="video-element"
      :src="src"
      :poster="poster"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    >
      您的浏览器不支持 HTML5 视频播放
    </video>

    <div v-show="showControls" class="video-controls">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div
class="progress" :style="{ width: progress + '%' }" />
        <input
          type="range"
          class="progress-slider"
          :value="progress"
          min="0"
          max="100"
          @input="onProgressChange"
        />
      </div>

      <div class="controls-buttons">
        <!-- 播放/暂停按钮 -->
        <button class="control-button"
@click="togglePlay">
          <el-icon :size="20">
            <component :is="isPlaying ? VideoPause : VideoPlay" />
          </el-icon>
        </button>

        <!-- 音量控制 -->
        <div class="volume-control">
          <button class="control-button"
@click="toggleMute">
            <el-icon :size="20">
              <component :is="volumeIcon" />
            </el-icon>
          </button>
          <input
            v-model="volume"
            type="range"
            class="volume-slider"
            min="0"
            max="1"
            step="0.1"
            @input="onVolumeChange"
          />
        </div>

        <!-- 时间显示 -->
        <div class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>

        <!-- 全屏按钮 -->
        <button class="control-button"
@click="toggleFullscreen">
          <el-icon :size="20">
            <component :is="isFullscreen ? Close : FullScreen" />
          </el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  VideoPlay,
  VideoPause,
  Mute,
  Microphone,
  FullScreen,
  Close,
} from "@element-plus/icons-vue";

defineOptions({
  name: "VideoPlayer",
});

const props = defineProps<{
  src: string;
  poster?: string;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);
const volume = ref(1);
const isMuted = ref(false);
const isFullscreen = ref(false);
const showControls = ref(true);
let controlsTimeout: number;

// 计算音量图标
const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return Mute;
  return Microphone;
});

// 格式化时间
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// 播放/暂停切换
const togglePlay = () => {
  if (!videoRef.value) return;
  if (isPlaying.value) {
    videoRef.value.pause();
  } else {
    videoRef.value.play();
  }
};

// 音量控制
const toggleMute = () => {
  if (!videoRef.value) return;
  isMuted.value = !isMuted.value;
  videoRef.value.muted = isMuted.value;
};

const onVolumeChange = (event: Event) => {
  if (!videoRef.value) return;
  const target = event.target as HTMLInputElement;
  const newVolume = parseFloat(target.value);
  volume.value = newVolume;
  videoRef.value.volume = newVolume;
  isMuted.value = newVolume === 0;
};

// 进度条控制
const onProgressChange = (event: Event) => {
  if (!videoRef.value) return;
  const target = event.target as HTMLInputElement;
  const newTime = (parseFloat(target.value) / 100) * duration.value;
  videoRef.value.currentTime = newTime;
};

// 全屏控制
const toggleFullscreen = () => {
  if (!videoRef.value) return;
  if (!isFullscreen.value) {
    if (videoRef.value.requestFullscreen) {
      videoRef.value.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 事件处理
const onTimeUpdate = () => {
  if (!videoRef.value) return;
  currentTime.value = videoRef.value.currentTime;
  progress.value = (currentTime.value / duration.value) * 100;
};

const onLoadedMetadata = () => {
  if (!videoRef.value) return;
  duration.value = videoRef.value.duration;
};

const onPlay = () => {
  isPlaying.value = true;
};

const onPause = () => {
  isPlaying.value = false;
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  progress.value = 0;
};

// 自动隐藏控制栏
const resetControlsTimeout = () => {
  showControls.value = true;
  clearTimeout(controlsTimeout);
  controlsTimeout = window.setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false;
    }
  }, 3000);
};

// 监听鼠标移动
const handleMouseMove = () => {
  resetControlsTimeout();
};

// 生命周期钩子
onMounted(() => {
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  clearTimeout(controlsTimeout);
});
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 10px;
  transition: opacity 0.3s ease;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 10px;
  cursor: pointer;
}

.progress {
  position: absolute;
  height: 100%;
  background: var(--primary-color, #e53935);
  border-radius: 2px;
}

.progress-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.controls-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.control-button:hover {
  color: var(--primary-color, #e53935);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.volume-slider {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
}

.time-display {
  color: #fff;
  font-size: 14px;
  font-family: monospace;
}

.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.is-fullscreen .video-element {
  height: 100vh;
}
</style>
