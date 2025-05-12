// 模拟数据
export const mockUserData = {
  userInfo: {
    id: 1,
    name: "管理员",
    username: "admin",
    role: "admin",
    avatar: "/assets/images/avatar.png",
  },
};

export const mockNewsData = {
  list: [
    {
      id: 1,
      title: "思政课教学创新研讨会",
      content: "研讨会内容...",
      category: "中心动态",
      publishDate: "2023-06-20",
      isPublished: true,
    },
    // ... 更多数据
  ],
};

export const mockResourceData = {
  list: [
    {
      id: 1,
      name: "教学课件",
      type: "document",
      category: "教学资源",
      downloadCount: 156,
    },
    // ... 更多数据
  ],
};

export const mockActivitiesData = {
  list: [
    {
      id: 1,
      title: "2023教学研讨会",
      startDate: "2023-07-01",
      endDate: "2023-07-02",
      status: "upcoming",
    },
    // ... 更多数据
  ],
};

// 模拟API响应
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async login(username, password) {
    await delay(500);
    if (username === "admin" && password === "admin123") {
      return {
        success: true,
        data: mockUserData.userInfo,
      };
    }
    throw new Error("用户名或密码错误");
  },

  async getNewsList() {
    await delay(300);
    return {
      success: true,
      data: mockNewsData.list,
    };
  },

  async getResourceList() {
    await delay(300);
    return {
      success: true,
      data: mockResourceData.list,
    };
  },

  async getActivitiesList() {
    await delay(300);
    return {
      success: true,
      data: mockActivitiesData.list,
    };
  },
};
