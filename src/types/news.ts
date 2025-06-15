import type { ApiResponse, PaginatedResponse } from "@/api/types";

export interface NewsSource {
  name?: string;
  url?: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  cover?: string;
  author?: string | { username?: string; name?: string; [key: string]: any };
  category?: string;
  source?: NewsSource;
  tags?: string[];
  publishDate?: string;
  status: "draft" | "published" | "archived";
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  _id?: string; // 兼容字段
}

export interface NewsCategory {
  _id: string;
  name: string;
  key: string;
  description: string;
  order: number;
  color: string;
  icon?: string;
  isActive: boolean;
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewsResponse = ApiResponse<News>;
export type NewsListResponse = PaginatedResponse<News>;
export type NewsCategoryResponse = ApiResponse<NewsCategory>;
export type NewsCategoryListResponse = PaginatedResponse<NewsCategory>;
