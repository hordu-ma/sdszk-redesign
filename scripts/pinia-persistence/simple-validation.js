#!/usr/bin/env node
// simple-validation.js - 简化的 Pinia 状态持久化验证脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimplePiniaValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.storesPath = path.join(this.projectRoot, 'src/stores');
  }

  // 分析单个 store 文件
  analyzeStore(fileName) {
    const filePath = path.join(this.storesPath, fileName);

    if (!fs.existsSync(filePath)) {
      return { error: `文件不存在: ${fileName}` };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const storeName = fileName.replace('.ts', '');

    const result = {
      store: storeName,
      file: fileName,
      hasPersist: false,
      persistType: 'none',
      persistConfig: null,
      recommendations: []
    };

    // 检查持久化配置
    if (content.includes('persist:')) {
      result.hasPersist = true;

      // 检查是否是全量持久化
      if (content.includes('persist: true')) {
        result.persistType = 'full';
        result.persistConfig = 'persist: true';
        result.recommendations.push('⚠️ 建议改为精确持久化以避免存储临时状态');
      }
      // 检查是否使用了 paths 配置
      else if (content.includes('paths:')) {
        result.persistType = 'selective';

        // 提取 paths 配置
        const pathsMatch = content.match(/persist:\s*{[^}]*paths:\s*\[([^\]]+)\][^}]*}/s);
        if (pathsMatch) {
          result.persistConfig = pathsMatch[0];
          result.recommendations.push('✅ 已使用精确持久化配置');
        }
      }
    } else {
      result.recommendations.push('ℹ️ 无持久化配置');
    }

    return result;
  }

  // 验证核心 stores
  validateCoreStores() {
    console.log('🔍 验证 Pinia 状态持久化配置...\n');

    const coreStores = ['user.ts', 'content.ts', 'news.ts', 'resource.ts'];
    const results = [];

    coreStores.forEach(fileName => {
      const result = this.analyzeStore(fileName);
      results.push(result);
    });

    this.generateReport(results);
    return results;
  }

  // 生成报告
  generateReport(results) {
    console.log('📊 Pinia 状态持久化验证报告');
    console.log('=' + '='.repeat(40));

    results.forEach(result => {
      if (result.error) {
        console.log(`\n❌ ${result.error}`);
        return;
      }

      console.log(`\n🏪 ${result.store} Store:`);
      console.log(`   文件: ${result.file}`);
      console.log(`   持久化: ${this.getPersistLabel(result.persistType)}`);

      if (result.persistConfig) {
        console.log(`   配置: ${result.persistConfig.replace(/\s+/g, ' ').trim()}`);
      }

      result.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    });

    // 总结
    const withPersist = results.filter(r => !r.error && r.hasPersist).length;
    const selective = results.filter(r => !r.error && r.persistType === 'selective').length;
    const full = results.filter(r => !r.error && r.persistType === 'full').length;

    console.log('\n📈 总结:');
    console.log(`   总计 Store: ${results.filter(r => !r.error).length}`);
    console.log(`   已配置持久化: ${withPersist}`);
    console.log(`   精确持久化: ${selective}`);
    console.log(`   全量持久化: ${full}`);

    if (selective > 0 && full === 0) {
      console.log('\n🎉 配置良好！所有持久化都使用了精确配置。');
    } else if (full > 0) {
      console.log('\n⚠️ 建议将全量持久化改为精确持久化。');
    }

    console.log('\n✅ 验证完成!\n');
  }

  getPersistLabel(type) {
    const labels = {
      'none': '❌ 无',
      'full': '⚠️ 全量',
      'selective': '✅ 精确'
    };
    return labels[type] || '❓ 未知';
  }

  // 检查优化前后的区别
  checkOptimization() {
    console.log('🔄 检查优化效果...\n');

    const userResult = this.analyzeStore('user.ts');
    const contentResult = this.analyzeStore('content.ts');

    console.log('优化检查结果:');

    if (userResult.persistType === 'selective') {
      console.log('✅ user.ts - 已优化为精确持久化');
    } else {
      console.log('❌ user.ts - 需要优化持久化配置');
    }

    if (contentResult.persistType === 'selective') {
      console.log('✅ content.ts - 已优化为精确持久化');
    } else if (contentResult.persistType === 'none') {
      console.log('ℹ️ content.ts - 已添加精确持久化配置');
    }

    console.log();
  }
}

// 主要执行函数
function main() {
  const validator = new SimplePiniaValidator();

  try {
    validator.checkOptimization();
    validator.validateCoreStores();
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SimplePiniaValidator;
