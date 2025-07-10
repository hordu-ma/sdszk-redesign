<template>
  <div class="ai-container">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="hero-content">
        <div class="ai-icon">
          <div class="icon-circle">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 class="main-title">AI思政助手</h1>
        <p class="subtitle">智能化思想政治教育对话平台</p>
        <div class="feature-tags">
          <span class="tag">智能问答</span>
          <span class="tag">案例分析</span>
          <span class="tag">教学辅助</span>
          <span class="tag">个性化推荐</span>
        </div>
      </div>
    </div>

    <!-- 对话区域 -->
    <div class="chat-section">
      <div class="chat-container">
        <!-- 示例对话气泡 -->
        <div class="message-group">
          <div class="message bot-message">
            <div class="avatar bot-avatar">
              <span>AI</span>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                您好！我是AI思政助手，专注于思想政治教育领域的智能对话。我可以帮助您：
                <ul>
                  <li>解答思政理论问题</li>
                  <li>提供教学案例分析</li>
                  <li>推荐相关学习资源</li>
                  <li>协助课程设计规划</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-container">
            <div class="input-wrapper">
              <textarea
                v-model="inputText"
                class="message-input"
                placeholder="请输入您的问题，比如：如何在新时代背景下开展大学生思想政治教育？"
                rows="1"
                disabled
              ></textarea>
              <button class="send-button" disabled>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能特色区域 -->
    <div class="features-section">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3>理论解析</h3>
          <p>深度解析马克思主义理论，提供权威准确的理论阐释</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>案例教学</h3>
          <p>结合时事热点，提供丰富的教学案例和分析思路</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3>智能搜索</h3>
          <p>快速检索相关资源，为教学科研提供精准支持</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💡</div>
          <h3>创新方法</h3>
          <p>探索新时代思政教育方法，提升教育教学效果</p>
        </div>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="footer-info">功能开发中，敬请期待</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const inputText = ref("");
</script>

<style scoped>
.ai-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 头部区域 */
.header-section {
  text-align: center;
  padding: 60px 20px 40px;
  color: white;
}

.ai-icon {
  margin-bottom: 24px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.icon-circle svg {
  width: 40px;
  height: 40px;
  color: white;
}

.main-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin: 0 0 32px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.feature-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 对话区域 */
.chat-section {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.message-group {
  padding: 30px;
  flex: 1;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.bot-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 52px);
}

.message-bubble {
  background: #f8f9fa;
  padding: 16px 20px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 15px;
  color: #2c3e50;
}

.message-bubble ul {
  margin: 12px 0 0 0;
  padding-left: 20px;
}

.message-bubble li {
  margin-bottom: 8px;
}

/* 输入区域 */
.input-section {
  padding: 20px 30px 30px;
  border-top: 1px solid #eee;
}

.input-container {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 12px 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  min-height: 24px;
  max-height: 120px;
  color: #999;
}

.message-input::placeholder {
  color: #999;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #ddd;
  color: white;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-button svg {
  width: 20px;
  height: 20px;
}

/* 功能特色区域 */
.features-section {
  background: white;
  padding: 60px 20px;
}

.features-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.feature-card p {
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 版权信息 */
.footer-info {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .feature-tags {
    gap: 8px;
  }

  .tag {
    padding: 6px 12px;
    font-size: 12px;
  }

  .chat-container {
    border-radius: 16px 16px 0 0;
    min-height: 400px;
  }

  .message-group {
    padding: 20px;
  }

  .input-section {
    padding: 16px 20px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .feature-card {
    padding: 24px 16px;
  }

  .footer-info {
    bottom: 16px;
    right: 16px;
    font-size: 11px;
  }
}
</style>
