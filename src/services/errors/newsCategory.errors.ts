// 分类管理相关错误类型定义
export class NewsCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsCategoryError";
  }
}

export class CoreCategoryError extends NewsCategoryError {
  constructor(message = "不能修改核心分类") {
    super(message);
    this.name = "CoreCategoryError";
  }
}

export class DuplicateCategoryError extends NewsCategoryError {
  constructor(key: string) {
    super(`分类标识符 "${key}" 已存在`);
    this.name = "DuplicateCategoryError";
  }
}

export class CategoryNotFoundError extends NewsCategoryError {
  constructor(id: string) {
    super(`找不到ID为 "${id}" 的分类`);
    this.name = "CategoryNotFoundError";
  }
}

export class InvalidCategoryDataError extends NewsCategoryError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCategoryDataError";
  }
}
