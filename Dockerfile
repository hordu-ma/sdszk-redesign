# 多阶段构建用于优化镜像大小
FROM node:18-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm ci --only=production --no-optional
RUN cd server && npm ci --only=production --no-optional

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产阶段
FROM node:18-alpine as production-stage

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制必要文件
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/server/node_modules ./server/node_modules

# 创建必要目录并设置权限
RUN mkdir -p /app/server/uploads && \
    chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server/app.js"]
