#!/usr/bin/env bash
#
# wait-services-simple.sh
#
# 简化版本的服务等待脚本，专为CI环境优化
# 避免复杂的并行处理，使用顺序等待确保可靠性
#

set -euo pipefail

# 配置
TIMEOUT=180
SLEEP_INTERVAL=2
VERBOSE=0

# 颜色输出
if [[ -t 1 ]]; then
  RED='\033[31m'
  GREEN='\033[32m'
  YELLOW='\033[33m'
  BLUE='\033[34m'
  CYAN='\033[36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' RESET=''
fi

log() { printf "%b[%s]%b %s\n" "$CYAN" "$(date +'%H:%M:%S')" "$RESET" "$*"; }
info() { printf "%b[INFO]%b %s\n" "$BLUE" "$RESET" "$*"; }
warn() { printf "%b[WARN]%b %s\n" "$YELLOW" "$RESET" "$*"; }
error() { printf "%b[ERROR]%b %s\n" "$RED" "$RESET" "$*"; }
success() { printf "%b[DONE]%b %s\n" "$GREEN" "$RESET" "$*"; }
debug() { if [[ "${VERBOSE:-0}" -eq 1 ]]; then printf "%b[DEBUG]%b %s\n" "$RESET" "$RESET" "$*"; fi; }

usage() {
  cat <<EOF
用法: $0 [选项] <资源1> <资源2> ...

选项:
  --timeout <秒>    全局超时时间 (默认: $TIMEOUT)
  --verbose         显示调试信息
  -h, --help        显示帮助

资源格式:
  tcp://host:port
  http://host:port[/path]
  mongo://host[:port]    (默认端口: 27017)
  redis://host[:port]    (默认端口: 6379)

示例:
  $0 --timeout 120 tcp://localhost:27017 redis://localhost:6379
EOF
}

# 参数解析
TARGETS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT="${2:-}"; shift 2;;
    --verbose)
      VERBOSE=1; shift;;
    -h|--help)
      usage; exit 0;;
    -*)
      error "未知选项: $1"; usage; exit 1;;
    *)
      TARGETS+=("$1"); shift;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  error "未提供任何资源"
  usage; exit 1
fi

# 检查工具函数
check_tcp() {
  local host="$1" port="$2"
  timeout 5 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
}

check_http() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 5 "$url" >/dev/null 2>&1
  else
    return 1
  fi
}

check_mongo() {
  local host="$1" port="$2"
  # 优先使用TCP检查（在CI环境中更可靠）
  check_tcp "$host" "$port"
}

check_redis() {
  local host="$1" port="$2"
  # 优先使用TCP检查（在CI环境中更可靠）
  check_tcp "$host" "$port"
}

# 等待单个资源
wait_resource() {
  local target="$1"
  local start_time=$(date +%s)
  local attempt=1
  local type host port desc

  # 解析目标
  if [[ "$target" =~ ^tcp://([^:/]+):([0-9]+)$ ]]; then
    type="tcp"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[2]}"
    desc="TCP ${host}:${port}"
  elif [[ "$target" =~ ^http://.*$ || "$target" =~ ^https://.*$ ]]; then
    type="http"; desc="HTTP ${target}"
  elif [[ "$target" =~ ^mongo://([^:/]+)(:([0-9]+))?$ ]]; then
    type="mongo"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[3]:-27017}"
    desc="MongoDB ${host}:${port}"
  elif [[ "$target" =~ ^redis://([^:/]+)(:([0-9]+))?$ ]]; then
    type="redis"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[3]:-6379}"
    desc="Redis ${host}:${port}"
  else
    error "不支持的资源格式: $target"
    return 1
  fi

  info "等待 ${desc}..."

  while true; do
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))

    if [[ $elapsed -ge $TIMEOUT ]]; then
      error "${desc} 超时 (${TIMEOUT}s)"
      return 1
    fi

    debug "尝试 ${attempt}: ${desc}"

    local result=1
    case "$type" in
      tcp)   check_tcp "$host" "$port" && result=0 ;;
      http)  check_http "$target" && result=0 ;;
      mongo) check_mongo "$host" "$port" && result=0 ;;
      redis) check_redis "$host" "$port" && result=0 ;;
    esac

    if [[ $result -eq 0 ]]; then
      success "${desc} 就绪 (${elapsed}s)"
      return 0
    fi

    # 警告长时间等待
    if [[ $elapsed -gt 30 && $((elapsed % 30)) -eq 0 ]]; then
      warn "${desc} 仍在等待... (${elapsed}s)"
    fi

    attempt=$((attempt + 1))
    sleep $SLEEP_INTERVAL
  done
}

# 主逻辑
info "开始等待 ${#TARGETS[@]} 个资源 (超时: ${TIMEOUT}s)..."

failed=0
for target in "${TARGETS[@]}"; do
  if ! wait_resource "$target"; then
    failed=$((failed + 1))
  fi
done

echo
if [[ $failed -eq 0 ]]; then
  success "所有资源已就绪!"
  exit 0
else
  error "${failed} 个资源失败"
  exit 1
fi
