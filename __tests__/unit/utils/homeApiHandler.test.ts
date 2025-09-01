import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { newsApi, newsCategoryApi, resourceApi } from "@/api";
import type { ApiResponse, PaginatedResponse } from "../../../src/api/types";

// Mock the entire api module
vi.mock("@/api", () => ({
  newsApi: { instance: { getList: vi.fn() } },
  newsCategoryApi: { instance: { getCoreCategories: vi.fn() } },
  resourceApi: { instance: { getList: vi.fn() } },
}));

// We need to dynamically import the handler to test its internal cache
async function getHandlers() {
  return await import("../../../src/utils/homeApiHandler");
}

describe("homeApiHandler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Reset modules to clear internal cache of the handler module
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCoreCategoriesWithCache", () => {
    it("should fetch from API on first call and use cache on second call", async () => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: [
          {
            _id: "cat1",
            name: "Category 1",
            key: "category1",
            description: "Test category",
            order: 1,
            color: "#000000",
            isActive: true,
            isCore: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      vi.mocked(newsCategoryApi.instance.getCoreCategories).mockResolvedValue(
        mockResponse,
      );
      const { getCoreCategoriesWithCache } = await getHandlers();

      // 1. First call
      const result1 = await getCoreCategoriesWithCache();
      expect(result1).toEqual(mockResponse);
      expect(newsCategoryApi.instance.getCoreCategories).toHaveBeenCalledOnce();

      // 2. Second call (should be cached)
      const result2 = await getCoreCategoriesWithCache();
      expect(result2).toEqual(mockResponse);
      // API should still only be called once
      expect(newsCategoryApi.instance.getCoreCategories).toHaveBeenCalledOnce();
    });

    it("should re-fetch from API after TTL expires", async () => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: [
          {
            _id: "cat1",
            name: "Category 1",
            key: "category1",
            description: "Test category",
            order: 1,
            color: "#000000",
            isActive: true,
            isCore: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      vi.mocked(newsCategoryApi.instance.getCoreCategories).mockResolvedValue(
        mockResponse,
      );
      const { getCoreCategoriesWithCache } = await getHandlers();

      await getCoreCategoriesWithCache(); // First call
      expect(newsCategoryApi.instance.getCoreCategories).toHaveBeenCalledOnce();

      // Advance time by 6 minutes (TTL is 5 mins)
      vi.advanceTimersByTime(6 * 60 * 1000);

      await getCoreCategoriesWithCache(); // Second call after expiry
      expect(newsCategoryApi.instance.getCoreCategories).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe("getResourcesByCategoryWithCache", () => {
    it("should fetch and then use cache for the same category", async () => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: [
          {
            id: "res1",
            title: "Resource 1",
            content: "Test content",
            type: "document",
            url: "http://example.com/resource1",
            status: "published",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      vi.mocked(resourceApi.instance.getList).mockResolvedValue(mockResponse);
      const { getResourcesByCategoryWithCache } = await getHandlers();

      // First call
      await getResourcesByCategoryWithCache("tech", 5);
      expect(resourceApi.instance.getList).toHaveBeenCalledWith({
        category: "tech",
        limit: 5,
      });
      expect(resourceApi.instance.getList).toHaveBeenCalledOnce();

      // Second call
      await getResourcesByCategoryWithCache("tech", 5);
      expect(resourceApi.instance.getList).toHaveBeenCalledOnce(); // Should not be called again
    });
  });

  describe("getNewsByCategoryWithCache", () => {
    it("should fetch and then use cache for the same category", async () => {
      const mockResponse: PaginatedResponse<any> = {
        success: true,
        data: [
          {
            id: "news1",
            title: "News 1",
            content: "Test news content",
            author: "test-author",
            status: "published",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 3,
        },
      };
      vi.mocked(newsApi.instance.getList).mockResolvedValue(mockResponse);
      const { getNewsByCategoryWithCache } = await getHandlers();

      // First call
      await getNewsByCategoryWithCache("policy", 3);
      expect(newsApi.instance.getList).toHaveBeenCalledWith({
        category: "policy",
        limit: 3,
      });
      expect(newsApi.instance.getList).toHaveBeenCalledOnce();

      // Second call
      await getNewsByCategoryWithCache("policy", 3);
      expect(newsApi.instance.getList).toHaveBeenCalledOnce(); // Should not be called again
    });
  });
});
