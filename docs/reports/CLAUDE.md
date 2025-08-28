# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

山东省大中小学思政课一体化教育平台 - A full-stack ideological and political education platform built with Vue 3 + TypeScript + Node.js + MongoDB.

**Domain**: https://horsduroot.com
**Server**: Aliyun ECS (60.205.124.67)
**Tech Stack**: Ubuntu 20.04 + Nginx + Node.js + MongoDB + PM2

## Development Commands

### Frontend (Root Directory)

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Build for development
npm run build:aliyun # Build for production (Aliyun deployment)
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run Vitest unit tests
npm run test:ui      # Run Vitest UI
npm run test:coverage # Run tests with coverage
npm run test:integration # Run integration tests
npm run test:e2e     # Run Playwright E2E tests
npm run server       # Start backend server
npm run server:dev   # Start backend with nodemon
```

### Backend (Server Directory)

```bash
cd server
npm start           # Start production server
npm run dev         # Start dev server with nodemon
npm run seed        # Seed database
npm run migrate:up  # Run database migrations up
npm run migrate:down # Run database migrations down
npm run test        # Run backend tests
npm run test:security # Run security tests
npm run validate:security # Validate security configuration
```

## Architecture

### Frontend Structure

- **Framework**: Vue 3.3.4 + TypeScript 5.2.0
- **Build Tool**: Vite 4.4.9
- **UI Libraries**: Element Plus 2.3.14 + Ant Design Vue 4.0.3
- **State Management**: Pinia 2.1.6 with persistence
- **Routing**: Vue Router 4.2.4
- **HTTP Client**: Axios ^1.5.0

Key directories:

- `src/api/` - API interfaces and HTTP requests
- `src/components/` - Reusable components
- `src/stores/` - Pinia state management
- `src/views/` - Page components
- `src/types/` - TypeScript type definitions

### Backend Structure

- **Framework**: Express 4.18.2
- **Database**: MongoDB with Mongoose 8.1.1
- **Authentication**: JWT + bcrypt
- **Security**: helmet, cors, rate-limit

Key directories:

- `server/controllers/` - Business logic
- `server/models/` - Mongoose schemas
- `server/routes/` - API routes
- `server/middleware/` - Express middleware
- `server/uploads/` - File upload storage

### Core APIs

- `/api/auth` - Authentication and sessions
- `/api/news` - News management
- `/api/resources` - Teaching resources
- `/api/admin` - Admin endpoints (protected)
- `/api/activities` - Activity management

## Environment Configuration

### Frontend Environments

- `.env.development` - Local development
- `.env.aliyun` - Production deployment (Aliyun)

### Backend Environments

- `server/.env` - Local development
- `server/.env.production` - Production deployment

Key environment variables:

- `VITE_API_BASE_URL` - Frontend API base URL
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment mode

## Deployment

### Frontend Deployment

```bash
npm run build:aliyun    # Build for production
./scripts/deploy.sh     # Deploy to Aliyun
```

### Backend Deployment

```bash
./scripts/deploy-backend.sh  # Deploy backend with PM2
```

### Nginx Configuration

```bash
./scripts/deploy-nginx.sh    # Update Nginx configuration
```

## Testing

### Unit Tests (Vitest)

```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run test:coverage     # With coverage
```

### Integration Tests

```bash
npm run test:integration  # Run integration tests
```

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run headed browser
```

## Code Quality

### Linting and Formatting

```bash
npm run lint    # ESLint check and fix
npm run format  # Prettier formatting
```

### Type Checking

```bash
vue-tsc --noEmit  # TypeScript type checking
```

## Development Workflow

1. **Start development**:

   ```bash
   npm run dev          # Frontend (terminal 1)
   npm run server:dev   # Backend (terminal 2)
   ```

2. **Run tests before committing**:

   ```bash
   npm run lint
   npm run test
   ```

3. **Deploy changes**:
   ```bash
   ./scripts/deploy.sh        # Frontend
   ./scripts/deploy-backend.sh # Backend
   ```

## Important Files

- `vite.config.ts` - Frontend build configuration
- `vite.config.aliyun.ts` - Production build configuration
- `server/app.js` - Backend entry point
- `src/main.ts` - Frontend entry point
- `src/router/index.ts` - Vue Router configuration
- `server/.env.production` - Production environment variables

## Database

- **Development**: MongoDB `sdszk` database
- **Production**: MongoDB `sdszk` database
- **Migrations**: `server/migrations/` directory
- **Seeding**: `npm run seed` in server directory

## Security Features

- JWT authentication with role-based permissions
- Input validation with Joi
- Rate limiting with express-rate-limit
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- File upload validation and restrictions

## Added tips

- Use `dev-start.sh`and `dev-stop.sh` to control servers for validation

## 文档管理规范

为了保持项目整洁和文档的易于查找，所有新增的文档、报告、指南等都应遵循以下规范：

- **统一存放位置**: 所有文档都应存放在根目录的 `/docs` 文件夹下。
- **分类存放**:
  - `/docs/backend`: 存放后端相关的文档，如API说明等。
  - `/docs/deployment`: 存放部署、CI/CD相关的指南和清单。
  - `/docs/dev-guides`: 存放开发指南、架构设计、技术选型等文档。
  - `/docs/reports`: 存放开发过程中的报告、分析、修复说明等存档文件。
- **根目录**: 根目录应保持整洁，除 `README.md` 等项目级配置文件外，不应直接存放文档文件。
