import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia } from "pinia";
import { useResourceStore } from "../../../src/stores/resource";
import { createTestPinia } from "../../setup";
import { ResourceService } from "../../../src/services/resource.service";

// Mock the service module. This will be hoisted.
vi.mock("../../../src/services/resource.service");

describe("useResourceStore", () => {
  let store: ReturnType<typeof useResourceStore>;
  let mockServiceInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createTestPinia());

    // Create a fresh mock implementation for each test run
    mockServiceInstance = {
      getList: vi.fn(),
      getDetail: vi.fn(),
      upload: vi.fn(),
      download: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      batchDelete: vi.fn(),
      batchUpdateStatus: vi.fn(),
      updateTags: vi.fn(),
      getComments: vi.fn(),
      addComment: vi.fn(),
      deleteComment: vi.fn(),
      share: vi.fn(),
    };
    vi.mocked(ResourceService).mockImplementation(() => mockServiceInstance);

    // Create the store *after* the mock implementation is set
    store = useResourceStore();
  });

  describe("初始状态", () => {
    it("应该初始化时没有资源数据", () => {
      expect(store.loading).toBe(false);
      expect(store.items).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.page).toBe(1);
      expect(store.limit).toBe(10);
      expect(store.currentResource).toBeNull();
      expect(store.selectedResources).toEqual([]);
    });
  });

  describe("获取资源列表", () => {
    it("应该成功获取资源列表", async () => {
      const mockData = [{ id: "1", name: "Resource 1" }];
      const mockResponse = {
        data: mockData,
        pagination: { total: 1, page: 1, limit: 10 },
      };
      mockServiceInstance.getList.mockResolvedValue(mockResponse);

      await store.fetchList();

      expect(store.items).toEqual(mockData);
      expect(store.total).toBe(1);
      expect(store.loading).toBe(false);
      expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
    });

    it("获取列表失败时应该抛出错误", async () => {
      const apiError = new Error("API Error");
      mockServiceInstance.getList.mockRejectedValue(apiError);

      await expect(store.fetchList()).rejects.toThrow(apiError);
      expect(store.loading).toBe(false);
    });
  });

  describe("获取资源详情", () => {
    it("应该成功获取资源详情", async () => {
      const mockResource = { id: "1", name: "Test Resource" };
      mockServiceInstance.getDetail.mockResolvedValue({ data: mockResource });

      const result = await store.fetchById("1");

      expect(result).toEqual(mockResource);
      expect(store.currentResource).toEqual(mockResource);
      expect(mockServiceInstance.getDetail).toHaveBeenCalledWith("1");
    });
  });

  describe("删除资源", () => {
    it("应该成功删除单个资源并刷新列表", async () => {
      mockServiceInstance.delete.mockResolvedValue({ success: true });
      mockServiceInstance.getList.mockResolvedValue({
        data: [],
        pagination: { total: 0 },
      });

      await store.remove("1");

      expect(mockServiceInstance.delete).toHaveBeenCalledWith("1");
      expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
    });

    it("应该成功批量删除资源并刷新列表", async () => {
      const ids = ["1", "2"];
      mockServiceInstance.batchDelete.mockResolvedValue({ success: true });
      mockServiceInstance.getList.mockResolvedValue({
        data: [],
        pagination: { total: 0 },
      });

      await store.batchDelete(ids);

      expect(store.selectedResources).toEqual([]);
      expect(mockServiceInstance.batchDelete).toHaveBeenCalledWith(ids);
      expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
    });
  });

  describe("评论管理", () => {
    it("应该成功获取评论", async () => {
      const mockComments = [{ id: "c1", content: "Great!" }];
      mockServiceInstance.getComments.mockResolvedValue({ data: mockComments });

      const result = await store.getComments("1");

      expect(result.data).toEqual(mockComments);
      expect(mockServiceInstance.getComments).toHaveBeenCalledWith(
        "1",
        undefined,
      );
    });

    it("应该成功添加评论", async () => {
      const commentData = { content: "New comment" };
      const mockResponse = { id: "c2", ...commentData };
      mockServiceInstance.addComment.mockResolvedValue({ data: mockResponse });

      const result = await store.addComment("1", commentData);

      expect(result.data).toEqual(mockResponse);
      expect(mockServiceInstance.addComment).toHaveBeenCalledWith(
        "1",
        commentData,
      );
    });

    it("应该成功删除评论", async () => {
      mockServiceInstance.deleteComment.mockResolvedValue({ success: true });

      await store.deleteComment("res1", "comment1");

      expect(mockServiceInstance.deleteComment).toHaveBeenCalledWith(
        "res1",
        "comment1",
      );
    });
  });
});
