// 模拟数据类型定义
interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  avatar: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string;
  publishDate: string;
  isPublished: boolean;
}

// 模拟数据
export const mockUserData = {
  userInfo: {
    id: 1,
    name: "管理员",
    username: "admin",
    role: "admin",
    avatar: "/assets/images/avatar.png",
  },
} as { userInfo: UserInfo };

export const mockNewsData: { list: NewsItem[] } = {
  list: [
    {
      id: 1,
      title: "思政课教学创新研讨会",
      content: "研讨会内容...",
      category: "中心动态",
      publishDate: "2023-06-20",
      isPublished: true,
    },
    // ...其他新闻数据
  ],
};
