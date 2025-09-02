/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, unknown>
  >;
  export default component;
}

interface ImportMetaEnv {
  // 应用配置
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_DESC: string;
  readonly VITE_APP_DEBUG: string;

  // API配置
  readonly VITE_API_PREFIX: string; // 统一的API前缀，默认 "/api"
  readonly VITE_API_VERSION: string; // API版本，默认 ""
  readonly VITE_API_TIMEOUT: string;

  // 上传配置
  readonly VITE_UPLOAD_MAX_SIZE: string;
  readonly VITE_UPLOAD_ACCEPT_TYPES: string;
  readonly VITE_ENABLE_COMPRESSION?: string;
  readonly VITE_COMPRESSION_THRESHOLD?: string;

  // 缓存配置
  readonly VITE_CACHE_ENABLED: string;
  readonly VITE_CACHE_TTL: string;
  readonly VITE_CACHE_MAX_SIZE: string;

  // 分页配置
  readonly VITE_PAGE_SIZE: string;
  readonly VITE_PAGE_SIZES: string;

  // 调试配置
  readonly VITE_ENABLE_LOGGER: string;
  readonly VITE_API_MOCK: string;
}

/**
 * ImportMeta 类型增强
 *
 * 这个接口扩展了 import.meta 的类型定义，为 Vite 项目提供环境变量的类型支持。
 * 虽然某些诊断工具可能报告此接口"未使用"，但它实际上被以下方式使用：
 * - import.meta.env.VITE_APP_TITLE
 * - import.meta.env.VITE_API_PREFIX
 * - 以及其他所有 import.meta.env.* 访问
 *
 * 这是 Vite + TypeScript 项目的标准模式，删除此接口会导致类型错误。
 * 如果诊断工具报告警告，可以安全忽略。
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
