<template>
  <div class="about-container">
    <!-- 主要内容区域 -->
    <div class="about-content">
      <!-- 中心介绍 -->
      <section class="content-section">
        <h2>中心简介</h2>
        <div class="section-content">
          <p>
            山东省大中小学思政课一体化建设指导中心是省内首个专注于思政课一体化建设的专业平台。中心自成立以来，始终秉持"立德树人、固本培元"的教育理念，致力于推动大中小学思政课一体化建设工作，构建思政课程一体化建设的协同育人机制。
          </p>
          <p>
            中心通过整合全省优质教育资源，搭建教师交流平台，开展教学研究活动，促进教育教学改革创新，为提高思政课教学质量和育人实效提供有力支撑。同时，中心积极探索"互联网+思政课"新模式，推动思政课教学与现代信息技术的深度融合，实现优质教育资源共建共享。
          </p>
        </div>
      </section>

      <!-- 发展历程 -->
      <section class="content-section">
        <h2>发展历程</h2>
        <div class="section-content">
          <div class="timeline">
            <div class="timeline-item">
              <span class="time">2020年7月</span>
              <div class="event">平台启动筹备工作，开始进行前期调研和规划</div>
            </div>
            <div class="timeline-item">
              <span class="time">2021年2月</span>
              <div class="event">正式进入开发阶段，组建专业技术团队</div>
            </div>
            <div class="timeline-item">
              <span class="time">2021年6月</span>
              <div class="event">
                平台正式上线并投入运营，开启思政课一体化建设新篇章
              </div>
            </div>
            <div class="timeline-item">
              <span class="time">2021-2025</span>
              <div class="event">平台稳定运行超过四年，持续优化升级服务</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 平台数据 -->
      <section class="content-section">
        <h2>平台数据</h2>
        <div class="data-grid">
          <div class="data-card">
            <div class="data-number">2.67万</div>
            <div class="data-label">注册用户</div>
            <div class="data-desc">
              涵盖大中小学思政课教师、教育管理者及相关人员
            </div>
          </div>
          <div class="data-card">
            <div class="data-number">3万+</div>
            <div class="data-label">公众号粉丝</div>
            <div class="data-desc">形成线上线下联动的良好生态</div>
          </div>
          <div class="data-card">
            <div class="data-number">15个</div>
            <div class="data-label">覆盖省份</div>
            <div class="data-desc">影响力辐射全国多个地区</div>
          </div>
        </div>
      </section>

      <!-- 地域分布 -->
      <section class="content-section">
        <h2>覆盖区域</h2>
        <div class="section-content">
          <div class="region-content">
            <p class="region-desc">
              一体化中心平台的影响力已扩展至全国范围，覆盖多个重点省份：
            </p>
            <div class="region-list">
              <span class="region-item">北京</span>
              <span class="region-item">天津</span>
              <span class="region-item">河北</span>
              <span class="region-item">山西</span>
              <span class="region-item">上海</span>
              <span class="region-item">浙江</span>
              <span class="region-item">等省市</span>
            </div>
            <p class="region-summary">
              尤其是在集体备课会等教研活动中，平台的受训人员遍布全国各省市，充分体现了其在推动思政课教育资源共享和区域协作方面的显著成效。这种广泛的地理覆盖，不仅彰显了平台在全国思政教育领域的认可度，也为未来进一步拓展奠定了用户基础。
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// 组件逻辑可以在这里添加
</script>

<style scoped>
.about-container {
  width: 100%;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
  padding-top: 30px;
}

.about-content {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

.content-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.content-section:hover {
  transform: translateY(-5px);
}

.content-section h2 {
  font-family: "STZhongsong", "Microsoft YaHei", sans-serif;
  font-size: 24px;
  padding: 15px 20px;
  background: linear-gradient(to right, #9a2314, #c44836);
  color: white;
  margin: 0;
}

.section-content {
  padding: 25px;
  line-height: 1.8;
  color: #333;
}

/* 时间线样式 */
.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  position: relative;
  padding-left: 30px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #9a2314;
}

.timeline-item::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 20px;
  width: 2px;
  height: calc(100% + 10px);
  background: #e5e5e5;
}

.timeline-item:last-child::after {
  display: none;
}

.time {
  font-weight: bold;
  color: #9a2314;
  min-width: 100px;
  margin-right: 20px;
}

.event {
  flex: 1;
  color: #666;
}

/* 数据展示卡片 */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  padding: 25px;
}

.data-card {
  text-align: center;
  padding: 30px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(154, 35, 20, 0.1);
}

.data-number {
  font-size: 36px;
  font-weight: bold;
  color: #9a2314;
  margin-bottom: 10px;
}

.data-label {
  color: #333;
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: 500;
}

.data-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 地域分布样式 */
.region-content {
  padding: 0 20px;
}

.region-desc {
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}

.region-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.region-item {
  padding: 8px 20px;
  background: #f8f9fa;
  border-radius: 20px;
  color: #666;
  font-size: 15px;
  transition: all 0.3s ease;
}

.region-item:hover {
  background: #9a2314;
  color: white;
  transform: translateY(-2px);
}

.region-summary {
  color: #666;
  line-height: 1.8;
  text-indent: 2em;
}

@media screen and (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }

  .timeline-item {
    flex-direction: column;
  }

  .time {
    margin-bottom: 10px;
  }
}
</style>
