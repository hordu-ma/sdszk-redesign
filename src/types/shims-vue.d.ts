/// <reference types="vite/client" />

// Element Plus 的类型声明
import type { ElDropdown } from 'element-plus'

// 声明模块
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_API_URL: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Element Plus组件属性类型
export type ElDropdownInstance = InstanceType<typeof ElDropdown>
