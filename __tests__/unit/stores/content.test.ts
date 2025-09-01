import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia } from "pinia";
import { useContentStore } from "../../../src/stores/content";
import api from "../../../src/utils/api";
import { createTestPinia } from "../../setup";

// Mock the api utility
vi.mock("../../../src/utils/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useContentStore", () => {
  let store: ReturnType<typeof useContentStore>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    setActivePinia(createTestPinia());
    store = useContentStore();
  });

  describe("Initial State", () => {
    it("should have correct initial state for all modules", () => {
      // News module
      expect(store.news.loading).toBe(false);
      expect(store.news.items).toEqual([]);
      expect(store.news.total).toBe(0);
      expect(store.news.page).toBe(1);
      expect(store.news.limit).toBe(10);

      // Resources module
      expect(store.resources.loading).toBe(false);
      expect(store.resources.items).toEqual([]);
      expect(store.resources.total).toBe(0);
      expect(store.resources.page).toBe(1);
      expect(store.resources.limit).toBe(10);

      // Activities module
      expect(store.activities.loading).toBe(false);
      expect(store.activities.items).toEqual([]);
      expect(store.activities.total).toBe(0);
      expect(store.activities.page).toBe(1);
      expect(store.activities.limit).toBe(10);

      // Categories and Settings
      expect(store.categories.news).toEqual([]);
      expect(store.categories.resources).toEqual([]);
      expect(store.categories.activities).toEqual([]);
      expect(store.settings).toEqual({});
    });
  });

  describe("Getters", () => {
    it("newsPagination should compute pagination state correctly", () => {
      store.news.page = 2;
      store.news.limit = 20;
      store.news.total = 100;
      const pagination = store.newsPagination;
      expect(pagination.current).toBe(2);
      expect(pagination.pageSize).toBe(20);
      expect(pagination.total).toBe(100);
    });

    it("resourcesPagination should compute pagination state correctly", () => {
      store.resources.page = 3;
      store.resources.limit = 5;
      store.resources.total = 30;
      const pagination = store.resourcesPagination;
      expect(pagination.current).toBe(3);
      expect(pagination.pageSize).toBe(5);
      expect(pagination.total).toBe(30);
    });

    it("activitiesPagination should compute pagination state correctly", () => {
      store.activities.page = 1;
      store.activities.limit = 15;
      store.activities.total = 45;
      const pagination = store.activitiesPagination;
      expect(pagination.current).toBe(1);
      expect(pagination.pageSize).toBe(15);
      expect(pagination.total).toBe(45);
    });
  });

  describe("Actions", () => {
    describe("News Actions", () => {
      it("fetchNews should update state on successful API call", async () => {
        const mockData = [{ id: 1, title: "Test News" }];
        const mockResponse = { data: mockData, total: 1 };
        vi.mocked(api.get).mockResolvedValue(mockResponse);

        await store.fetchNews();

        expect(store.news.loading).toBe(false);
        expect(store.news.items).toEqual(mockData);
        expect(store.news.total).toBe(1);
        expect(api.get).toHaveBeenCalledWith("/news", { params: {} });
      });

      it("fetchNews should handle API error", async () => {
        vi.mocked(api.get).mockRejectedValue(new Error("API Error"));

        await store.fetchNews();

        expect(store.news.loading).toBe(false);
        expect(store.news.items).toEqual([]);
        expect(store.news.total).toBe(0);
      });

      it("createNews should call post and return data", async () => {
        const newsData = { title: "New News" };
        const mockResponse = { data: { id: 2, ...newsData } };
        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const result = await store.createNews(newsData);

        expect(result).toEqual(mockResponse.data);
        expect(api.post).toHaveBeenCalledWith("/news", newsData);
      });

      it("updateNews should call put and return data", async () => {
        const newsData = { title: "Updated News" };
        const mockResponse = { data: { id: 1, ...newsData } };
        vi.mocked(api.put).mockResolvedValue(mockResponse);

        const result = await store.updateNews(1, newsData);

        expect(result).toEqual(mockResponse.data);
        expect(api.put).toHaveBeenCalledWith("/news/1", newsData);
      });

      it("deleteNews should call delete and return true", async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        const result = await store.deleteNews(1);

        expect(result).toBe(true);
        expect(api.delete).toHaveBeenCalledWith("/news/1");
      });
    });

    describe("Resource Actions", () => {
      it("fetchResources should update state on successful API call", async () => {
        const mockData = [{ id: 1, name: "Test Resource" }];
        const mockResponse = { data: mockData, total: 1 };
        vi.mocked(api.get).mockResolvedValue(mockResponse);

        await store.fetchResources();

        expect(store.resources.loading).toBe(false);
        expect(store.resources.items).toEqual(mockData);
        expect(store.resources.total).toBe(1);
        expect(api.get).toHaveBeenCalledWith("/resources", { params: {} });
      });

      it("fetchResources should handle API error", async () => {
        vi.mocked(api.get).mockRejectedValue(new Error("API Error"));

        await store.fetchResources();

        expect(store.resources.loading).toBe(false);
        expect(store.resources.items).toEqual([]);
        expect(store.resources.total).toBe(0);
      });

      it("createResource should call post and return data", async () => {
        const resourceData = { name: "New Resource" };
        const mockResponse = { data: { id: 2, ...resourceData } };
        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const result = await store.createResource(resourceData);

        expect(result).toEqual(mockResponse.data);
        expect(api.post).toHaveBeenCalledWith("/resources", resourceData);
      });

      it("updateResource should call put and return data", async () => {
        const resourceData = { name: "Updated Resource" };
        const mockResponse = { data: { id: 1, ...resourceData } };
        vi.mocked(api.put).mockResolvedValue(mockResponse);

        const result = await store.updateResource(1, resourceData);

        expect(result).toEqual(mockResponse.data);
        expect(api.put).toHaveBeenCalledWith("/resources/1", resourceData);
      });

      it("deleteResource should call delete and return true", async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        const result = await store.deleteResource(1);

        expect(result).toBe(true);
        expect(api.delete).toHaveBeenCalledWith("/resources/1");
      });
    });
  });
});
