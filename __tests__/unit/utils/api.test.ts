import { describe, it, expect, vi } from "vitest";

// Mock dependencies. Vitest hoists these mocks.
vi.mock("@/config", () => ({
  API_CONFIG: { baseURL: "https://mocked-for-test.com", timeout: 9999 },
  ERROR_CONFIG: {},
}));
vi.mock("../../../src/utils/interceptors", () => ({
  setupInterceptors: vi.fn(),
}));

// Import the function to be tested after the mocks are defined.
import { createApi } from "../../../src/utils/api";

describe("api factory", () => {
  it("should create an axios instance with the mocked config", () => {
    const api = createApi();
    expect(api.defaults.baseURL).toBe("https://mocked-for-test.com");
    expect(api.defaults.timeout).toBe(9999);
  });
});
