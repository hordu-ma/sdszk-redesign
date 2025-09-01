/// <reference types="vitest/globals" />

import type { vi } from "vitest";

declare global {
  // Vitest globals
  const describe: typeof import("vitest").describe;
  const it: typeof import("vitest").it;
  const test: typeof import("vitest").test;
  const expect: typeof import("vitest").expect;
  const beforeAll: typeof import("vitest").beforeAll;
  const afterAll: typeof import("vitest").afterAll;
  const beforeEach: typeof import("vitest").beforeEach;
  const afterEach: typeof import("vitest").afterEach;
  const vi: typeof import("vitest").vi;

  // Window interface extensions for testing
  interface Window {
    Sentry?: {
      captureMessage: (message: string) => void;
      captureException: (error: Error) => void;
    };
  }

  // Process environment for tests
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

// Import meta environment for Vite/Vitest
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
