#!/usr/bin/env bash
#
# wait-services.sh
#
# 统一服务等待脚本，用于CI/CD流水线中等待依赖服务完全就绪。
# 支持等待以下类型的资源：
#   1. TCP端口:            tcp://host:port
#   2. HTTP/HTTPS端点:     http://host:port/path   或 https://...
#   3. MongoDB简写:        mongo://host:port       (默认端口 27017)
#   4. Redis简写:          redis://host:port       (默认端口 6379)
#   5. 自定义命令:         cmd:命令（返回0视为成功）
#
# 特性：
#   - 并行等待（可配置最大并行度）
#   - 指数退避+最大间隔限制
#   - 统一超时控制 / 单资源软超时提示
#   - 结构化 & 彩色日志（TTY）
#   - 输出最终总结表
#
# 退出码：
#   0  所有资源就绪
#   1  参数错误
#   2  部分资源失败
#   124 全局超时
#
# 用法示例：
#   ./scripts/wait-services.sh \
#       --timeout 180 \
#       tcp://localhost:27017 \
#       redis://localhost:6379 \
#       mongo://localhost \
#       http://localhost:3000/api/health \
#       cmd:"curl -fsS http://localhost:5173"
#
# 推荐：在 GitHub Actions 中使用
#   - name: 等待依赖服务
#     run: bash scripts/wait-services.sh --timeout 180 tcp://localhost:27017 redis://localhost:6379 http://localhost:3000/api/health
#

set -euo pipefail

# -----------------------------
# 配置默认值
# -----------------------------
GLOBAL_TIMEOUT=180            # 全局超时时间（秒）
PER_TARGET_SOFT_TIMEOUT=60    # 单个目标超过该时间提示警告（不立即失败）
SLEEP_BASE=1                  # 退避起始秒
SLEEP_MAX=5                   # 最大退避间隔
PARALLELISM=4                 # 最大并行等待数量
VERBOSE=0                     # 详细日志
SHOW_ENV_INFO=1               # 是否展示诊断环境信息

# -----------------------------
# 彩色输出（仅TTY）
# -----------------------------
if [[ -t 1 ]]; then
  RED='\033[31m'
  GREEN='\033[32m'
  YELLOW='\033[33m'
  BLUE='\033[34m'
  CYAN='\033[36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' DIM='' RESET=''
fi

log()    { printf "%b[%s]%b %s\n" "$CYAN" "$(date +'%H:%M:%S')" "$RESET" "$*"; }
info()   { printf "%b[INFO]%b %s\n" "$BLUE" "$RESET" "$*"; }
warn()   { printf "%b[WARN]%b %s\n" "$YELLOW" "$RESET" "$*"; }
error()  { printf "%b[ERROR]%b %s\n" "$RED" "$RESET" "$*"; }
success(){ printf "%b[DONE]%b %s\n" "$GREEN" "$RESET" "$*"; }
debug()  { [[ $VERBOSE -eq 1 ]] && printf "%b[DBG]%b %s\n" "$DIM" "$RESET" "$*"; }

usage() {
  cat <<EOF
用法: $0 [选项] <资源1> <资源2> ...

选项:
  --timeout <秒>         全局超时时间 (默认: $GLOBAL_TIMEOUT)
  --soft-timeout <秒>    每个资源的软超时警告阈值 (默认: $PER_TARGET_SOFT_TIMEOUT)
  --parallel <N>         并行等待的最大资源数 (默认: $PARALLELISM)
  --verbose              显示调试日志
  --quiet                静默模式（仅最终总结 & 错误）
  --no-env               不显示环境诊断信息
  -h, --help             显示帮助

资源格式支持:
  tcp://host:port
  http://host:port/path   或 https://...
  mongo://host[:port]
  redis://host[:port]
  cmd:任意Shell命令

示例:
  $0 --timeout 200 tcp://localhost:27017 http://localhost:3000/api/health redis://localhost cmd:"curl -fsS http://localhost:5173"
EOF
}

# -----------------------------
# 参数解析
# -----------------------------
QUIET=0
TARGETS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      GLOBAL_TIMEOUT="${2:-}"; shift 2;;
    --soft-timeout)
      PER_TARGET_SOFT_TIMEOUT="${2:-}"; shift 2;;
    --parallel)
      PARALLELISM="${2:-}"; shift 2;;
    --verbose)
      VERBOSE=1; shift;;
    --quiet)
      QUIET=1; shift;;
    --no-env)
      SHOW_ENV_INFO=0; shift;;
    -h|--help)
      usage; exit 0;;
    -*)
      error "未知选项: $1"
      usage
      exit 1;;
    *)
      TARGETS+=("$1"); shift;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  error "未提供任何资源"
  usage
  exit 1
