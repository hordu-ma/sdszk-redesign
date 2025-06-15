import { NewsApi } from "./modules/news/index";
import { NewsCategoryApi } from "./modules/newsCategory/index";
import { ResourceApi } from "./modules/resources/index";
import { ResourceCategoryApi } from "./modules/resourceCategory/index";
import { SettingsApi } from "./modules/settings";

// API 实例
export const newsApi = new NewsApi();
export const newsCategoryApi = new NewsCategoryApi();
export const resourceApi = new ResourceApi();
export const resourceCategoryApi = new ResourceCategoryApi();
export const settingsApi = new SettingsApi();

// 导出类型
export type * from "./types";
export type * from "./modules/news/index";
export type * from "./modules/newsCategory/index";
export type * from "./modules/resources/index";
export type * from "./modules/resourceCategory/index";
export type * from "./modules/settings";
