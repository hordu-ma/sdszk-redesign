import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { Logger, devLog } from "../../../src/utils/logger";

// Mock globals after importing vitest
beforeAll(() => {
  vi.stubGlobal("import.meta.env", { DEV: true }); // Default to DEV mode
  vi.stubGlobal("window", { Sentry: { captureMessage: vi.fn() } });
});

describe("Logger", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Development Mode", () => {
    it("should log all levels to the console", () => {
      const logger = new Logger();
      logger.info("dev info");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "dev info",
      );
      logger.warn("dev warn");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
        "dev warn",
      );
      logger.error("dev error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
        "dev error",
      );
    });

    it("devLog should call console.log", () => {
      devLog("dev log message");
      expect(consoleLogSpy).toHaveBeenCalledWith("dev log message");
    });
  });

  describe("Production Mode", () => {
    beforeEach(() => {
      // Override for this block
      vi.stubGlobal("import.meta.env", { DEV: false });
    });

    it("should only send errors to monitoring", () => {
      const logger = new Logger();
      logger.info("prod info");
      logger.warn("prod warn");
      logger.error("prod error");

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect((window as any).Sentry.captureMessage).toHaveBeenCalledOnce();
    });
  });
});
