// 评论类型定义
export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    name: string
    avatar?: string
  }
  parentComment?: string
}
