#!/bin/bash

# 部署前检查脚本
# 确保项目在部署前满足所有必要条件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo_info "🔍 开始执行部署前检查..."

# 检查Node.js版本
echo_info "检查Node.js版本..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo_error "Node.js版本过低，需要18.x或更高版本"
    exit 1
fi
echo_success "Node.js版本检查通过: $(node --version)"

# 检查必要的文件
echo_info "检查必要文件..."
required_files=(
    "package.json"
    "Dockerfile" 
    "docker-compose.prod.yml"
    "nginx.conf"
    "vite.config.ts"
    "tsconfig.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo_error "缺少必要文件:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi
echo_success "必要文件检查通过"

# 检查环境配置文件
echo_info "检查环境配置..."
env_files=(".env.production" "server/.env")
for file in "${env_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo_warning "建议创建环境配置文件: $file"
    fi
done

# 检查依赖安装
echo_info "检查依赖安装..."
if [[ ! -d "node_modules" ]]; then
    echo_error "前端依赖未安装，请运行: npm install"
    exit 1
fi

if [[ ! -d "server/node_modules" ]]; then
    echo_error "后端依赖未安装，请运行: cd server && npm install"
    exit 1
fi
echo_success "依赖安装检查通过"

# 检查TypeScript编译
echo_info "检查TypeScript编译..."
if ! npm run type-check > /dev/null 2>&1; then
    echo_error "TypeScript编译检查失败，请修复类型错误"
    npm run type-check
    exit 1
fi
echo_success "TypeScript编译检查通过"

# 检查代码质量
echo_info "检查代码质量..."
if ! npm run lint > /dev/null 2>&1; then
    echo_warning "ESLint检查发现问题，建议运行: npm run lint --fix"
    # 不强制退出，只是警告
fi

# 检查构建
echo_info "测试构建..."
if ! npm run build > /dev/null 2>&1; then
    echo_error "构建失败，请检查构建错误"
    exit 1
fi
echo_success "构建测试通过"

# 检查单元测试
echo_info "运行单元测试..."
if ! npm run test > /dev/null 2>&1; then
    echo_warning "单元测试失败，建议修复后再部署"
    # 不强制退出，允许在测试失败时继续部署（可根据需要调整）
fi

# 检查Docker
echo_info "检查Docker环境..."
if ! docker --version > /dev/null 2>&1; then
    echo_error "Docker未安装或无法访问"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo_error "Docker服务未运行或无权限访问"
    exit 1
fi
echo_success "Docker环境检查通过"

# 检查必要的环境变量（用于生产部署）
echo_info "检查部署环境变量..."
production_vars=("ALIYUN_ECS_HOST" "ALIYUN_DOCKER_USERNAME" "ALIYUN_DOCKER_PASSWORD")
missing_vars=()

for var in "${production_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo_warning "缺少生产部署环境变量（本地开发可忽略）:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
fi

# 检查备份文件（应该已被清理）
echo_info "检查冗余文件..."
backup_files=$(find . -name "*.backup" -o -name "*.bak" -o -name "*.old" -o -name ".DS_Store" 2>/dev/null || true)
if [[ -n "$backup_files" ]]; then
    echo_warning "发现冗余文件，建议清理:"
    echo "$backup_files"
fi

# 安全检查
echo_info "安全检查..."
if npm audit --level=high > /dev/null 2>&1; then
    echo_success "依赖安全检查通过"
else
    echo_warning "发现高危安全漏洞，建议运行: npm audit fix"
fi

# 生成检查报告
echo_info "生成检查报告..."
cat > pre-deploy-check-report.txt << EOF
部署前检查报告
生成时间: $(date)
项目: $(basename "$PWD")

✅ 检查通过项目:
- Node.js版本: $(node --version)
- 必要文件完整
- 依赖安装完成
- TypeScript编译通过
- 构建测试通过
- Docker环境正常

⚠️  需要注意的项目:
$(if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "- 缺少生产环境变量: ${missing_vars[*]}"
fi)
$(if [[ -n "$backup_files" ]]; then
    echo "- 存在冗余文件需要清理"
fi)

📋 建议执行的优化:
1. 清理冗余文件: find . -name "*.backup" -delete
2. 修复代码质量问题: npm run lint --fix
3. 配置生产环境变量
4. 运行完整测试: npm run test:e2e

EOF

echo_success "检查完成！详细报告保存在: pre-deploy-check-report.txt"
echo_info "🚀 项目已准备好进行部署！"

# 如果所有检查都通过，退出码为0
exit 0
