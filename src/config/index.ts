interface ImportMetaEnv {
  VITE_APP_TITLE: string
  VITE_APP_DESC: string
  VITE_API_BASE_URL: string
  VITE_API_TIMEOUT: string
  VITE_UPLOAD_MAX_SIZE: string
  VITE_UPLOAD_ACCEPT_TYPES: string
  VITE_CACHE_ENABLED: string
  VITE_CACHE_TTL: string
  VITE_CACHE_MAX_SIZE: string
  VITE_PAGE_SIZE: string
  VITE_PAGE_SIZES: string
  VITE_APP_DEBUG: string
  VITE_ENABLE_LOGGER: string
  VITE_API_MOCK: string
  VITE_ENABLE_COMPRESSION?: string
  VITE_COMPRESSION_THRESHOLD?: string
}

// 环境变量类型声明
interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 应用配置
export const APP_CONFIG = {
  title: import.meta.env.VITE_APP_TITLE,
  description: import.meta.env.VITE_APP_DESC,
  debug: import.meta.env.VITE_APP_DEBUG === 'true',
  mock: import.meta.env.VITE_API_MOCK === 'true',
  env: import.meta.env.MODE,
} as const

// API配置
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT),
  mock: import.meta.env.VITE_API_MOCK === 'true',
  logger: import.meta.env.VITE_ENABLE_LOGGER === 'true',
} as const

// 缓存配置
export const CACHE_CONFIG = {
  enabled: import.meta.env.VITE_CACHE_ENABLED === 'true',
  ttl: Number(import.meta.env.VITE_CACHE_TTL) * 1000, // 转换为毫秒
  maxSize: Number(import.meta.env.VITE_CACHE_MAX_SIZE),
  clearOnError: true, // 发生错误时清除缓存
} as const

// 调试配置
export const DEBUG_CONFIG = {
  enabled: import.meta.env.VITE_APP_DEBUG === 'true',
  logger: import.meta.env.VITE_ENABLE_LOGGER === 'true',
} as const

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
  defaultPageSize: Number(import.meta.env.VITE_PAGE_SIZE),
  pageSizes: import.meta.env.VITE_PAGE_SIZES.split(',').map(Number),
} as const

// 上传配置
export const UPLOAD_CONFIG = {
  maxSize: Number(import.meta.env.VITE_UPLOAD_MAX_SIZE) * 1024 * 1024, // 转换为字节
  acceptTypes: import.meta.env.VITE_UPLOAD_ACCEPT_TYPES.split(','),
  compression: {
    enabled: import.meta.env.VITE_ENABLE_COMPRESSION === 'true',
    threshold: Number(import.meta.env.VITE_COMPRESSION_THRESHOLD || 1024),
  },
  typeGroups: {
    document: ['.doc', '.docx', '.pdf', '.txt'],
    image: ['.jpg', '.jpeg', '.png', '.gif'],
    video: ['.mp4', '.avi', '.mov'],
    audio: ['.mp3', '.wav'],
    presentation: ['.ppt', '.pptx'],
    spreadsheet: ['.xls', '.xlsx'],
  },
} as const

// 服务状态码
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  SERVER_ERROR: 500,
} as const

// 业务错误码
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const
