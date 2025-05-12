/**
 * API测试脚本
 *
 * 用于测试已实现的API端点
 * 执行方式：node test-api.js
 */

import fetch from "node-fetch";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 基本设置
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
let token = "";

// 测试结果统计
const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

// 工具函数
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  line: () => console.log("-".repeat(60)),
};

// 测试工具
const test = async (name, testFn) => {
  log.info(`测试: ${name}`);
  try {
    await testFn();
    stats.passed++;
    log.success(`${name} 测试通过`);
  } catch (error) {
    stats.failed++;
    log.error(`${name} 测试失败: ${error.message}`);
    console.error(error);
  }
  log.line();
};

// API调用帮助函数
const api = {
  get: async (endpoint, authenticated = false) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authenticated && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`API请求失败 GET ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },

  post: async (endpoint, data = {}, authenticated = false) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authenticated && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API请求失败 POST ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },

  patch: async (endpoint, data = {}, authenticated = true) => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authenticated && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API请求失败 PATCH ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },

  delete: async (endpoint, authenticated = true) => {
    const headers = {};

    if (authenticated && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API请求失败 DELETE ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },
};

// 身份验证测试
const testAuth = async () => {
  await test("用户登录", async () => {
    const credentials = {
      username: "admin",
      password: "admin123",
    };

    const data = await api.post("/auth/login", credentials);
    console.log("登录响应:", JSON.stringify(data, null, 2));
    token = data.token;

    if (!token) {
      throw new Error("未能获取身份验证令牌");
    }
  });
};

// 新闻API测试
const testNewsAPI = async () => {
  await test("获取新闻列表", async () => {
    const data = await api.get("/news");
    console.log("新闻列表:", data.data ? data.data.length : 0, "条记录");
  });

  await test("获取新闻详情", async () => {
    const list = await api.get("/news");
    if (!list.data || list.data.length === 0) {
      stats.skipped++;
      log.warn("没有新闻数据，跳过测试");
      return;
    }

    const firstNewsId = list.data[0]._id;
    const detail = await api.get(`/news/${firstNewsId}`);
    console.log("新闻标题:", detail.title);
  });
};

// 资源API测试
const testResourcesAPI = async () => {
  await test("获取资源列表", async () => {
    const data = await api.get("/resources");
    console.log("资源列表:", JSON.stringify(data, null, 2));
  });

  await test("创建新资源", async () => {
    const newResource = {
      title: "测试资源",
      description: "这是一个测试资源描述",
      category: "教学资源",
      fileType: "pdf",
      fileUrl: "/uploads/test.pdf",
      fileSize: 1024,
    };

    const data = await api.post("/resources", newResource, true);
    console.log("新资源创建:", JSON.stringify(data, null, 2));
  });
};

// 活动API测试
const testActivitiesAPI = async () => {
  await test("获取活动列表", async () => {
    const data = await api.get("/activities");
    console.log("活动列表:", JSON.stringify(data, null, 2));
  });

  await test("获取即将开始的活动", async () => {
    const data = await api.get("/activities/upcoming");
    console.log("即将开始的活动:", JSON.stringify(data, null, 2));
  });
};

// 站点设置API测试
const testSettingsAPI = async () => {
  await test("获取公开设置", async () => {
    const data = await api.get("/settings/public");
    console.log("公开设置:", JSON.stringify(data, null, 2));
  });

  await test("获取所有设置(需要登录)", async () => {
    const data = await api.get("/settings", true);
    console.log("所有设置:", Object.keys(data.data || {}).length, "个组");
  });
};

// 活动日志API测试
const testLogsAPI = async () => {
  await test("获取活动日志(需要管理员)", async () => {
    const data = await api.get("/logs", true);
    console.log("活动日志:", JSON.stringify(data, null, 2));
  });
};

// 运行所有测试
async function runTests() {
  log.info("开始API测试...");
  log.line();

  await testAuth();
  await testNewsAPI();
  await testResourcesAPI();
  await testActivitiesAPI();
  await testSettingsAPI();
  await testLogsAPI();

  log.line();
  log.info(
    `测试完成: 通过 ${stats.passed}, 失败 ${stats.failed}, 跳过 ${stats.skipped}`
  );
}

runTests();
