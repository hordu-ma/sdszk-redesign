import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import SiteSetting from "../../server/models/SiteSetting.js";
import NewsCategory from "../../server/models/NewsCategory.js";
import { getPublicSettings } from "../../server/controllers/siteSettingController.js";
import { getCategories } from "../../server/controllers/newsCategoryController.js";

// Mock redis client
vi.mock("../../server/config/redis.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    flushall: vi.fn(),
  },
}));

// Mock Express request and response objects
const mockRequest = (params = {}, query = {}, body = {}, user = {}) => ({
  params,
  query,
  body,
  user,
});

const mockResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe("SiteSettingController", () => {
  let mongoServer;

  beforeAll(async () => {
    // 启动内存中的MongoDB服务器
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 连接到测试数据库
    await mongoose.connect(mongoUri);

    // 初始化一些测试数据
    await SiteSetting.create([
      {
        key: "siteName",
        value: "Test Site",
        group: "general",
        type: "text",
      },
      {
        key: "primaryColor",
        value: "#ff0000",
        group: "appearance",
        type: "color",
      },
    ]);
  });

  afterAll(async () => {
    // 断开数据库连接并停止MongoDB服务器
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it.skip("应该能够获取公开的站点设置", async () => {
    const req = mockRequest();
    const res = mockResponse();

    await getPublicSettings(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: expect.objectContaining({
          siteName: "Test Site",
          primaryColor: "#ff0000",
        }),
      }),
    );
  });
});

describe("NewsCategoryController", () => {
  let mongoServer;

  beforeAll(async () => {
    // 启动内存中的MongoDB服务器
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 连接到测试数据库
    await mongoose.connect(mongoUri);

    // 初始化一些测试数据
    await NewsCategory.create([
      {
        name: "Test Category 1",
        key: "test1",
        order: 1,
        isCore: false,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        name: "Test Category 2",
        key: "test2",
        order: 2,
        isCore: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
    ]);
  });

  afterAll(async () => {
    // 断开数据库连接并停止MongoDB服务器
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it.skip("应该能够获取所有新闻分类", async () => {
    const req = mockRequest();
    const res = mockResponse();

    await getCategories(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: expect.arrayContaining([
          expect.objectContaining({
            name: "Test Category 1",
            key: "test1",
          }),
          expect.objectContaining({
            name: "Test Category 2",
            key: "test2",
            isCore: true,
          }),
        ]),
      }),
    );
  });
});
