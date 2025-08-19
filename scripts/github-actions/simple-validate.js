#!/usr/bin/env node
// simple-validate.js - GitHub Actions工作流简化验证脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleWorkflowValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.workflowsPath = path.join(this.projectRoot, '.github/workflows');
  }

  // 简单的YAML解析检查
  checkWorkflowContent(content, fileName) {
    const analysis = {
      file: fileName,
      hasCache: false,
      hasNodeSetup: false,
      hasTimeout: false,
      hasConditions: false,
      nodeVersion: null,
      cacheType: [],
      optimizations: [],
      warnings: [],
      geminiCompliant: false
    };

    // 检查基本结构
    if (!content.includes('name:')) {
      analysis.warnings.push('缺少工作流名称');
    }

    if (!content.includes('on:')) {
      analysis.warnings.push('缺少触发条件');
    }

    // 检查Node.js设置
    if (content.includes('actions/setup-node')) {
      analysis.hasNodeSetup = true;
      analysis.optimizations.push('✅ 使用了actions/setup-node');

      // 提取Node版本
      const nodeVersionMatch = content.match(/node-version:\s*["']?([^"'\n]+)["']?/);
      if (nodeVersionMatch) {
        analysis.nodeVersion = nodeVersionMatch[1];
        if (analysis.nodeVersion !== 'lts/*') {
          analysis.optimizations.push(`✅ 使用固定Node版本: ${analysis.nodeVersion}`);
        }
      }
    }

    // 检查缓存配置
    if (content.includes('actions/cache')) {
      analysis.hasCache = true;
      analysis.optimizations.push('✅ 使用了依赖缓存');

      // 检查缓存类型
      if (content.includes('~/.npm') || content.includes('node_modules')) {
        analysis.cacheType.push('npm');
      }
      if (content.includes('playwright') || content.includes('ms-playwright')) {
        analysis.cacheType.push('playwright');
      }
    }

    // 检查超时设置
    if (content.includes('timeout-minutes:')) {
      analysis.hasTimeout = true;
      analysis.optimizations.push('✅ 设置了超时限制');
    }

    // 检查条件执行
    if (content.includes('if:') && content.includes('needs.')) {
      analysis.hasConditions = true;
      analysis.optimizations.push('✅ 使用条件执行优化');
    }

    // 评估Gemini建议符合度
    const geminiChecks = [
      analysis.hasCache && analysis.cacheType.includes('npm'),  // npm缓存
      analysis.nodeVersion && analysis.nodeVersion !== 'lts/*', // 固定Node版本
      analysis.hasTimeout,  // 超时设置
      analysis.hasConditions  // 条件执行
    ];

    analysis.geminiCompliant = geminiChecks.filter(Boolean).length >= 2;

    return analysis;
  }

  // 验证所有工作流
  validate() {
    console.log('🔍 GitHub Actions 工作流优化验证\n');

    if (!fs.existsSync(this.workflowsPath)) {
      console.log('❌ .github/workflows 目录不存在');
      return;
    }

    const files = fs.readdirSync(this.workflowsPath)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    if (files.length === 0) {
      console.log('ℹ️ 未找到工作流文件');
      return;
    }

    console.log(`📊 发现 ${files.length} 个工作流文件\n`);

    let totalOptimizations = 0;
    let geminiCompliantCount = 0;

    files.forEach(file => {
      const filePath = path.join(this.workflowsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const analysis = this.checkWorkflowContent(content, file);

      console.log(`🔧 ${file}:`);

      if (analysis.optimizations.length > 0) {
        console.log('   优化项:');
        analysis.optimizations.forEach(opt => {
          console.log(`      • ${opt}`);
        });
        totalOptimizations += analysis.optimizations.length;
      }

      if (analysis.warnings.length > 0) {
        console.log('   ⚠️ 建议:');
        analysis.warnings.forEach(warning => {
          console.log(`      • ${warning}`);
        });
      }

      if (analysis.cacheType.length > 0) {
        console.log(`   💾 缓存类型: ${analysis.cacheType.join(', ')}`);
      }

      if (analysis.nodeVersion) {
        console.log(`   📌 Node版本: ${analysis.nodeVersion}`);
      }

      console.log(`   🎯 Gemini建议符合度: ${analysis.geminiCompliant ? '✅ 良好' : '⚠️ 可改进'}`);

      if (analysis.geminiCompliant) {
        geminiCompliantCount++;
      }

      console.log();
    });

    // 总结报告
    console.log('📈 优化总结:');
    console.log(`   总优化项: ${totalOptimizations}`);
    console.log(`   符合Gemini建议的工作流: ${geminiCompliantCount}/${files.length}`);

    const complianceRate = Math.round((geminiCompliantCount / files.length) * 100);
    console.log(`   整体合规率: ${complianceRate}%`);

    if (complianceRate >= 80) {
      console.log('\n🎉 工作流优化状态良好！');
    } else {
      console.log('\n📝 建议进一步优化工作流配置');
    }

    // Gemini v2 建议检查
    console.log('\n💡 Gemini v2 建议 3.3 检查:');
    this.checkGeminiRequirements(files);

    console.log('\n✅ 验证完成!');
  }

  // 检查Gemini具体要求
  checkGeminiRequirements(files) {
    let hasNpmCache = false;
    let hasOptimizedConfig = false;

    files.forEach(file => {
      const filePath = path.join(this.workflowsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes('actions/cache') && content.includes('npm')) {
        hasNpmCache = true;
      }

      if (content.includes('timeout-minutes') || content.includes('if:')) {
        hasOptimizedConfig = true;
      }
    });

    console.log(`   📦 npm依赖缓存: ${hasNpmCache ? '✅ 已实现' : '❌ 缺失'}`);
    console.log(`   ⚡ 性能优化配置: ${hasOptimizedConfig ? '✅ 已实现' : '❌ 缺失'}`);

    if (hasNpmCache && hasOptimizedConfig) {
      console.log('   🎊 完全符合Gemini v2建议3.3！');
    } else {
      console.log('   📋 建议参考新的工作流配置进行优化');
    }
  }
}

// 主执行函数
function main() {
  const validator = new SimpleWorkflowValidator();
  validator.validate();
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SimpleWorkflowValidator;
