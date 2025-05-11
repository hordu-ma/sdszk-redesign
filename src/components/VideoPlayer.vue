<template>
  <div class="video-player">
    <video
      :src="src"
      :poster="poster"
      class="video"
      controls
      preload="none"
      @click="togglePlay"
    >
      您的浏览器不支持 HTML5 视频播放
    </video>
    <div class="play-overlay" v-show="!isPlaying">
      <el-icon class="play-icon"><video-play /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    required: true,
  },
});

const isPlaying = ref(false);

const togglePlay = (event) => {
  const video = event.target;
  if (video.paused) {
    video.play();
    isPlaying.value = true;
  } else {
    video.pause();
    isPlaying.value = false;
  }
};
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.4);
}

.play-icon {
  font-size: 48px;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
</style>
