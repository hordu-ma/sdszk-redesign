#!/usr/bin/env node
// validate-workflows.js - GitHub Actions工作流验证脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GitHubActionsValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.workflowsPath = path.join(this.projectRoot, '.github/workflows');
    this.results = {
      workflows: [],
      summary: {
        total: 0,
        valid: 0,
        optimized: 0,
        warnings: [],
        errors: []
      }
    };
  }

  // 验证工作流文件
  validateWorkflowFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const workflow = yaml.load(content);
      const fileName = path.basename(filePath, '.yml');

      const analysis = {
        file: fileName,
        path: filePath,
        valid: true,
        hasCache: false,
        hasNodeSetup: false,
        hasArtifacts: false,
        hasConditions: false,
        hasTimeout: false,
        nodeVersion: null,
        cacheStrategy: 'none',
        optimizations: [],
        warnings: [],
        errors: []
      };

      // 检查基本结构
      if (!workflow.name) {
        analysis.warnings.push('缺少工作流名称');
      }

      if (!workflow.on) {
        analysis.errors.push('缺少触发条件');
        analysis.valid = false;
      }

      if (!workflow.jobs) {
        analysis.errors.push('缺少jobs定义');
        analysis.valid = false;
        return analysis;
      }

      // 分析每个job
      Object.entries(workflow.jobs).forEach(([jobName, job]) => {
        if (!job.steps) {
          analysis.errors.push(`Job ${jobName} 缺少steps`);
          return;
        }

        // 检查超时设置
        if (job['timeout-minutes']) {
          analysis.hasTimeout = true;
          analysis.optimizations.push(`Job ${jobName} 设置了超时: ${job['timeout-minutes']}分钟`);
        }

        // 检查条件执行
        if (job.if) {
          analysis.hasConditions = true;
          analysis.optimizations.push(`Job ${jobName} 使用条件执行`);
        }

        // 分析steps
        job.steps.forEach((step, index) => {
          // Node.js设置检查
          if (step.uses && step.uses.includes('actions/setup-node')) {
            analysis.hasNodeSetup = true;
            if (step.with && step.with['node-version']) {
              analysis.nodeVersion = step.with['node-version'];
            }
          }

          // 缓存检查
          if (step.uses && step.uses.includes('actions/cache')) {
            analysis.hasCache = true;
            if (step.with && step.with.path) {
              if (step.with.path.includes('npm') || step.with.path.includes('node_modules')) {
                analysis.cacheStrategy = 'npm';
              } else if (step.with.path.includes('playwright')) {
                analysis.cacheStrategy = 'playwright';
              }
            }
          }

          // Artifacts检查
          if (step.uses && (step.uses.includes('upload-artifact') || step.uses.includes('download-artifact'))) {
            analysis.hasArtifacts = true;
          }

          // 检查缺少名称的步骤
          if (!step.name && !step.uses) {
            analysis.warnings.push(`Step ${index + 1} in job ${jobName} 缺少名称`);
          }
        });
      });

      // 根据Gemini建议检查优化项
      this.checkGeminiOptimizations(analysis, workflow);

      return analysis;
    } catch (error) {
      return {
        file: path.basename(filePath),
        path: filePath,
        valid: false,
        errors: [`解析失败: ${error.message}`]
      };
    }
  }

  // 检查Gemini建议的优化项
  checkGeminiOptimizations(analysis, workflow) {
    // 检查是否有npm缓存
    if (!analysis.hasCache) {
      analysis.warnings.push('建议添加npm依赖缓存以提升CI速度');
    } else if (analysis.cacheStrategy === 'npm') {
      analysis.optimizations.push('✅ 已实现npm依赖缓存');
    }

    // 检查Node.js版本固定
    if (analysis.nodeVersion && analysis.nodeVersion !== 'lts/*') {
      analysis.optimizations.push(`✅ 使用固定Node.js版本: ${analysis.nodeVersion}`);
    } else if (analysis.nodeVersion === 'lts/*') {
      analysis.warnings.push('建议使用固定的Node.js版本号而不是lts/*');
    }

    // 检查并行执行
    Object.entries(workflow.jobs).forEach(([jobName, job]) => {
      if (job.strategy && job.strategy.matrix) {
        analysis.optimizations.push(`✅ Job ${jobName} 使用矩阵策略并行执行`);
      }
    });

    // 检查条件执行
    if (analysis.hasConditions) {
      analysis.optimizations.push('✅ 使用条件执行减少不必要的运行');
    } else {
      analysis.warnings.push('建议添加条件执行以优化CI性能');
    }
  }

  // 验证所有工作流
  validateAllWorkflows() {
    console.log('🔍 开始验证 GitHub Actions 工作流...\n');

    try {
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

      this.results.summary.total = files.length;

      files.forEach(file => {
        const filePath = path.join(this.workflowsPath, file);
        const analysis = this.validateWorkflowFile(filePath);
        this.results.workflows.push(analysis);

        if (analysis.valid) {
          this.results.summary.valid++;
        }

        if (analysis.optimizations && analysis.optimizations.length > 0) {
          this.results.summary.optimized++;
        }

        if (analysis.warnings) {
          this.results.summary.warnings.push(...analysis.warnings);
        }

        if (analysis.errors) {
          this.results.summary.errors.push(...analysis.errors);
        }
      });

      this.generateReport();
    } catch (error) {
      console.error('❌ 验证过程中出错:', error.message);
    }
  }

  // 生成详细报告
  generateReport() {
    console.log('📊 GitHub Actions 工作流验证报告');
    console.log('=' + '='.repeat(50));
    console.log();

    // 总览
    console.log('📈 总览统计:');
    console.log(`   工作流文件总数: ${this.results.summary.total}`);
    console.log(`   有效工作流: ${this.results.summary.valid}`);
    console.log(`   已优化工作流: ${this.results.summary.optimized}`);
    console.log(`   警告数量: ${this.results.summary.warnings.length}`);
    console.log(`   错误数量: ${this.results.summary.errors.length}`);
    console.log();

    // 详细分析
    console.log('📋 详细分析:');
    this.results.workflows.forEach(workflow => {
      console.log(`\n🔧 ${workflow.file}.yml:`);
      console.log(`   状态: ${workflow.valid ? '✅ 有效' : '❌ 无效'}`);

      if (workflow.nodeVersion) {
        console.log(`   Node.js版本: ${workflow.nodeVersion}`);
      }

      if (workflow.hasCache) {
        console.log(`   缓存策略: ${workflow.cacheStrategy}`);
      }

      if (workflow.hasTimeout) {
        console.log(`   超时配置: ✅ 已设置`);
      }

      if (workflow.optimizations && workflow.optimizations.length > 0) {
        console.log('   🎯 优化项:');
        workflow.optimizations.forEach(opt => {
          console.log(`      • ${opt}`);
        });
      }

      if (workflow.warnings && workflow.warnings.length > 0) {
        console.log('   ⚠️ 警告:');
        workflow.warnings.forEach(warning => {
          console.log(`      • ${warning}`);
        });
      }

      if (workflow.errors && workflow.errors.length > 0) {
        console.log('   ❌ 错误:');
        workflow.errors.forEach(error => {
          console.log(`      • ${error}`);
        });
      }
    });

    // Gemini建议实施状态
    console.log('\n💡 Gemini v2 建议 3.3 实施状态:');
    this.checkGeminiImplementation();

    console.log('\n✅ 验证完成!');
  }

  // 检查Gemini建议实施状态
  checkGeminiImplementation() {
    const hasNpmCache = this.results.workflows.some(w => w.hasCache && w.cacheStrategy === 'npm');
    const hasPlaywrightCache = this.results.workflows.some(w => w.hasCache && w.cacheStrategy === 'playwright');
    const hasConditions = this.results.workflows.some(w => w.hasConditions);
    const hasFixedNodeVersion = this.results.workflows.some(w => w.nodeVersion && w.nodeVersion !== 'lts/*');

    console.log(`   📦 npm依赖缓存: ${hasNpmCache ? '✅ 已实现' : '❌ 未实现'}`);
    console.log(`   🎭 Playwright缓存: ${hasPlaywrightCache ? '✅ 已实现' : '➖ 非必需'}`);
    console.log(`   🎯 条件执行: ${hasConditions ? '✅ 已实现' : '⚠️ 建议添加'}`);
    console.log(`   📌 固定Node版本: ${hasFixedNodeVersion ? '✅ 已实现' : '⚠️ 建议固定'}`);

    const implementationScore = [hasNpmCache, hasConditions, hasFixedNodeVersion].filter(Boolean).length;
    const totalItems = 3;

    console.log(`\n   🏆 实施完成度: ${implementationScore}/${totalItems} (${Math.round(implementationScore / totalItems * 100)}%)`);

    if (implementationScore === totalItems) {
      console.log('   🎉 完全符合Gemini v2建议!');
    } else {
      console.log('   📝 还有改进空间');
    }
  }

  // 生成JSON报告
  generateJsonReport() {
    const reportPath = path.join(this.projectRoot, 'github-actions-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      workflows: this.results.workflows,
      geminiCompliance: this.checkGeminiCompliance()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }

  checkGeminiCompliance() {
    const hasNpmCache = this.results.workflows.some(w => w.hasCache && w.cacheStrategy === 'npm');
    const hasConditions = this.results.workflows.some(w => w.hasConditions);
    const hasFixedNodeVersion = this.results.workflows.some(w => w.nodeVersion && w.nodeVersion !== 'lts/*');

    return {
      npmCache: hasNpmCache,
      conditionalExecution: hasConditions,
      fixedNodeVersion: hasFixedNodeVersion,
      overallScore: [hasNpmCache, hasConditions, hasFixedNodeVersion].filter(Boolean).length / 3
    };
  }
}

// 主执行函数
function main() {
  const validator = new GitHubActionsValidator();

  try {
    validator.validateAllWorkflows();
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

export default GitHubActionsValidator;
