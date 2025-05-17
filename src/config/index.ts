// 应用配置
export const APP_CONFIG = {
  title: import.meta.env.VITE_APP_TITLE || '思政课教学指导中心',
  description: import.meta.env.VITE_APP_DESCRIPTION || '服务山东省大中小学思政课教学',
  mode: import.meta.env.VITE_MODE,
}

// API配置
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
  uploadURL: import.meta.env.VITE_UPLOAD_URL || '/api/uploads',
  assetsURL: import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/uploads',
}

// 缓存配置
export const CACHE_CONFIG = {
  enabled: import.meta.env.VITE_API_CACHE_ENABLED === 'true',
  ttl: Number(import.meta.env.VITE_API_CACHE_TTL || 300000), // 默认5分钟
}

// 新闻类别
export const NEWS_CATEGORIES = [
  { key: 'center', name: '中心动态' },
  { key: 'notice', name: '通知公告' },
  { key: 'policy', name: '政策文件' },
  { key: 'theory', name: '理论前沿' },
  { key: 'teaching', name: '教学研究' },
] as const

// 资源类别
export const RESOURCE_CATEGORIES = [
  { key: 'document', name: '文档资料' },
  { key: 'video', name: '视频资源' },
  { key: 'case', name: '案例分析' },
  { key: 'ppt', name: '课件资源' },
] as const

// 文件类型
export const FILE_TYPES = {
  document: ['.doc', '.docx', '.pdf', '.txt'],
  image: ['.jpg', '.jpeg', '.png', '.gif'],
  video: ['.mp4', '.avi', '.mov'],
  ppt: ['.ppt', '.pptx'],
} as const

// 分页配置
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizes: [10, 20, 50, 100],
} as const

// 上传配置
export const UPLOAD_CONFIG = {
  maxSize: 100 * 1024 * 1024, // 100MB
  imageMaxSize: 5 * 1024 * 1024, // 5MB
  imageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  videoMaxSize: 500 * 1024 * 1024, // 500MB
  videoTypes: ['video/mp4', 'video/avi', 'video/quicktime'],
} as const
