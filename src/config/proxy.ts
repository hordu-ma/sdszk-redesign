// 延迟导入，避免在Vite配置加载时访问环境变量

/**
 * 通用代理配置
 *
 * 统一管理所有环境的API代理配置，确保开发、测试、生产环境的一致性
 *
 * 设计原则：
 * 1. 不使用 rewrite，保持路径完整性
 * 2. 前端完全控制API路径
 * 3. 所有环境使用相同的代理逻辑
 */
export interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  timeout: number;
  configure?: (proxy: any, options: any) => void;
}

/**
 * 创建标准化的代理配置
 *
 * @param target 后端服务器地址
 * @param options 额外配置选项
 * @returns 代理配置对象
 */
export function createProxyConfig(
  target: string = "http://localhost:3000",
  options: Partial<ProxyConfig> = {},
): Record<string, ProxyConfig> {
  // 动态导入API前缀，避免在Vite配置加载时访问环境变量
  const apiPrefix = "/api"; // 使用固定值，保持与getApiPrefix()一致

  const defaultConfig: ProxyConfig = {
    target,
    changeOrigin: true,
    secure: false,
    timeout: 10000,
    configure: (proxy, options) => {
      // 代理事件监听，用于调试
      proxy.on("error", (err: Error, req: any, res: any) => {
        console.error("🚨 代理错误:", {
          url: req.url,
          method: req.method,
          error: err.message,
        });
      });

      proxy.on("proxyReq", (proxyReq: any, req: any, res: any) => {
        console.log("🔄 代理请求:", {
          from: req.url,
          to: `${options.target}${req.url}`,
          method: req.method,
        });
      });

      proxy.on("proxyRes", (proxyRes: any, req: any, res: any) => {
        console.log("✅ 代理响应:", {
          url: req.url,
          status: proxyRes.statusCode,
          statusMessage: proxyRes.statusMessage,
        });
      });
    },
    ...options,
  };

  return {
    [apiPrefix]: defaultConfig,
  };
}

/**
 * 开发环境代理配置
 */
export function createDevProxyConfig(): Record<string, ProxyConfig> {
  return createProxyConfig("http://localhost:3000");
}

/**
 * 阿里云环境代理配置
 */
export function createAliyunProxyConfig(): Record<string, ProxyConfig> {
  return createProxyConfig("http://localhost:3000");
}

/**
 * 生产环境代理配置
 */
export function createProdProxyConfig(): Record<string, ProxyConfig> {
  return createProxyConfig("http://localhost:3000");
}

/**
 * 根据环境模式创建代理配置
 *
 * @param mode 环境模式 (development, aliyun, production)
 * @returns 对应环境的代理配置
 */
export function createProxyByMode(mode: string): Record<string, ProxyConfig> {
  switch (mode) {
    case "development":
      return createDevProxyConfig();
    case "aliyun":
      return createAliyunProxyConfig();
    case "production":
      return createProdProxyConfig();
    default:
      console.warn(`⚠️ 未知环境模式: ${mode}，使用开发环境配置`);
      return createDevProxyConfig();
  }
}

/**
 * 验证代理配置
 *
 * @param config 代理配置对象
 * @returns 验证结果
 */
export function validateProxyConfig(config: Record<string, ProxyConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const apiPrefix = "/api"; // 使用固定值

  // 检查是否包含API前缀配置
  if (!config[apiPrefix]) {
    errors.push(`缺少 ${apiPrefix} 代理配置`);
  }

  // 检查target是否有效
  Object.entries(config).forEach(([path, proxyConfig]) => {
    if (!proxyConfig.target) {
      errors.push(`${path} 代理配置缺少 target`);
    }

    if (!proxyConfig.target.startsWith("http")) {
      errors.push(`${path} 代理配置的 target 必须是完整的HTTP URL`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 打印代理配置信息
 *
 * @param config 代理配置对象
 * @param mode 环境模式
 */
export function logProxyConfig(
  config: Record<string, ProxyConfig>,
  mode: string,
): void {
  console.log(`\n🔧 ${mode.toUpperCase()} 环境代理配置:`);

  Object.entries(config).forEach(([path, proxyConfig]) => {
    console.log(`  ${path} -> ${proxyConfig.target}`);
  });

  const validation = validateProxyConfig(config);
  if (!validation.isValid) {
    console.error("❌ 代理配置验证失败:");
    validation.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
  } else {
    console.log("✅ 代理配置验证通过");
  }
}
