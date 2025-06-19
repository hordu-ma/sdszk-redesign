// test-api-endpoint.js - 测试API端点
import fetch from "node-fetch";

async function testLoginAPI() {
  try {
    const url = "http://horsduroot.com/api/auth/login";
    const payload = {
      username: "admin",
      password: "admin123",
    };

    console.log(`测试登录API: ${url}`);
    console.log("请求体:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`\n响应状态: ${response.status} ${response.statusText}`);
    console.log("响应头:");
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const responseText = await response.text();
    console.log("\n响应体:");
    console.log(responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log("\n解析的JSON:");
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log("响应不是有效的JSON格式");
    }
  } catch (error) {
    console.error("API测试失败:", error);
  }
}

testLoginAPI();
