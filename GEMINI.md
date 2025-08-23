# GEMINI.md - sdszk-redesign

## Project Overview

This is a full-stack web application for an ideological and political education platform.

*   **Frontend:** Vue.js 3 with TypeScript, Vite, Pinia for state management, and Element Plus/Ant Design Vue for UI components.
*   **Backend:** Node.js with Express, using MongoDB as the database and Mongoose for object data modeling. Authentication is handled with JWT.
*   **Architecture:** The project is well-structured with separate directories for frontend (`src`) and backend (`server`) code. It includes detailed documentation on architecture, deployment, and development practices.

## Building and Running

### Frontend

*   **Development:** `npm run dev`
*   **Production Build (Aliyun):** `npm run build:aliyun`
*   **Testing:**
    *   Unit tests: `npm test`
    *   Integration tests: `npm run test:integration`
    *   E2E tests: `npm run test:e2e`

### Backend

*   **Development:** `npm run server:dev`
*   **Production:** `npm start` (in the `server` directory)
*   **Testing:** `npm test` (in the `server` directory)

### Deployment

The project has a set of scripts for automated deployment to an Aliyun server.

*   **Frontend:** `bash scripts/deploy.sh`
*   **Backend:** `bash scripts/deploy-backend.sh`
*   **Nginx:** `bash scripts/deploy-nginx.sh`

## Development Conventions

*   **Git Workflow:** The project uses a `main` branch for production code and encourages feature branches. Commit messages should follow the Conventional Commits specification.
*   **Code Style:** The project uses ESLint and Prettier for code linting and formatting, enforced by Husky pre-commit hooks.
*   **State Management:** Pinia is used for frontend state management, with dedicated stores for user, settings, and permissions.
*   **API:** The backend provides a RESTful API with versioning. API documentation is available.
*   **Environment Configuration:** The project uses `.env` files for managing environment variables for different environments (development, Aliyun).
