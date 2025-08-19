#!/usr/bin/env node
// validate-persistence.js - Pinia 状态持久化验证脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PiniaPersistenceValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.storesPath = path.join(this.projectRoot, 'src/stores');
    this.results = {
      stores: [],
      summary: {
        total: 0,
        optimized: 0,
        needsOptimization: 0,
        errors: []
      }
    };
  }

  // 分析 store 文件的持久化配置
  analyzeStoreFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.ts');

      const analysis = {
        file: fileName,
        path: filePath,
        hasPersistConfig: false,
        persistType: 'none',
        persistedPaths: [],
        allStatePersisted: false,
        temporaryStates: [],
        recommendations: []
      };

      // 检查是否有持久化配置
      if (content.includes('persist:')) {
        analysis.hasPersistConfig = true;

        // 检查是否是全量持久化
        if (content.includes('persist: true')) {
          analysis.persistType = 'full';
          analysis.allStatePersisted = true;
          analysis.recommendations.push('建议使用 paths 选项进行精确持久化');
        }
        // 检查是否使用了 paths 配置
        else if (content.includes('paths:')) {
          analysis.persistType = 'selective';

          // 提取 paths 数组内容
          const pathsMatch = content.match(/paths:\s*\[([^\]]+)\]/s);
          if (pathsMatch) {
            const pathsContent = pathsMatch[1];
            analysis.persistedPaths = pathsContent
              .split(',')
              .map(p => p.trim().replace(/['"]/g, ''))
              .filter(p => p);
          }
        }
      }

      // 识别可能的临时状态
      const tempStatePatterns = [
        'loading',
        'initInProgress',
        'pending',
        'submitting',
        'fetching',
        'error',
        'errors'
      ];

      tempStatePatterns.forEach(pattern => {
        if (content.includes(`${pattern}:`)) {
          analysis.temporaryStates.push(pattern);
        }
      });

      // 生成建议
      if (!analysis.hasPersistConfig && fileName === 'user') {
        analysis.recommendations.push('用户 store 应该持久化 token 和 userInfo');
      }

      if (analysis.allStatePersisted && analysis.temporaryStates.length > 0) {
        analysis.recommendations.push(
          `检测到临时状态 [${analysis.temporaryStates.join(', ')}]，建议排除持久化`
        );
      }

      return analysis;
    } catch (error) {
      this.results.summary.errors.push(`分析文件 ${filePath} 时出错: ${error.message}`);
      return null;
    }
  }

  // 验证所有 store 文件
  validateAllStores() {
    console.log('🔍 开始验证 Pinia 状态持久化配置...\n');

    try {
      const files = fs.readdirSync(this.storesPath)
        .filter(file => file.endsWith('.ts') && !file.includes('.backup'));

      this.results.summary.total = files.length;

      files.forEach(file => {
        const filePath = path.join(this.storesPath, file);
        const analysis = this.analyzeStoreFile(filePath);

        if (analysis) {
          this.results.stores.push(analysis);

          if (analysis.persistType === 'selective' ||
            (analysis.persistType === 'none' && analysis.file !== 'user')) {
            this.results.summary.optimized++;
          } else {
            this.results.summary.needsOptimization++;
          }
        }
      });

      this.generateReport();
    } catch (error) {
      console.error('❌ 验证过程中出错:', error.message);
    }
  }

  // 生成详细报告
  generateReport() {
    console.log('📊 Pinia 状态持久化分析报告');
    console.log('=' + '='.repeat(50));
    console.log();

    // 总览
    console.log('📈 总览统计:');
    console.log(`   总 Store 数量: ${this.results.summary.total}`);
    console.log(`   已优化配置: ${this.results.summary.optimized}`);
    console.log(`   需要优化: ${this.results.summary.needsOptimization}`);
    console.log();

    // 详细分析
    console.log('📋 详细分析:');
    this.results.stores.forEach(store => {
      console.log(`\n🏪 ${store.file}.ts:`);
      console.log(`   持久化类型: ${this.getPersistTypeLabel(store.persistType)}`);

      if (store.persistedPaths.length > 0) {
        console.log(`   持久化字段: [${store.persistedPaths.join(', ')}]`);
      }

      if (store.temporaryStates.length > 0) {
        console.log(`   检测到临时状态: [${store.temporaryStates.join(', ')}]`);
      }

      if (store.recommendations.length > 0) {
        console.log('   📝 建议:');
        store.recommendations.forEach(rec => {
          console.log(`      • ${rec}`);
        });
      }

      console.log(`   状态: ${this.getStoreStatus(store)}`);
    });

    // 错误信息
    if (this.results.summary.errors.length > 0) {
      console.log('\n⚠️  错误信息:');
      this.results.summary.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    // 优化建议
    console.log('\n💡 总体建议:');
    this.generateOverallRecommendations();

    console.log('\n✅ 分析完成!');
  }

  getPersistTypeLabel(type) {
    const labels = {
      'none': '❌ 无持久化',
      'full': '⚠️ 全量持久化',
      'selective': '✅ 精确持久化'
    };
    return labels[type] || '❓ 未知';
  }

  getStoreStatus(store) {
    if (store.persistType === 'selective') {
      return '✅ 已优化';
    } else if (store.persistType === 'full' && store.temporaryStates.length > 0) {
      return '⚠️ 需要优化';
    } else if (store.file === 'user' && store.persistType === 'none') {
      return '⚠️ 需要添加持久化';
    }
    return '🔍 待评估';
  }

  generateOverallRecommendations() {
    const recommendations = [];

    // 检查是否有全量持久化的 store
    const fullPersistStores = this.results.stores.filter(s => s.persistType === 'full');
    if (fullPersistStores.length > 0) {
      recommendations.push(
        `将 [${fullPersistStores.map(s => s.file).join(', ')}] 改为精确持久化以避免存储临时状态`
      );
    }

    // 检查用户 store
    const userStore = this.results.stores.find(s => s.file === 'user');
    if (userStore && userStore.persistType === 'none') {
      recommendations.push('为 user store 添加持久化配置以保持登录状态');
    }

    // 检查其他可能需要持久化的 store
    const noPersistStores = this.results.stores.filter(
      s => s.persistType === 'none' && s.file !== 'user'
    );
    if (noPersistStores.length > 0) {
      recommendations.push(
        `评估 [${noPersistStores.map(s => s.file).join(', ')}] 是否需要持久化用户偏好设置`
      );
    }

    if (recommendations.length === 0) {
      console.log('   🎉 当前配置已经很好！所有 store 的持久化配置都比较合理。');
    } else {
      recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
  }

  // 生成 JSON 报告文件
  generateJsonReport() {
    const reportPath = path.join(this.projectRoot, 'pinia-persistence-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      stores: this.results.stores,
      recommendations: this.generateRecommendationsList()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }

  generateRecommendationsList() {
    const recommendations = [];

    this.results.stores.forEach(store => {
      if (store.recommendations.length > 0) {
        recommendations.push({
          store: store.file,
          recommendations: store.recommendations
        });
      }
    });

    return recommendations;
  }
}

// 主执行函数
function main() {
  const validator = new PiniaPersistenceValidator();

  try {
    validator.validateAllStores();
    validator.generateJsonReport();
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PiniaPersistenceValidator };
