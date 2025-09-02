/// <reference types="vite/client" />

// Element Plus 的类型声明
import type { ElDropdown } from "element-plus";

// 声明模块
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 环境变量类型
// ImportMeta 类型定义已移至 src/env.d.ts 统一管理
// 移除重复定义以避免类型冲突

// Element Plus组件属性类型
export type ElDropdownInstance = InstanceType<typeof ElDropdown>;
