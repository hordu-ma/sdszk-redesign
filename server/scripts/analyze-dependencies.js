#!/usr/bin/env node
/**
 * 依赖分析和清理脚本
 * 检测冗余依赖、未使用依赖和潜在安全问题
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 分析结果类
 */
class DependencyAnalysisResult {
  constructor() {
    this.redundantDependencies = [];
    this.unusedDependencies = [];
    this.securityIssues = [];
    this.sizeSavings = 0;
    this.recommendations = [];
  }

  addRedundant(dependency, alternatives, reason) {
    this.redundantDependencies.push({
      dependency,
      alternatives,
      reason,
      severity: "medium",
    });
  }

  addUnused(dependency, reason) {
    this.unusedDependencies.push({
      dependency,
      reason,
      severity: "low",
    });
  }

  addSecurity(dependency, issue, recommendation) {
    this.securityIssues.push({
      dependency,
      issue,
      recommendation,
      severity: "high",
    });
  }

  addRecommendation(type, message, action) {
    this.recommendations.push({
      type,
      message,
      action,
      priority: type === "security" ? "high" : "medium",
    });
  }
}

/**
 * 依赖分析器
 */
class DependencyAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.packageJsonPath = path.join(projectRoot, "package.json");
    this.sourceDir = projectRoot;
    this.packageJson = null;
    this.result = new DependencyAnalysisResult();
  }

  /**
   * 读取 package.json
   */
  async loadPackageJson() {
    try {
      const content = await fs.readFile(this.packageJsonPath, "utf-8");
      this.packageJson = JSON.parse(content);
      return this.packageJson;
    } catch (error) {
      throw new Error(`无法读取 package.json: ${error.message}`);
    }
  }

  /**
   * 扫描源代码中的导入语句
   */
  async scanImports() {
    const imports = new Set();

    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // 跳过 node_modules 和其他不需要扫描的目录
          if (
            !["node_modules", ".git", "dist", "build", "coverage"].includes(
              entry.name,
            )
          ) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile() && /\.(js|ts|mjs|cjs)$/.test(entry.name)) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");

            // 匹配 import 和 require 语句
            const importRegex =
              /(?:import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\s*\))/g;
            let match;

            while ((match = importRegex.exec(content)) !== null) {
              const moduleName = match[1] || match[2];
              if (
                moduleName &&
                !moduleName.startsWith(".") &&
                !moduleName.startsWith("/")
              ) {
                // 提取包名（处理 scoped packages）
                const packageName = moduleName.startsWith("@")
                  ? moduleName.split("/").slice(0, 2).join("/")
                  : moduleName.split("/")[0];
                imports.add(packageName);
              }
            }
          } catch (error) {
            console.warn(`警告: 无法读取文件 ${fullPath}: ${error.message}`);
          }
        }
      }
    }

    await scanDirectory(this.sourceDir);
    return imports;
  }

  /**
   * 检查冗余依赖
   */
  analyzeRedundantDependencies() {
    const dependencies = this.packageJson.dependencies || {};

    // 已知的冗余依赖组合
    const redundantGroups = [
      {
        packages: ["bcrypt", "bcryptjs"],
        recommendation: "bcrypt",
        reason: "bcrypt 性能更好但需要编译，bcryptjs 是纯 JS 实现兼容性好",
        details: {
          bcrypt: {
            pros: ["更好的性能", "原生 C++ 实现", "更安全"],
            cons: ["需要编译环境", "部署复杂度高", "某些环境可能不兼容"],
          },
          bcryptjs: {
            pros: ["纯 JS 实现", "无编译依赖", "兼容性好", "部署简单"],
            cons: ["性能较慢", "计算密集型操作效率低"],
          },
        },
      },
      {
        packages: ["lodash", "ramda"],
        recommendation: "lodash",
        reason: "功能重叠的工具库，建议选择一个",
      },
      {
        packages: ["moment", "dayjs", "date-fns"],
        recommendation: "dayjs",
        reason: "dayjs 体积更小，API 兼容 moment，性能更好",
      },
      {
        packages: ["axios", "node-fetch", "fetch"],
        recommendation: "axios",
        reason: "axios 功能更全面，支持拦截器和并发控制",
      },
      {
        packages: ["express", "koa", "fastify"],
        recommendation: "express",
        reason: "建议在一个项目中只使用一个 Web 框架",
      },
    ];

    redundantGroups.forEach((group) => {
      const foundPackages = group.packages.filter((pkg) => dependencies[pkg]);
      if (foundPackages.length > 1) {
        this.result.addRedundant(
          foundPackages.join(", "),
          foundPackages.filter((pkg) => pkg !== group.recommendation),
          group.reason,
        );

        // 添加具体建议
        if (group.details) {
          foundPackages.forEach((pkg) => {
            if (group.details[pkg]) {
              this.result.addRecommendation(
                "redundancy",
                `${pkg} - 优点: ${group.details[pkg].pros.join(", ")}; 缺点: ${group.details[pkg].cons.join(", ")}`,
                `考虑是否保留 ${pkg}`,
              );
            }
          });
        }
      }
    });
  }

  /**
   * 检查未使用的依赖
   */
  async analyzeUnusedDependencies() {
    const usedImports = await this.scanImports();
    const dependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
    };

    // 系统和构建工具相关的包，即使未直接导入也可能被使用
    const systemPackages = new Set([
      "nodemon",
      "pm2",
      "forever",
      "vitest",
      "jest",
      "mocha",
      "chai",
      "eslint",
      "prettier",
      "husky",
      "typescript",
      "@types/node",
      "webpack",
      "vite",
      "rollup",
      "babel-core",
      "@babel/core",
      "postcss",
      "tailwindcss",
      "concurrently",
      "cross-env",
    ]);

    for (const [packageName, version] of Object.entries(dependencies)) {
      if (!usedImports.has(packageName) && !systemPackages.has(packageName)) {
        // 检查是否是常见的间接依赖
        const isIndirectDep = await this.checkIndirectUsage(packageName);
        if (!isIndirectDep) {
          this.result.addUnused(
            packageName,
            `在源代码中未找到导入语句，版本: ${version}`,
          );
        }
      }
    }
  }

  /**
   * 检查间接使用情况
   */
  async checkIndirectUsage(packageName) {
    // 检查是否在配置文件中被使用
    const configFiles = [
      "vite.config.js",
      "vite.config.ts",
      "webpack.config.js",
      "rollup.config.js",
      "jest.config.js",
      "vitest.config.js",
      ".eslintrc.js",
      ".eslintrc.json",
      "tailwind.config.js",
      "postcss.config.js",
    ];

    for (const configFile of configFiles) {
      try {
        const configPath = path.join(this.projectRoot, configFile);
        const content = await fs.readFile(configPath, "utf-8");
        if (content.includes(packageName)) {
          return true;
        }
      } catch (error) {
        // 文件不存在，继续检查下一个
      }
    }

    return false;
  }

  /**
   * 分析包大小
   */
  async analyzePackageSizes() {
    try {
      // 尝试使用 npm ls 获取依赖树信息
      const { stdout } = await execAsync("npm ls --depth=0 --json", {
        cwd: this.projectRoot,
        timeout: 10000,
      });

      const lsResult = JSON.parse(stdout);
      const dependencies = lsResult.dependencies || {};

      // 估算包大小（简化实现）
      const sizesInfo = {};
      for (const [name, info] of Object.entries(dependencies)) {
        sizesInfo[name] = {
          version: info.version,
          // 这里可以集成 bundlephobia API 获取真实大小
          estimatedSize: "unknown",
        };
      }

      return sizesInfo;
    } catch (error) {
      console.warn("无法获取包大小信息:", error.message);
      return {};
    }
  }

  /**
   * 检查安全漏洞
   */
  async checkSecurityIssues() {
    try {
      const { stdout } = await execAsync("npm audit --json", {
        cwd: this.projectRoot,
        timeout: 15000,
      });

      const auditResult = JSON.parse(stdout);

      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(
          ([packageName, vuln]) => {
            this.result.addSecurity(
              packageName,
              `${vuln.severity} 级别漏洞: ${vuln.title || "未知"}`,
              vuln.fixAvailable ? "运行 npm audit fix" : "手动更新到安全版本",
            );
          },
        );
      }
    } catch (error) {
      // npm audit 可能因为漏洞而返回非零退出码，这是正常的
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout);
          if (auditResult.vulnerabilities) {
            Object.entries(auditResult.vulnerabilities).forEach(
              ([packageName, vuln]) => {
                this.result.addSecurity(
                  packageName,
                  `${vuln.severity} 级别漏洞: ${vuln.title || "未知"}`,
                  vuln.fixAvailable
                    ? "运行 npm audit fix"
                    : "手动更新到安全版本",
                );
              },
            );
          }
        } catch (parseError) {
          console.warn("无法解析安全审计结果:", parseError.message);
        }
      }
    }
  }

  /**
   * 执行完整分析
   */
  async analyze() {
    console.log("🔍 开始依赖分析...");

    // 1. 加载 package.json
    await this.loadPackageJson();
    console.log("✅ 已加载 package.json");

    // 2. 检查冗余依赖
    this.analyzeRedundantDependencies();
    console.log("✅ 已分析冗余依赖");

    // 3. 检查未使用依赖
    await this.analyzeUnusedDependencies();
    console.log("✅ 已分析未使用依赖");

    // 4. 检查安全问题
    await this.checkSecurityIssues();
    console.log("✅ 已检查安全问题");

    // 5. 分析包大小
    const sizes = await this.analyzePackageSizes();
    console.log("✅ 已分析包大小");

    return this.result;
  }

  /**
   * 生成清理建议
   */
  generateCleanupPlan() {
    const plan = {
      immediate: [], // 立即可执行的操作
      review: [], // 需要审查的操作
      monitor: [], // 需要监控的项目
    };

    // 处理冗余依赖
    this.result.redundantDependencies.forEach((item) => {
      plan.review.push({
        type: "remove_redundant",
        description: `移除冗余依赖: ${item.alternatives.join(", ")}`,
        reason: item.reason,
        command: `npm uninstall ${item.alternatives.join(" ")}`,
        risk: "medium",
      });
    });

    // 处理未使用依赖
    this.result.unusedDependencies.forEach((item) => {
      plan.review.push({
        type: "remove_unused",
        description: `移除未使用依赖: ${item.dependency}`,
        reason: item.reason,
        command: `npm uninstall ${item.dependency}`,
        risk: "low",
      });
    });

    // 处理安全问题
    this.result.securityIssues.forEach((item) => {
      plan.immediate.push({
        type: "fix_security",
        description: `修复安全漏洞: ${item.dependency}`,
        issue: item.issue,
        command: item.recommendation,
        risk: "high",
      });
    });

    return plan;
  }
}