fi

# -----------------------------
# 环境信息 (可选)
# -----------------------------
if [[ $SHOW_ENV_INFO -eq 1 && $QUIET -eq 0 ]]; then
  info "Runner 信息: uname=$(uname -a)"
  info "Node 版本 (若已安装): $(command -v node >/dev/null 2>&1 && node -v || echo 'N/A')"
  info "可用命令: $(for c in nc curl wget mongo mongosh redis-cli; do command -v "$c" >/dev/null 2>&1 && printf "%s " "$c"; done; echo)"
fi

# -----------------------------
# 工具函数
# -----------------------------

_now() { date +%s; }

elapsed() {
  local start="$1"
  echo $(( $(_now) - start ))
}

sleep_backoff() {
  local attempt="$1"
  local delay=$(( SLEEP_BASE * attempt ))
  (( delay > SLEEP_MAX )) && delay=$SLEEP_MAX
  debug "退避等待 ${delay}s (attempt=${attempt})"
  sleep "$delay"
}

check_tcp() {
  local host="$1" port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z "$host" "$port" >/dev/null 2>&1
  elif command -v bash >/dev/null 2>&1; then
    (echo >"/dev/tcp/$host/$port") >/dev/null 2>&1
  else
    return 2
  fi
}

check_http() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 5 "$url" >/dev/null 2>&1
  elif command -v wget >/dev/null 2>&1; then
    wget -q --timeout=5 -O /dev/null "$url" >/dev/null 2>&1
  else
    return 2
  fi
}

check_mongo() {
  local host="$1" port="$2"
  local cmd=""
  if command -v mongosh >/dev/null 2>&1; then
    cmd=(mongosh --quiet --host "${host}:${port}" --eval 'db.runCommand({ping:1})')
  elif command -v mongo >/dev/null 2>&1; then
    cmd=(mongo --quiet --host "${host}:${port}" --eval 'db.runCommand({ping:1})')
  else
    # 无 mongo CLI 时尝试纯 TCP 探测作为降级
    if check_tcp "$host" "$port"; then
      debug "Mongo CLI 不存在，使用 TCP 探测判定端口开启: ${host}:${port}"
      return 0
    fi
    return 2
  fi
  "${cmd[@]}" >/dev/null 2>&1
}

check_redis() {
  local host="$1" port="$2"
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -h "$host" -p "$port" ping 2>/dev/null | grep -q PONG
  else
    # 无 redis-cli 时使用 TCP 降级判定
    if check_tcp "$host" "$port"; then
      debug "Redis CLI 不存在，使用 TCP 探测判定端口开启: ${host}:${port}"
      return 0
    fi
    return 2
  fi
}

check_cmd() {
  # shellcheck disable=SC2086
  bash -c "$1" >/dev/null 2>&1
}

