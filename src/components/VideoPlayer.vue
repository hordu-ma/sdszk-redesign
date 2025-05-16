<template>
  <div class="video-player">
    <video
      ref="videoRef"
      :src="src"
      :poster="poster"
      class="video"
      controls
      preload="none"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    >
      您的浏览器不支持 HTML5 视频播放
    </video>
    <div class="play-overlay" v-show="!isPlaying" @click="playVideo">
      <el-icon class="play-icon"><video-play /></el-icon>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";

export interface VideoPlayerProps {
  src: string;
  poster: string;
}

export default defineComponent({
  name: "VideoPlayer",
  components: {
    VideoPlay,
  },
  props: {
    src: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
  },
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const isPlaying = ref(false);

    // 播放视频
    const playVideo = () => {
      if (videoRef.value) {
        videoRef.value.play();
      }
    };

    // 视频事件处理函数
    const onPlay = () => {
      isPlaying.value = true;
    };

    const onPause = () => {
      isPlaying.value = false;
    };

    const onEnded = () => {
      isPlaying.value = false;
    };

    return {
      videoRef,
      isPlaying,
      playVideo,
      onPlay,
      onPause,
      onEnded,
    };
  },
});
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  background: var(--background-dark, #000);
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
  color: white;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.play-overlay:hover .play-icon {
  transform: scale(1.1);
  opacity: 1;
}
</style>
