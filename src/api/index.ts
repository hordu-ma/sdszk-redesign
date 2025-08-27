import { NewsApi } from "./modules/news/index";
import { NewsCategoryApi } from "./modules/newsCategory/index";
import { ResourceApi } from "./modules/resources/index";
import { ResourceCategoryApi } from "./modules/resourceCategory/index";
import { SettingsApi } from "./modules/settings";

// 懒加载API实例，避免循环依赖
let _newsApi: NewsApi | null = null;
let _newsCategoryApi: NewsCategoryApi | null = null;
let _resourceApi: ResourceApi | null = null;
let _resourceCategoryApi: ResourceCategoryApi | null = null;
let _settingsApi: SettingsApi | null = null;

export const newsApi = {
  get instance() {
    if (!_newsApi) _newsApi = new NewsApi();
    return _newsApi;
  },
};

export const newsCategoryApi = {
  get instance() {
    if (!_newsCategoryApi) _newsCategoryApi = new NewsCategoryApi();
    return _newsCategoryApi;
  },
};

export const resourceApi = {
  get instance() {
    if (!_resourceApi) _resourceApi = new ResourceApi();
    return _resourceApi;
  },
};

export const resourceCategoryApi = {
  get instance() {
    if (!_resourceCategoryApi) _resourceCategoryApi = new ResourceCategoryApi();
    return _resourceCategoryApi;
  },
};

export const settingsApi = {
  get instance() {
    if (!_settingsApi) _settingsApi = new SettingsApi();
    return _settingsApi;
  },
};

// 导出类型
export type * from "./types";
export type * from "./modules/news/index";
export type * from "./modules/newsCategory/index";
export type * from "./modules/resources/index";
export type * from "./modules/resourceCategory/index";
export type * from "./modules/settings";
