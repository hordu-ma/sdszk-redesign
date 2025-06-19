// conditionalApi.ts - 根据环境选择合适的API配置
import defaultApi from "./api";
import githubPagesApi from "./api.github-pages";

// 检测是否在GitHub Pages环境下
const isGitHubPages = () => {
  // 检查URL是否包含github.io域名
  const isGitHubDomain = window.location.hostname.includes("github.io");

  // 检查是否使用github-pages构建模式
  const isGitHubPagesMode = import.meta.env.MODE === "github-pages";

  return isGitHubDomain || isGitHubPagesMode;
};

// 导出适合当前环境的API配置
const api = isGitHubPages() ? githubPagesApi : defaultApi;

console.log(`🔄 使用API配置: ${isGitHubPages() ? "GitHub Pages" : "默认"}`);

export default api;