# -----------------------------
# 单资源等待函数
# -----------------------------
wait_target() {
  local target="$1"
  local start_ts=$(_now)
  local attempt=0
  local soft_warned=0
  local type desc host port raw_cmd
  local max_deadline=$(( GLOBAL_START + GLOBAL_TIMEOUT ))

  # 解析
  if [[ "$target" =~ ^tcp://([^:/]+):([0-9]+)$ ]]; then
    type="tcp"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[2]}"; desc="TCP ${host}:${port}"
  elif [[ "$target" =~ ^http://.*$ || "$target" =~ ^https://.*$ ]]; then
    type="http"; desc="HTTP ${target}"
  elif [[ "$target" =~ ^mongo://([^:/]+)(:([0-9]+))?$ ]]; then
    type="mongo"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[3]:-27017}"; desc="MongoDB ${host}:${port}"
  elif [[ "$target" =~ ^redis://([^:/]+)(:([0-9]+))?$ ]]; then
    type="redis"; host="${BASH_REMATCH[1]}"; port="${BASH_REMATCH[3]:-6379}"; desc="Redis ${host}:${port}"
  elif [[ "$target" =~ ^cmd:(.+)$ ]]; then
    type="cmd"; raw_cmd="${BASH_REMATCH[1]}"; desc="CMD '${raw_cmd}'"
  else
    printf "%s|UNKNOWN|FAIL|Unsupported format\n" "$target"
    return
  fi

  [[ $QUIET -eq 0 ]] && info "开始等待: ${desc}"

  while true; do
    local now=$(_now)
    if (( now >= max_deadline )); then
      error "超时: ${desc} (全局超时)"
      printf "%s|%s|FAIL|timeout\n" "$target" "$type"
      return
    fi

    local res=1
    case "$type" in
      tcp)   check_tcp "$host" "$port" && res=0 || res=$? ;;
      http)  check_http "$target" && res=0 || res=$? ;;
      mongo) check_mongo "$host" "$port" && res=0 || res=$? ;;
      redis) check_redis "$host" "$port" && res=0 || res=$? ;;
      cmd)   check_cmd "$raw_cmd" && res=0 || res=$? ;;
    esac

    if [[ $res -eq 0 ]]; then
      local took
      took=$(elapsed "$start_ts")
      [[ $QUIET -eq 0 ]] && success "就绪: ${desc} (耗时 ${took}s)"
      printf "%s|%s|OK|%ss\n" "$target" "$type" "$took"
      return
    elif [[ $res -eq 2 ]]; then
      error "环境缺少依赖工具，无法检测: ${desc}"
      printf "%s|%s|FAIL|missing-tool\n" "$target" "$type"
      return
    fi

    local e
    e=$(elapsed "$start_ts")
    if (( e > PER_TARGET_SOFT_TIMEOUT && soft_warned == 0 )); then
      warn "资源仍未就绪: ${desc} (> ${PER_TARGET_SOFT_TIMEOUT}s)"
      soft_warned=1
    fi

    attempt=$((attempt + 1))
    sleep_backoff "$attempt"
  done
}

# -----------------------------
# 并行调度
# -----------------------------
GLOBAL_START=$(_now)
RESULTS_FILE=$(mktemp -t wait-results-XXXX)
pids=()
active=0
declare -A PID_TARGET

launch_wait() {
  local t="$1"
  wait_target "$t" >>"$RESULTS_FILE" &
  local pid=$!
  pids+=("$pid")
  PID_TARGET["$pid"]="$t"
  active=$((active + 1))
  debug "启动等待进程 pid=$pid target=$t"
}

for t in "${TARGETS[@]}"; do
  while (( active >= PARALLELISM )); do
    for i in "${!pids[@]}"; do
      if ! kill -0 "${pids[$i]}" 2>/dev/null; then
        wait "${pids[$i]}" || true
        unset 'pids[i]'
        active=$((active - 1))
      fi
    done
    sleep 0.2
  done
  launch_wait "$t"
done

# 等待全部
for pid in "${pids[@]}"; do
  wait "$pid" || true
done

TOTAL_ELAPSED=$(elapsed "$GLOBAL_START")

# -----------------------------
# 汇总
# -----------------------------
FAILED=0
[[ $QUIET -eq 0 ]] && echo
echo -e "${BOLD}等待结果汇总:${RESET}"
printf "%-40s | %-8s | %-6s | %s\n" "Resource" "Type" "Status" "Info"
printf "%-40s-+-%-8s-+-%-6s-+-%s\n" "----------------------------------------" "--------" "------" "------------------------------"

while IFS='|' read -r raw type status info; do
  [[ -z "$raw" ]] && continue
  pad_raw="$raw"
  [[ ${#pad_raw} -gt 40 ]] && pad_raw="${pad_raw:0:37}..."
  if [[ "$status" == "OK" ]]; then
    printf "%-40s | %-8s | %b%-6s%b | %s\n" "$pad_raw" "$type" "$GREEN" "$status" "$RESET" "$info"
  else
    printf "%-40s | %-8s | %b%-6s%b | %s\n" "$pad_raw" "$type" "$RED" "$status" "$RESET" "$info"
    FAILED=$((FAILED + 1))
  fi
done <"$RESULTS_FILE"

echo
if (( FAILED > 0 )); then
  error "共有 ${FAILED} 个资源等待失败 (总耗时 ${TOTAL_ELAPSED}s)"
  if (( TOTAL_ELAPSED >= GLOBAL_TIMEOUT )); then
    error "全局超时(${GLOBAL_TIMEOUT}s) - 退出码 124"
    rm -f "$RESULTS_FILE"
    exit 124
  fi
  rm -f "$RESULTS_FILE"
  exit 2
else
  success "所有资源已就绪 (总耗时 ${TOTAL_ELAPSED}s)"
  rm -f "$RESULTS_FILE"
  exit 0
fi
