// performance.ts - 前端性能监控工具
// 用于监测前端性能优化效果

interface PerformanceMetrics {
  // 页面加载性能
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;

  // 资源加载性能
  domContentLoaded?: number;
  loadComplete?: number;

  // 路由性能
  routeChangeTime?: number;
  componentLoadTime?: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size?: number;
  type: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observer: PerformanceObserver | null = null;
  private routeStartTime: number = 0;

  constructor() {
    // 只在浏览器环境中初始化
    if (typeof window !== "undefined") {
      this.initPerformanceObserver();
      this.measureBasicMetrics();
    }
  }

  /**
   * 初始化性能观察器
   */
  private initPerformanceObserver() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // 观察不同类型的性能指标
      try {
        this.observer.observe({
          entryTypes: [
            "paint",
            "largest-contentful-paint",
            "first-input",
            "layout-shift",
          ],
        });
      } catch (e) {
        console.warn("Some performance metrics not supported:", e);
      }
    }
  }

  /**
   * 处理性能条目
   */
  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case "paint":
        if (entry.name === "first-contentful-paint") {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
        break;

      case "largest-contentful-paint":
        this.metrics.largestContentfulPaint = entry.startTime;
        break;

      case "first-input": {
        const fidEntry = entry as PerformanceEventTiming;
        this.metrics.firstInputDelay =
          fidEntry.processingStart - fidEntry.startTime;
        break;
      }

      case "layout-shift": {
        const clsEntry = entry as any;
        if (!clsEntry.hadRecentInput) {
          this.metrics.cumulativeLayoutShift =
            (this.metrics.cumulativeLayoutShift || 0) + clsEntry.value;
        }
        break;
      }
    }
  }

  /**
   * 测量基本性能指标
   */
  private measureBasicMetrics() {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      performance.timing
    ) {
      const timing = performance.timing;

      // DOM 内容加载时间
      this.metrics.domContentLoaded =
        timing.domContentLoadedEventEnd - timing.navigationStart;

      // 页面完全加载时间
      this.metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;
    }

    // 监听 load 事件
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        setTimeout(() => {
          this.collectWebVitals();
        }, 0);
      });
    }
  }

  /**
   * 收集 Web Vitals 指标
   */
  private collectWebVitals() {
    // 如果支持 PerformanceObserver，指标已经通过观察器收集
    // 这里处理降级情况或补充数据
    if (
      typeof window !== "undefined" &&
      !this.metrics.firstContentfulPaint &&
      "performance" in window
    ) {
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === "first-contentful-paint",
      );
      if (fcpEntry) {
        this.metrics.firstContentfulPaint = fcpEntry.startTime;
      }
    }
  }

  /**
   * 开始路由变更计时
   */
  startRouteChange() {
    if (typeof window !== "undefined" && "performance" in window) {
      this.routeStartTime = performance.now();
    }
  }

  /**
   * 结束路由变更计时
   */
  endRouteChange() {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      this.routeStartTime > 0
    ) {
      this.metrics.routeChangeTime = performance.now() - this.routeStartTime;
      this.routeStartTime = 0;
    }
  }

  /**
   * 测量组件加载时间
   */
  measureComponentLoad(componentName: string, startTime: number) {
    if (typeof window !== "undefined" && "performance" in window) {
      const loadTime = performance.now() - startTime;
      this.metrics.componentLoadTime = loadTime;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] Component '${componentName}' loaded in ${loadTime.toFixed(2)}ms`,
        );
      }
    }
  }

  /**
   * 获取资源加载性能数据
   */
  getResourceTiming(): ResourceTiming[] {
    if (typeof window === "undefined" || !("performance" in window)) return [];

    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    return resources
      .map((resource) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: this.getResourceType(resource.name),
      }))
      .filter((resource) => resource.duration > 0);
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string): string {
    if (url.includes(".js")) return "script";
    if (url.includes(".css")) return "stylesheet";
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return "image";
    if (url.includes("/api/")) return "api";
    return "other";
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const resources = this.getResourceTiming();

    let report = "=== 性能监控报告 ===\n\n";

    // Web Vitals 指标
    report += "📊 Core Web Vitals:\n";
    if (metrics.firstContentfulPaint) {
      const fcp = metrics.firstContentfulPaint;
      const fcpStatus =
        fcp < 1800 ? "✅ 良好" : fcp < 3000 ? "⚠️ 需要改进" : "❌ 差";
      report += `  FCP (首次内容绘制): ${fcp.toFixed(0)}ms ${fcpStatus}\n`;
    }

    if (metrics.largestContentfulPaint) {
      const lcp = metrics.largestContentfulPaint;
      const lcpStatus =
        lcp < 2500 ? "✅ 良好" : lcp < 4000 ? "⚠️ 需要改进" : "❌ 差";
      report += `  LCP (最大内容绘制): ${lcp.toFixed(0)}ms ${lcpStatus}\n`;
    }

    if (metrics.firstInputDelay) {
      const fid = metrics.firstInputDelay;
      const fidStatus =
        fid < 100 ? "✅ 良好" : fid < 300 ? "⚠️ 需要改进" : "❌ 差";
      report += `  FID (首次输入延迟): ${fid.toFixed(0)}ms ${fidStatus}\n`;
    }

    if (metrics.cumulativeLayoutShift) {
      const cls = metrics.cumulativeLayoutShift;
      const clsStatus =
        cls < 0.1 ? "✅ 良好" : cls < 0.25 ? "⚠️ 需要改进" : "❌ 差";
      report += `  CLS (累积布局偏移): ${cls.toFixed(3)} ${clsStatus}\n`;
    }

    // 页面加载指标
    report += "\n🚀 页面加载性能:\n";
    if (metrics.domContentLoaded) {
      report += `  DOM 内容加载: ${metrics.domContentLoaded.toFixed(0)}ms\n`;
    }
    if (metrics.loadComplete) {
      report += `  页面完全加载: ${metrics.loadComplete.toFixed(0)}ms\n`;
    }
    if (metrics.routeChangeTime) {
      report += `  路由切换时间: ${metrics.routeChangeTime.toFixed(0)}ms\n`;
    }

    // 资源加载分析
    if (resources.length > 0) {
      report += "\n📦 资源加载分析:\n";

      const resourcesByType = resources.reduce(
        (acc, resource) => {
          if (!acc[resource.type]) acc[resource.type] = [];
          acc[resource.type].push(resource);
          return acc;
        },
        {} as Record<string, ResourceTiming[]>,
      );

      Object.entries(resourcesByType).forEach(([type, typeResources]) => {
        const avgDuration =
          typeResources.reduce((sum, r) => sum + r.duration, 0) /
          typeResources.length;
        const totalSize = typeResources.reduce(
          (sum, r) => sum + (r.size || 0),
          0,
        );

        report += `  ${type}: ${typeResources.length} 个文件, `;
        report += `平均加载时间 ${avgDuration.toFixed(0)}ms, `;
        report += `总大小 ${(totalSize / 1024).toFixed(1)}KB\n`;
      });
    }

    return report;
  }

  /**
   * 在控制台输出性能报告
   */
  logReport() {
    if (process.env.NODE_ENV === "development") {
      console.log(this.generateReport());
    }
  }

  /**
   * 上报性能数据到后端 (可选)
   */
  async reportToBackend() {
    const metrics = this.getMetrics();

    // 只在生产环境且有有效数据时上报
    if (
      process.env.NODE_ENV === "production" &&
      Object.keys(metrics).length > 0
    ) {
      try {
        // 这里可以调用实际的上报 API
        // await api.post('/performance/report', metrics);
        console.log("Performance metrics would be reported:", metrics);
      } catch (error) {
        console.warn("Failed to report performance metrics:", error);
      }
    }
  }

  /**
   * 清理性能监控器
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 导出性能监控相关功能
export { PerformanceMonitor };

// 创建全局性能监控实例 - 只在浏览器环境中创建
const performanceMonitor =
  typeof window !== "undefined" ? new PerformanceMonitor() : null;

export { performanceMonitor };

// 便捷方法
export const startRouteTimer = () => performanceMonitor?.startRouteChange();
export const endRouteTimer = () => performanceMonitor?.endRouteChange();
export const measureComponent = (name: string, startTime: number) =>
  performanceMonitor?.measureComponentLoad(name, startTime);
export const getPerformanceReport = () =>
  performanceMonitor?.generateReport() || "";
export const logPerformanceReport = () => performanceMonitor?.logReport();

// 在应用卸载时清理
if (typeof window !== "undefined" && performanceMonitor) {
  window.addEventListener("beforeunload", () => {
    performanceMonitor.destroy();
  });
}
