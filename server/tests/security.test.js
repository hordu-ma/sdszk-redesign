/**
 * Helmet CSP配置测试
 * 测试安全策略配置的正确性和环境适配性
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getHelmetConfig,
  getCSPConfig,
  generateNonce,
  cspViolationHandler,
} from "../config/security.js";

describe("Security Configuration Tests", () => {
  describe("generateNonce", () => {
    it("should generate a valid base64 nonce", () => {
      const nonce = generateNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(0);
      // 验证是否为有效的base64字符串
      expect(Buffer.from(nonce, "base64").toString("base64")).toBe(nonce);
    });

    it("should generate unique nonces", () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe("getCSPConfig", () => {
    it("should return development CSP config by default", () => {
      const config = getCSPConfig();
      expect(config.directives.scriptSrc).toContain("'unsafe-inline'");
      expect(config.directives.styleSrc).toContain("'unsafe-inline'");
      expect(config.directives.connectSrc).toContain("ws://localhost:*");
    });

    it("should return production CSP config", () => {
      const config = getCSPConfig("production");
      expect(config.directives.scriptSrc).not.toContain("'unsafe-inline'");
      expect(config.directives.styleSrc).not.toContain("'unsafe-inline'");
      expect(config.directives.frameAncestors).toContain("'none'");
    });

    it("should return test CSP config", () => {
      const config = getCSPConfig("test");
      expect(config.directives.scriptSrc).toContain("'unsafe-inline'");
      expect(config.directives.scriptSrc).toContain("'unsafe-eval'");
    });

    it("should add nonce to production config when provided", () => {
      const nonce = "test-nonce-123";
      const config = getCSPConfig("production", nonce);
      expect(config.directives.scriptSrc).toContain(`'nonce-${nonce}'`);
      expect(config.directives.styleSrc).toContain(`'nonce-${nonce}'`);
    });

    it("should not add nonce to development config", () => {
      const nonce = "test-nonce-123";
      const config = getCSPConfig("development", nonce);
      expect(config.directives.scriptSrc).not.toContain(`'nonce-${nonce}'`);
    });
  });

  describe("getHelmetConfig", () => {
    it("should return complete helmet config for development", () => {
      const config = getHelmetConfig("development");
      expect(config.contentSecurityPolicy).toBeDefined();
      expect(config.crossOriginOpenerPolicy).toBeDefined();
      expect(config.noSniff).toBe(true);
      expect(config.xssFilter).toBe(true);
      expect(config.hsts).toBe(false); // 开发环境禁用HSTS
    });

    it("should return complete helmet config for production", () => {
      const config = getHelmetConfig("production");
      expect(config.contentSecurityPolicy).toBeDefined();
      expect(config.hsts).toBeDefined();
      expect(config.hsts.maxAge).toBe(31536000);
      expect(config.hsts.includeSubDomains).toBe(true);
    });

    it("should accept custom CSP config", () => {
      const customCSP = {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://custom.example.com"],
        },
      };
      const config = getHelmetConfig("production", { customCSP });
      expect(config.contentSecurityPolicy).toBe(customCSP);
    });

    it("should include nonce in production config", () => {
      const nonce = "production-nonce-456";
      const config = getHelmetConfig("production", { nonce });
      expect(config.contentSecurityPolicy.directives.scriptSrc).toContain(
        `'nonce-${nonce}'`,
      );
    });
  });

  describe("CSP Directives Validation", () => {
    it("should have secure default-src in all environments", () => {
      ["development", "production", "test"].forEach((env) => {
        const config = getCSPConfig(env);
        expect(config.directives.defaultSrc).toContain("'self'");
        expect(config.directives.defaultSrc).not.toContain("*");
      });
    });

    it("should block object-src in all environments", () => {
      ["development", "production", "test"].forEach((env) => {
        const config = getCSPConfig(env);
        expect(config.directives.objectSrc).toContain("'none'");
      });
    });

    it("should have frame-ancestors none in production", () => {
      const config = getCSPConfig("production");
      expect(config.directives.frameAncestors).toContain("'none'");
    });

    it("should upgrade insecure requests in all environments", () => {
      ["development", "production", "test"].forEach((env) => {
        const config = getCSPConfig(env);
        expect(config.directives.upgradeInsecureRequests).toEqual([]);
      });
    });
  });

  describe("Security Headers Validation", () => {
    it("should enable HSTS in production", () => {
      const config = getHelmetConfig("production");
      expect(config.hsts).toBeDefined();
      expect(config.hsts.maxAge).toBeGreaterThan(0);
      expect(config.hsts.includeSubDomains).toBe(true);
      expect(config.hsts.preload).toBe(true);
    });

    it("should disable HSTS in development", () => {
      const config = getHelmetConfig("development");
      expect(config.hsts).toBe(false);
    });

    it("should set secure referrer policy", () => {
      const config = getHelmetConfig("production");
      expect(config.referrerPolicy.policy).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    it("should enable XSS filter", () => {
      ["development", "production"].forEach((env) => {
        const config = getHelmetConfig(env);
        expect(config.xssFilter).toBe(true);
      });
    });

    it("should enable MIME type sniffing protection", () => {
      ["development", "production"].forEach((env) => {
        const config = getHelmetConfig(env);
        expect(config.noSniff).toBe(true);
      });
    });
  });

  describe("cspViolationHandler", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        get: vi.fn((header) => {
          if (header === "User-Agent") return "test-agent";
          return null;
        }),
        body: {
          "violated-directive": "script-src",
          "blocked-uri": "https://malicious.example.com/script.js",
        },
        ip: "127.0.0.1",
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        end: vi.fn(),
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should handle CSP violation reports", async () => {
      // Mock console.warn since the import is async and will fallback
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      cspViolationHandler(mockReq, mockRes);

      // Wait for async import to potentially complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe("Environment-specific Configurations", () => {
    it("should allow unsafe eval in development for build tools", () => {
      const config = getCSPConfig("development");
      expect(config.directives.scriptSrc).toContain("'unsafe-eval'");
    });

    it("should not allow unsafe eval in production", () => {
      const config = getCSPConfig("production");
      expect(config.directives.scriptSrc).not.toContain("'unsafe-eval'");
    });

    it("should allow localhost connections in development", () => {
      const config = getCSPConfig("development");
      expect(config.directives.connectSrc).toContain("http://localhost:*");
      expect(config.directives.connectSrc).toContain("ws://localhost:*");
    });

    it("should not allow localhost connections in production", () => {
      const config = getCSPConfig("production");
      expect(config.directives.connectSrc).not.toContain("http://localhost:*");
      expect(config.directives.connectSrc).not.toContain("ws://localhost:*");
    });

    it("should restrict image sources in production", () => {
      const devConfig = getCSPConfig("development");
      const prodConfig = getCSPConfig("production");

      expect(devConfig.directives.imgSrc).toContain("https:");
      expect(devConfig.directives.imgSrc).toContain("http://localhost:*");

      expect(prodConfig.directives.imgSrc).not.toContain("https:");
      expect(prodConfig.directives.imgSrc).not.toContain("http:");
    });
  });
});
