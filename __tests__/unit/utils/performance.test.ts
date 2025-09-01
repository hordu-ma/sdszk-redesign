import { describe, it, expect, vi } from "vitest";

// Mock the global window object BEFORE importing the module
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  timing: {
    navigationStart: 1000,
    domContentLoadedEventEnd: 2000,
    loadEventEnd: 3000,
  },
};
vi.stubGlobal("window", {
  performance: mockPerformance,
  PerformanceObserver: vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

// Now, we can import the module. It will use the mocked window.
import { PerformanceMonitor } from "../../../src/utils/performance";

describe("PerformanceMonitor", () => {
  it("getResourceTiming should correctly determine resource type from URL", () => {
    const mockResources: PerformanceResourceTiming[] = [
      {
        name: "https://example.com/assets/script.js",
        duration: 100,
        transferSize: 1024,
        entryType: "resource",
        toJSON: (): any => mockResources[0],
      } as PerformanceResourceTiming,
      {
        name: "https://example.com/assets/style.css",
        duration: 100,
        transferSize: 1024,
        entryType: "resource",
        toJSON: (): any => mockResources[1],
      } as PerformanceResourceTiming,
      {
        name: "https://example.com/assets/image.png",
        duration: 100,
        transferSize: 1024,
        entryType: "resource",
        toJSON: (): any => mockResources[2],
      } as PerformanceResourceTiming,
      {
        name: "https://example.com/api/users",
        duration: 100,
        transferSize: 1024,
        entryType: "resource",
        toJSON: (): any => mockResources[3],
      } as PerformanceResourceTiming,
      {
        name: "https://example.com/other/font.woff",
        duration: 100,
        transferSize: 1024,
        entryType: "resource",
        toJSON: (): any => mockResources[4],
      } as PerformanceResourceTiming,
    ];
    mockPerformance.getEntriesByType.mockReturnValue(mockResources as any);

    const monitor = new PerformanceMonitor();
    const result = monitor.getResourceTiming();

    expect(result.find((r) => r.name.includes(".js"))?.type).toBe("script");
    expect(result.find((r) => r.name.includes(".css"))?.type).toBe(
      "stylesheet",
    );
    expect(result.find((r) => r.name.includes(".png"))?.type).toBe("image");
    expect(result.find((r) => r.name.includes("/api/"))?.type).toBe("api");
    expect(result.find((r) => r.name.includes(".woff"))?.type).toBe("other");
  });
});
