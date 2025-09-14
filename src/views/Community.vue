<template>
  <div class="community-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="fas fa-university header-icon" />
          一体化共同体
        </h1>
        <p class="page-subtitle">山东省16地市教育和体育局</p>
      </div>
    </div>

    <!-- 教体局网格 -->
    <div class="bureaus-grid">
      <a
        v-for="bureau in educationBureaus"
        :key="bureau.id"
        :href="bureau.website"
        target="_blank"
        class="bureau-card"
        rel="noopener noreferrer"
      >
        <div class="bureau-logo">
          <img :src="bureau.logo" :alt="bureau.name" />
        </div>
        <div class="bureau-info">
          <h3 class="bureau-name">{{ bureau.name }}</h3>
          <p class="bureau-website">{{ getSimplifiedUrl(bureau.website) }}</p>
        </div>
        <div class="visit-icon">
          <i class="fas fa-external-link-alt" />
        </div>
      </a>
    </div>

    <!-- 返回首页按钮 -->
    <div class="back-section">
      <router-link to="/" class="back-btn">
        <i class="fas fa-arrow-left" />
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import jinanLogo from "../assets/images/education-logos/jinan.jpeg";
import qingdaoLogo from "../assets/images/education-logos/qingdao.jpeg";
import ziboLogo from "../assets/images/education-logos/zibo.jpeg";
import zaozhuangLogo from "../assets/images/education-logos/zaozhuang.jpeg";
import dongyingLogo from "../assets/images/education-logos/dongying.jpeg";
import yantaiLogo from "../assets/images/education-logos/yantai.jpeg";
import weifangLogo from "../assets/images/education-logos/weifang.jpeg";
import jiningLogo from "../assets/images/education-logos/jining.jpeg";
import taianLogo from "../assets/images/education-logos/taian.jpeg";
import weihaiLogo from "../assets/images/education-logos/weihai.png";
import rizhaoLogo from "../assets/images/education-logos/rizhao.jpeg";
import linyiLogo from "../assets/images/education-logos/linyi.jpeg";
import dezhouLogo from "../assets/images/education-logos/dezhou.jpeg";
import liaochengLogo from "../assets/images/education-logos/liaocheng.jpeg";
import binzhouLogo from "../assets/images/education-logos/binzhou.jpeg";
import hezeLogo from "../assets/images/education-logos/heze.jpeg";

const educationBureaus = ref([
  {
    id: 1,
    name: "济南市教育局",
    logo: jinanLogo,
    website: "http://jnedu.jinan.gov.cn",
  },
  {
    id: 2,
    name: "青岛市教育局",
    logo: qingdaoLogo,
    website: "http://edu.qingdao.gov.cn",
  },
  {
    id: 3,
    name: "淄博市教育和体育局",
    logo: ziboLogo,
    website: "http://edu.zibo.gov.cn",
  },
  {
    id: 4,
    name: "枣庄市教育和体育局",
    logo: zaozhuangLogo,
    website: "http://edu.zaozhuang.gov.cn",
  },
  {
    id: 5,
    name: "东营市教育和体育局",
    logo: dongyingLogo,
    website: "http://dyjy.dongying.gov.cn",
  },
  {
    id: 6,
    name: "烟台市教育和体育局",
    logo: yantaiLogo,
    website: "http://jyj.yantai.gov.cn",
  },
  {
    id: 7,
    name: "潍坊市教育和体育局",
    logo: weifangLogo,
    website: "http://jyj.weifang.gov.cn",
  },
  {
    id: 8,
    name: "济宁市教育局",
    logo: jiningLogo,
    website: "https://jnjy.jining.gov.cn",
  },
  {
    id: 9,
    name: "泰安市教育局",
    logo: taianLogo,
    website: "http://jyj.taian.gov.cn",
  },
  {
    id: 10,
    name: "威海市教育和体育局",
    logo: weihaiLogo,
    website: "http://jyj.weihai.gov.cn",
  },
  {
    id: 11,
    name: "日照市教育和体育局",
    logo: rizhaoLogo,
    website: "http://jyj.rizhao.gov.cn",
  },
  {
    id: 12,
    name: "临沂市教育和体育局",
    logo: linyiLogo,
    website: "http://jyj.linyi.gov.cn",
  },
  {
    id: 13,
    name: "德州市教育和体育局",
    logo: dezhouLogo,
    website: "http://dzedu.dezhou.gov.cn",
  },
  {
    id: 14,
    name: "聊城市教育和体育局",
    logo: liaochengLogo,
    website: "http://jyty.liaocheng.gov.cn",
  },
  {
    id: 15,
    name: "滨州市教育和体育局",
    logo: binzhouLogo,
    website: "http://jy.binzhou.gov.cn",
  },
  {
    id: 16,
    name: "菏泽市教育和体育局",
    logo: hezeLogo,
    website: "http://hzjy.heze.gov.cn",
  },
]);

