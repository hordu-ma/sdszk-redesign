// 测试登录API脚本
import fetch from "node-fetch";

async function testLoginAPI() {
  const apiUrl = "http://horsduroot.com/api/auth/login";

  const loginData = {
    username: "admin",
    password: "admin123",
  };

  try {
    console.log("测试登录API:");
    console.log("URL:", apiUrl);
    console.log("数据:", loginData);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log("\n响应状态:", response.status, response.statusText);
    console.log("响应头:");
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const responseData = await response.text();
    console.log("\n响应内容:");
    try {
      const jsonData = JSON.parse(responseData);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log("非JSON响应:", responseData);
    }
  } catch (error) {
    console.error("请求失败:", error.message);
  }
}

testLoginAPI();
