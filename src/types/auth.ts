/**
 * 认证相关类型定义
 */

// 用户注册请求接口
export interface RegisterRequest {
  username: string;
  fullName: string;
  password: string;
  email: string;
  phone: string;
  verificationCode: string;
}

// 用户登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

// 发送验证码请求接口
export interface SendVerificationCodeRequest {
  phone: string;
}

// 发送验证码响应接口
export interface SendVerificationCodeResponse {
  status: string;
  message: string;
  code?: string; // 开发环境返回
  waitTime?: number; // 频率限制时返回剩余等待时间
}

// 注册响应接口
export interface RegisterResponse {
  status: string;
  message: string;
  token: string;
  data: {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      permissions: string[];
      avatar?: string;
    };
  };
}

// 登录响应接口
export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  data: {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      phone?: string;
      role: string;
      permissions: string[];
      avatar?: string;
    };
  };
}

// 用户信息接口
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "co_admin" | "editor" | "user";
  permissions: string[];
  avatar?: string;
  status?: "active" | "inactive" | "banned";
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLogin?: string;
  lastLoginIp?: string;
  loginCount?: number;
  department?: string;
  position?: string;
}

// 验证码相关常量
export const VERIFICATION_CODE_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RATE_LIMIT_SECONDS: 60,
} as const;

// 表单验证规则类型
export interface AuthFormRule {
  required?: boolean;
  message: string;
  trigger?: string | string[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: any, value: any, callback: Function) => void;
}

export type AuthFormRules = Record<string, AuthFormRule[]>;