// 简化URL显示
const getSimplifiedUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
};
</script>

<style scoped>
.community-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
}

.page-header {
  background: linear-gradient(135deg, #9a2314 0%, #c54a3a 100%);
  color: white;
  padding: 60px 20px 80px;
  text-align: center;
  position: relative;
}

.page-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  clip-path: ellipse(100% 100% at 50% 100%);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.header-icon {
  font-size: 42px;
  color: #ffdd59;
}

.page-subtitle {
  font-size: 20px;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
}

.bureaus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
  max-width: 1400px;
  margin: -40px auto 60px;
  padding: 0 20px;
}

.bureau-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-decoration: none;
  color: inherit;
  transition: all 0.4s ease;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 2px solid transparent;
}

.bureau-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(154, 35, 20, 0.02) 0%,
    rgba(197, 74, 58, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bureau-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.15);
  border-color: #9a2314;
}

.bureau-card:hover::before {
  opacity: 1;
}

.bureau-logo {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bureau-card:hover .bureau-logo {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.bureau-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.bureau-card:hover .bureau-logo img {
  transform: scale(1.1);
}

.bureau-info {
  flex-grow: 1;
}

.bureau-name {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.3;
  transition: color 0.3s ease;
}

.bureau-card:hover .bureau-name {
  color: #9a2314;
}

.bureau-website {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  font-family: "Consolas", "Monaco", monospace;
  transition: color 0.3s ease;
}

.bureau-card:hover .bureau-website {
  color: #34495e;
}

.visit-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #ecf0f1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.visit-icon i {
  font-size: 16px;
  color: #7f8c8d;
  transition: all 0.3s ease;
}

.bureau-card:hover .visit-icon {
  background: #9a2314;
  transform: scale(1.1);
}

.bureau-card:hover .visit-icon i {
  color: white;
  transform: rotate(-5deg);
}

.back-section {
  text-align: center;
  padding: 40px 20px 60px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: white;
  color: #9a2314;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 500;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid #9a2314;
}

.back-btn:hover {
  background: #9a2314;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(154, 35, 20, 0.3);
}

.back-btn i {
  transition: transform 0.3s ease;
}

.back-btn:hover i {
  transform: translateX(-3px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 40px 20px 60px;
  }

  .page-title {
    font-size: 36px;
    flex-direction: column;
    gap: 15px;
  }

  .header-icon {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 18px;
  }

  .bureaus-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    margin: -30px auto 40px;
  }

  .bureau-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .bureau-logo {
    width: 60px;
    height: 60px;
  }

  .bureau-name {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 30px 15px 50px;
  }

  .page-title {
    font-size: 28px;
  }

  .bureaus-grid {
    padding: 0 15px;
    margin: -25px auto 30px;
  }

  .bureau-card {
    padding: 15px;
  }

  .back-section {
    padding: 30px 15px 40px;
  }
}
</style>
