/**
 * 基础URL处理工具函数
 * 用于在不同模式下正确处理资源路径
 */

/**
 * 获取当前应用的基础路径
 * 根据环境变量和运行模式自动适配
 * @returns {string} 基础路径
 */
export const getBasePath = () => {
  if (import.meta.env.DEV) {
    return "/"; // 开发模式下总是使用根路径
  }

  // 检查是否有特定环境变量
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }

  // 否则使用Vite的默认BASE_URL
  return import.meta.env.BASE_URL || "/";
};

/**
 * 根据当前基础路径拼接资源路径
 * @param {string} path 资源相对路径
 * @returns {string} 完整资源路径
 */
export const getAssetPath = (path) => {
  const base = getBasePath();
  // 去掉路径中可能的重复斜杠
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

/**
 * 检查当前是否为预览模式
 * @returns {boolean}
 */
export const isPreviewMode = () => {
  return import.meta.env.VITE_MODE === "preview";
};
