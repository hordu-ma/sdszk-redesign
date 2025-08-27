export interface ResourceAuthor {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  affiliation?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: ResourceAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  type: "email" | "link" | "wechat";
  recipientEmail?: string;
  message?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: "document" | "video" | "image" | "audio" | "other";
  category?: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  downloadCount?: number;
  viewCount?: number;
  author?: ResourceAuthor;
  authorAffiliation?: string;
  publishDate?: string;
  comments?: Comment[];
  shares?: Share[];
  status: "draft" | "published";
  featured?: boolean;
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
  data?: any;
}
