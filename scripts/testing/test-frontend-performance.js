#!/usr/bin/env node
// test-frontend-performance.js - 前端性能测试脚本
// 用于验证前端性能优化效果

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FrontendPerformanceTester {
  constructor() {
    this.testResults = {
      buildAnalysis: {},
      bundleAnalysis: {},
      routeAnalysis: {},
      optimizationChecks: {},
    };
  }

  /**
   * 分析构建产物
   */
  async analyzeBuildOutput() {
    console.log("📊 分析构建产物...");

    const distPath = path.join(__dirname, "../dist");

    try {
      // 检查dist目录是否存在
      await fs.access(distPath);

      // 分析JavaScript文件
      const jsFiles = await this.getFilesByExtension(distPath, ".js");
      const cssFiles = await this.getFilesByExtension(distPath, ".css");
      const imageFiles = await this.getImageFiles(distPath);

      this.testResults.buildAnalysis = {
        jsFiles: jsFiles.length,
        cssFiles: cssFiles.length,
        imageFiles: imageFiles.length,
        totalJSSize: await this.calculateTotalSize(jsFiles),
        totalCSSSize: await this.calculateTotalSize(cssFiles),
        totalImageSize: await this.calculateTotalSize(imageFiles),
        largestJSFile: this.findLargestFile(jsFiles),
        largestCSSFile: this.findLargestFile(cssFiles),
      };

      console.log("  ✅ 构建产物分析完成");
    } catch (error) {
      console.error("  ❌ 构建产物分析失败:", error.message);
      this.testResults.buildAnalysis.error = error.message;
    }
  }

  /**
   * 分析bundle结构
   */
  async analyzeBundleStructure() {
    console.log("📦 分析bundle结构...");

    const distPath = path.join(__dirname, "../dist");

    try {
      const jsFiles = await this.getFilesByExtension(distPath, ".js");

      // 分析不同类型的bundle
      const bundleTypes = {
        vendor: jsFiles.filter((f) => f.name.includes("vendor")),
        index: jsFiles.filter((f) => f.name.includes("index")),
        components: jsFiles.filter(
          (f) => !f.name.includes("vendor") && !f.name.includes("index"),
        ),
      };

      this.testResults.bundleAnalysis = {
        vendorBundles: bundleTypes.vendor.length,
        indexBundles: bundleTypes.index.length,
        componentBundles: bundleTypes.components.length,
        vendorSize: await this.calculateTotalSize(bundleTypes.vendor),
        indexSize: await this.calculateTotalSize(bundleTypes.index),
        componentSize: await this.calculateTotalSize(bundleTypes.components),
        hasCodeSplitting: bundleTypes.components.length > 0,
      };

      console.log("  ✅ Bundle结构分析完成");
    } catch (error) {
      console.error("  ❌ Bundle结构分析失败:", error.message);
      this.testResults.bundleAnalysis.error = error.message;
    }
  }

  /**
   * 分析路由配置
   */
  async analyzeRouteConfiguration() {
    console.log("🛣️ 分析路由配置...");

    try {
      const routerPath = path.join(__dirname, "../src/router/index.ts");
      const routerContent = await fs.readFile(routerPath, "utf-8");

      // 检查同步导入的组件
      const syncImports = (
        routerContent.match(/^import\s+\w+\s+from\s+["']\.\.\/views/gm) || []
      ).length;

      // 检查懒加载的组件
      const lazyImports = (
        routerContent.match(/component:\s*\(\)\s*=>\s*import\(/g) || []
      ).length;

      // 检查预加载配置
      const hasPreloading = routerContent.includes("preloadComponents");

      // 检查性能监控集成
      const hasPerformanceMonitoring =
        routerContent.includes("startRouteTimer");

      this.testResults.routeAnalysis = {
        syncImports,
        lazyImports,
        hasPreloading,
        hasPerformanceMonitoring,
        totalRoutes: syncImports + lazyImports,
        syncRatio:
          ((syncImports / (syncImports + lazyImports)) * 100).toFixed(1) + "%",
      };

      console.log("  ✅ 路由配置分析完成");
    } catch (error) {
      console.error("  ❌ 路由配置分析失败:", error.message);
      this.testResults.routeAnalysis.error = error.message;
    }
  }

  /**
   * 检查优化配置
   */
  async checkOptimizations() {
    console.log("⚡ 检查优化配置...");

    try {
      // 检查Vite配置
      const viteConfigPath = path.join(__dirname, "../vite.config.aliyun.ts");
      const viteConfig = await fs.readFile(viteConfigPath, "utf-8");

      const optimizations = {
        hasGzipCompression:
          viteConfig.includes("viteCompression") && viteConfig.includes("gzip"),
        hasBrotliCompression: viteConfig.includes("brotliCompress"),
        hasImageOptimization: viteConfig.includes("viteImagemin"),
        hasCodeSplitting: viteConfig.includes("manualChunks"),
        hasTerserMinification: viteConfig.includes("terser"),
        hasTreeShaking: viteConfig.includes("drop_console"),
      };

      // 检查性能监控工具
      const performanceUtilsPath = path.join(
        __dirname,
        "../src/utils/performance.ts",
      );
      const hasPerformanceUtils = await fs
        .access(performanceUtilsPath)
        .then(() => true)
        .catch(() => false);

      this.testResults.optimizationChecks = {
        ...optimizations,
        hasPerformanceUtils,
        optimizationScore: Object.values(optimizations).filter(Boolean).length,
      };

      console.log("  ✅ 优化配置检查完成");
    } catch (error) {
      console.error("  ❌ 优化配置检查失败:", error.message);
      this.testResults.optimizationChecks.error = error.message;
    }
  }

  /**
   * 获取指定扩展名的文件
   */
  async getFilesByExtension(dir, ext) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getFilesByExtension(fullPath, ext);
          files.push(...subFiles);
        } else if (entry.name.endsWith(ext)) {
          const stat = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            size: stat.size,
          });
        }
      }
    } catch (error) {
      // 目录不存在或无法访问
    }

    return files;
  }

  /**
   * 获取图片文件
   */
  async getImageFiles(dir) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];
    let imageFiles = [];

    for (const ext of imageExtensions) {
      const files = await this.getFilesByExtension(dir, ext);
      imageFiles.push(...files);
    }

    return imageFiles;
  }

  /**
   * 计算文件总大小
   */
  async calculateTotalSize(files) {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * 找到最大的文件
   */
  findLargestFile(files) {
    if (files.length === 0) return null;

    return files.reduce((largest, file) =>
      file.size > largest.size ? file : largest,
    );
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const { buildAnalysis, bundleAnalysis, routeAnalysis, optimizationChecks } =
      this.testResults;

    let report = "=== 前端性能测试报告 ===\n\n";

    // 构建产物分析
    report += "📊 构建产物分析:\n";
    if (buildAnalysis.error) {
      report += `  ❌ 错误: ${buildAnalysis.error}\n`;
    } else {
      report += `  📄 JavaScript文件: ${buildAnalysis.jsFiles} 个\n`;
      report += `  🎨 CSS文件: ${buildAnalysis.cssFiles} 个\n`;
      report += `  🖼️ 图片文件: ${buildAnalysis.imageFiles} 个\n`;
      report += `  📦 JS总大小: ${this.formatSize(buildAnalysis.totalJSSize)}\n`;
      report += `  🎨 CSS总大小: ${this.formatSize(buildAnalysis.totalCSSSize)}\n`;
      report += `  🖼️ 图片总大小: ${this.formatSize(buildAnalysis.totalImageSize)}\n`;

      if (buildAnalysis.largestJSFile) {
        report += `  📦 最大JS文件: ${buildAnalysis.largestJSFile.name} (${this.formatSize(buildAnalysis.largestJSFile.size)})\n`;
      }
    }

    // Bundle分析
    report += "\n📦 Bundle结构分析:\n";
    if (bundleAnalysis.error) {
      report += `  ❌ 错误: ${bundleAnalysis.error}\n`;
    } else {
      report += `  🏗️ Vendor bundles: ${bundleAnalysis.vendorBundles} 个 (${this.formatSize(bundleAnalysis.vendorSize)})\n`;
      report += `  📄 Index bundles: ${bundleAnalysis.indexBundles} 个 (${this.formatSize(bundleAnalysis.indexSize)})\n`;
      report += `  🧩 Component bundles: ${bundleAnalysis.componentBundles} 个 (${this.formatSize(bundleAnalysis.componentSize)})\n`;
      report += `  ✂️ 代码分割: ${bundleAnalysis.hasCodeSplitting ? "✅ 已启用" : "❌ 未启用"}\n`;
    }

    // 路由分析
    report += "\n🛣️ 路由配置分析:\n";
    if (routeAnalysis.error) {
      report += `  ❌ 错误: ${routeAnalysis.error}\n`;
    } else {
      report += `  🚀 同步加载组件: ${routeAnalysis.syncImports} 个\n`;
      report += `  📱 懒加载组件: ${routeAnalysis.lazyImports} 个\n`;
      report += `  📊 同步加载比例: ${routeAnalysis.syncRatio}\n`;
      report += `  ⚡ 预加载配置: ${routeAnalysis.hasPreloading ? "✅ 已配置" : "❌ 未配置"}\n`;
      report += `  📈 性能监控: ${routeAnalysis.hasPerformanceMonitoring ? "✅ 已集成" : "❌ 未集成"}\n`;
    }

    // 优化检查
    report += "\n⚡ 优化配置检查:\n";
    if (optimizationChecks.error) {
      report += `  ❌ 错误: ${optimizationChecks.error}\n`;
    } else {
      report += `  🗜️ Gzip压缩: ${optimizationChecks.hasGzipCompression ? "✅" : "❌"}\n`;
      report += `  🗜️ Brotli压缩: ${optimizationChecks.hasBrotliCompression ? "✅" : "❌"}\n`;
      report += `  🖼️ 图片优化: ${optimizationChecks.hasImageOptimization ? "✅" : "❌"}\n`;
      report += `  ✂️ 代码分割: ${optimizationChecks.hasCodeSplitting ? "✅" : "❌"}\n`;
      report += `  🗃️ 代码压缩: ${optimizationChecks.hasTerserMinification ? "✅" : "❌"}\n`;
      report += `  🌲 Tree Shaking: ${optimizationChecks.hasTreeShaking ? "✅" : "❌"}\n`;
      report += `  📊 性能监控工具: ${optimizationChecks.hasPerformanceUtils ? "✅" : "❌"}\n`;
      report += `  🏆 优化得分: ${optimizationChecks.optimizationScore}/7\n`;
    }

    // 性能建议
    report += "\n💡 性能建议:\n";

    if (
      buildAnalysis.largestJSFile &&
      buildAnalysis.largestJSFile.size > 1024 * 1024
    ) {
      report += `  ⚠️ 最大JS文件超过1MB，建议进一步拆分\n`;
    }

    if (bundleAnalysis.vendorSize > 2 * 1024 * 1024) {
      report += `  ⚠️ Vendor bundle较大，建议拆分第三方库\n`;
    }

    if (routeAnalysis.syncImports === 0) {
      report += `  ⚠️ 建议将核心页面(首页、登录页)改为同步加载\n`;
    } else if (routeAnalysis.syncImports > 5) {
      report += `  ⚠️ 同步加载组件过多，可能影响首屏加载速度\n`;
    }

    if (optimizationChecks.optimizationScore < 5) {
      report += `  ⚠️ 优化配置不完整，建议完善压缩和性能监控配置\n`;
    }

    if (optimizationChecks.optimizationScore >= 6) {
      report += `  🎉 优化配置良好！继续保持\n`;
    }

    return report;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log("🚀 开始前端性能测试...\n");

    await this.analyzeBuildOutput();
    await this.analyzeBundleStructure();
    await this.analyzeRouteConfiguration();
    await this.checkOptimizations();

    console.log("\n📋 生成测试报告...");
    const report = this.generateReport();

    // 输出报告到控制台
    console.log("\n" + report);

    // 保存报告到文件
    const reportPath = path.join(__dirname, "../performance-report.txt");
    await fs.writeFile(reportPath, report, "utf-8");
    console.log(`📁 报告已保存到: ${reportPath}`);

    return this.testResults;
  }
}

// 运行测试
const tester = new FrontendPerformanceTester();
tester.runAllTests().catch(console.error);
