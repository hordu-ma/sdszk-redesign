import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia } from "pinia";
import { useNewsStore } from "../../../src/stores/news";
import { createTestPinia } from "../../setup";
import { NewsService } from "../../../src/services/news.service";

// Mock the service module. This will be hoisted.
vi.mock("../../../src/services/news.service");

describe("useNewsStore", () => {
  let store: ReturnType<typeof useNewsStore>;
  let mockServiceInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createTestPinia());

    // Create a fresh mock implementation for each test run
    mockServiceInstance = {
      getList: vi.fn(),
      getDetail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateStatus: vi.fn(),
      getCategories: vi.fn(),
      getTags: vi.fn(),
    };
    vi.mocked(NewsService).mockImplementation(() => mockServiceInstance);

    // Create the store *after* the mock implementation is set
    store = useNewsStore();
  });

  it("应该成功获取新闻列表", async () => {
    const mockData = [{ id: "1", title: "News 1" }];
    const mockResponse = {
      data: mockData,
      pagination: { total: 1, page: 1, limit: 10 },
    };
    mockServiceInstance.getList.mockResolvedValue(mockResponse);

    await store.fetchList();

    expect(store.items).toEqual(mockData);
    expect(store.total).toBe(1);
    expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
  });

  it("应该成功获取新闻详情", async () => {
    const mockNews = { id: "1", title: "Test News" };
    mockServiceInstance.getDetail.mockResolvedValue({ data: mockNews });

    const result = await store.fetchById("1");

    expect(result).toEqual(mockNews);
    expect(store.currentNews).toEqual(mockNews);
    expect(store.recentlyViewed[0]).toEqual(mockNews);
  });

  it("应该成功创建新闻并刷新列表", async () => {
    const newNews = { title: "New Article" };
    const mockResponse = { data: { id: "2", ...newNews } };
    mockServiceInstance.create.mockResolvedValue(mockResponse);
    mockServiceInstance.getList.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
    });

    const result = await store.create(newNews as any);

    expect(result).toEqual(mockResponse);
    expect(mockServiceInstance.create).toHaveBeenCalledWith(newNews);
    expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
  });

  it("应该成功更新新闻并刷新列表", async () => {
    const updatedNews = { title: "Updated Article" };
    const mockResponse = { data: { id: "1", ...updatedNews } };
    mockServiceInstance.update.mockResolvedValue(mockResponse);
    mockServiceInstance.getList.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
    });

    const result = await store.update("1", updatedNews as any);

    expect(result).toEqual(mockResponse);
    expect(mockServiceInstance.update).toHaveBeenCalledWith("1", updatedNews);
    expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
  });

  it("应该成功删除新闻并刷新列表", async () => {
    mockServiceInstance.delete.mockResolvedValue({ success: true });
    mockServiceInstance.getList.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
    });

    await store.remove("1");

    expect(mockServiceInstance.delete).toHaveBeenCalledWith("1");
    expect(mockServiceInstance.getList).toHaveBeenCalledOnce();
  });

  it("应该成功获取分类", async () => {
    const mockCategories = ["Tech", "Sports"];
    mockServiceInstance.getCategories.mockResolvedValue({
      data: mockCategories,
    });

    const result = await store.fetchCategories();

    expect(result).toEqual(mockCategories);
    expect(store.categories).toEqual(mockCategories);
  });
});
