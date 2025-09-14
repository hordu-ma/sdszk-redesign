#!/bin/bash

# ==============================================================================
# 山东省思政课一体化中心 - CMS健康检查脚本 (v1.0)
# ==============================================================================

set -e # 任何命令失败则立即退出

# --- 动态路径计算 ---
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_ROOT=$(dirname "$(dirname "$SCRIPT_DIR")")

# --- 配置 ---
REPORT_DIR="$PROJECT_ROOT/.cms-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/cms-health-$TIMESTAMP.log"

# --- 颜色定义 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- 日志函数 ---
log_info() { echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$REPORT_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$REPORT_FILE"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$REPORT_FILE"; }
log_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$REPORT_FILE"; }
log_section() { echo -e "\n${BLUE}==================== $1 ====================${NC}" | tee -a "$REPORT_FILE"; }

# --- 初始化 ---
init_report() {
    if [ ! -d "$REPORT_DIR" ]; then
        mkdir -p "$REPORT_DIR"
    fi

    echo "CMS健康检查报告" > "$REPORT_FILE"
    echo "生成时间: $(date)" >> "$REPORT_FILE"
    echo "项目路径: $PROJECT_ROOT" >> "$REPORT_FILE"
    echo "===========================================" >> "$REPORT_FILE"
}

# --- 检查开发环境是否运行 ---
check_dev_environment() {
    log_section "环境检查"

    # 检查前端服务 (端口5173)
    if nc -z localhost 5173 2>/dev/null; then
        log_success "前端服务运行正常 (localhost:5173)"
    else
        log_error "前端服务未启动"
        log_info "请先运行: ./scripts/development/dev-start.sh"
        return 1
    fi

    # 检查后端API (端口3000)
    if nc -z localhost 3000 2>/dev/null; then
        log_success "后端API运行正常 (localhost:3000)"
    else
        log_error "后端API未启动"
        return 1
    fi

    # 检查API健康状态
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "API健康检查通过"
    else
        log_warning "API健康检查异常"
    fi
}

# --- 执行CMS检查 ---
run_cms_checks() {
    log_section "CMS功能检查"

    local page_check_result=0
    local function_test_result=0

    # 检查CMS核心页面可达性
    if node "$SCRIPT_DIR/cms-health-check.js"; then
        log_success "CMS页面可达性检查完成"
        page_check_result=1
    else
        log_error "CMS页面检查失败"
        page_check_result=0
    fi

    # 检查CMS核心功能
    if node "$SCRIPT_DIR/cms-function-test.js"; then
        log_success "CMS功能测试完成"
        function_test_result=1
    else
        log_error "CMS功能测试失败"
        function_test_result=0
    fi

    # 返回组合结果：页面检查结果 + 功能测试结果
    return $((2 - page_check_result - function_test_result))
}

# --- 生成报告总结 ---
generate_summary() {
    local cms_check_result=$1

    log_section "检查总结"

    local total_checks=3  # 环境检查 + 页面检查 + 功能测试
    local successful_checks=$((3 - cms_check_result))
    local failed_checks=$cms_check_result

    echo "" | tee -a "$REPORT_FILE"
    log_info "检查完成统计:"
    log_info "总检查项目: $total_checks 项"
    log_success "成功: $successful_checks 项"
    if [ "$failed_checks" -gt 0 ]; then
        log_error "失败: $failed_checks 项"
    fi
    echo "" | tee -a "$REPORT_FILE"

    if [ "$failed_checks" -eq 0 ]; then
        log_success "🎉 CMS系统健康状态良好！"
        log_info "• 环境检查通过"
        log_info "• 页面可达性检查通过"
        log_info "• 功能测试完成"
    else
        log_warning "⚠️  发现 $failed_checks 个检查项目失败，请查看详细报告"
        if [ "$((cms_check_result & 2))" -ne 0 ]; then
            log_error "• 页面检查存在问题"
        fi
        if [ "$((cms_check_result & 1))" -ne 0 ]; then
            log_error "• 功能测试存在问题"
        fi
    fi

    log_info "详细报告保存在: $REPORT_FILE"

    return $failed_checks
}

# --- 主执行流程 ---
main() {
    # 初始化报告
    init_report

    log_info "🚀 开始CMS健康检查..."
    log_info "项目根目录: $PROJECT_ROOT"

    # 检查环境
    if ! check_dev_environment; then
        log_error "环境检查失败，终止检查"
        exit 1
    fi

    # 执行CMS检查
    run_cms_checks
    local cms_result=$?

    # 生成报告总结
    generate_summary $cms_result
    local summary_result=$?

    log_info "检查完成！"

    # 返回检查结果
    exit $summary_result
}

# 执行主程序
main "$@"