/**
 * 报告生成器
 */
class ReportGenerator {
  static generateConsoleReport(result, cleanupPlan) {
    console.log("\n📊 依赖分析报告");
    console.log("=".repeat(50));

    // 总览
    const totalIssues =
      result.redundantDependencies.length +
      result.unusedDependencies.length +
      result.securityIssues.length;

    console.log(`\n📈 总览:`);
    console.log(`  • 发现问题: ${totalIssues} 个`);
    console.log(`  • 冗余依赖: ${result.redundantDependencies.length} 个`);
    console.log(`  • 未使用依赖: ${result.unusedDependencies.length} 个`);
    console.log(`  • 安全问题: ${result.securityIssues.length} 个`);

    // 冗余依赖详情
    if (result.redundantDependencies.length > 0) {
      console.log("\n⚠️  冗余依赖:");
      result.redundantDependencies.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.dependency}`);
        console.log(`     原因: ${item.reason}`);
        console.log(`     建议移除: ${item.alternatives.join(", ")}`);
      });
    }

    // 未使用依赖详情
    if (result.unusedDependencies.length > 0) {
      console.log("\n📦 未使用依赖:");
      result.unusedDependencies.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.dependency}`);
        console.log(`     ${item.reason}`);
      });
    }

    // 安全问题详情
    if (result.securityIssues.length > 0) {
      console.log("\n🚨 安全问题:");
      result.securityIssues.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.dependency}`);
        console.log(`     问题: ${item.issue}`);
        console.log(`     建议: ${item.recommendation}`);
      });
    }

    // 清理计划
    console.log("\n🔧 清理计划:");

    if (cleanupPlan.immediate.length > 0) {
      console.log("\n  🚨 立即执行:");
      cleanupPlan.immediate.forEach((action, index) => {
        console.log(`    ${index + 1}. ${action.description}`);
        console.log(`       命令: ${action.command}`);
      });
    }

    if (cleanupPlan.review.length > 0) {
      console.log("\n  📋 需要审查:");
      cleanupPlan.review.forEach((action, index) => {
        console.log(`    ${index + 1}. ${action.description}`);
        console.log(`       命令: ${action.command}`);
        console.log(`       风险: ${action.risk}`);
      });
    }

    // 建议
    if (result.recommendations.length > 0) {
      console.log("\n💡 其他建议:");
      result.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.type}] ${rec.message}`);
        if (rec.action) {
          console.log(`     操作: ${rec.action}`);
        }
      });
    }
  }

  static async generateMarkdownReport(result, cleanupPlan, outputPath) {
    const timestamp = new Date().toISOString();

    let markdown = `# 依赖分析清理报告

**生成时间**: ${timestamp}

## 📊 分析概览

| 类型 | 数量 |
|------|------|
| 冗余依赖 | ${result.redundantDependencies.length} |
| 未使用依赖 | ${result.unusedDependencies.length} |
| 安全问题 | ${result.securityIssues.length} |

`;

    // 冗余依赖
    if (result.redundantDependencies.length > 0) {
      markdown += `## ⚠️ 冗余依赖

`;
      result.redundantDependencies.forEach((item, index) => {
        markdown += `### ${index + 1}. ${item.dependency}

**原因**: ${item.reason}

**建议移除**: ${item.alternatives.join(", ")}

**清理命令**:
\`\`\`bash
npm uninstall ${item.alternatives.join(" ")}
\`\`\`

`;
      });
    }

    // 未使用依赖
    if (result.unusedDependencies.length > 0) {
      markdown += `## 📦 未使用依赖

`;
      result.unusedDependencies.forEach((item, index) => {
        markdown += `### ${index + 1}. ${item.dependency}

**状态**: ${item.reason}

**清理命令**:
\`\`\`bash
npm uninstall ${item.dependency}
\`\`\`

`;
      });
    }

    // 安全问题
    if (result.securityIssues.length > 0) {
      markdown += `## 🚨 安全问题

`;
      result.securityIssues.forEach((item, index) => {
        markdown += `### ${index + 1}. ${item.dependency}

**问题**: ${item.issue}

**建议**: ${item.recommendation}

`;
      });
    }

    // 清理计划
    markdown += `## 🔧 自动化清理脚本

### 立即执行的安全修复

\`\`\`bash
${cleanupPlan.immediate.map((action) => action.command).join("\n")}
\`\`\`

### 需要审查的清理操作

\`\`\`bash
# 请仔细审查以下命令后再执行
${cleanupPlan.review.map((action) => `# ${action.description}\n${action.command}`).join("\n\n")}
\`\`\`

## 📋 建议步骤

1. **立即修复安全漏洞** - 运行上面的安全修复命令
2. **审查冗余依赖** - 确认哪个包更适合项目需求
3. **测试应用** - 在移除依赖前进行充分测试
4. **更新文档** - 记录依赖变更的原因

`;

    await fs.writeFile(outputPath, markdown, "utf-8");
    console.log(`📄 报告已生成: ${outputPath}`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const projectRoot = process.cwd();

  console.log(`🎯 分析项目: ${projectRoot}`);

  try {
    const analyzer = new DependencyAnalyzer(projectRoot);
    const result = await analyzer.analyze();
    const cleanupPlan = analyzer.generateCleanupPlan();

    // 生成控制台报告
    ReportGenerator.generateConsoleReport(result, cleanupPlan);

    // 生成 Markdown 报告
    if (args.includes("--report") || args.includes("-r")) {
      const reportPath = path.join(projectRoot, "依赖清理报告.md");
      await ReportGenerator.generateMarkdownReport(
        result,
        cleanupPlan,
        reportPath,
      );
    }

    // 返回适当的退出码
    const hasHighSeverityIssues = result.securityIssues.length > 0;
    process.exit(hasHighSeverityIssues ? 1 : 0);
  } catch (error) {
    console.error("❌ 分析失败:", error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DependencyAnalyzer, ReportGenerator };
