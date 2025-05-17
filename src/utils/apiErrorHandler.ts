import { message } from "ant-design-vue";
import router from "../router";
import { useUserStore } from "../stores/user";

// 保存 store 实例
let userStore: ReturnType<typeof useUserStore>;

// 初始化 store
const initStore = () => {
  if (!userStore) {
    userStore = useUserStore();
  }
  return userStore;
};

export const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    const errorMessage = data?.message || "请求失败";

    switch (status) {
      case 400:
        message.error(errorMessage);
        break;
      case 401:
        // 未授权，清除用户信息并重定向到登录页
        const store = initStore();
        store.logout();
        router.push("/admin/login");
        break;
      case 403:
        message.error("没有权限执行此操作");
        break;
      case 404:
        message.error("请求的资源不存在");
        break;
      case 422:
        // 验证错误
        if (data.errors) {
          Object.values(data.errors).forEach((error: any) => {
            message.error(error);
          });
        } else {
          message.error(errorMessage);
        }
        break;
      case 500:
        message.error("服务器错误，请稍后重试");
        break;
      default:
        message.error(errorMessage);
    }
  } else if (error.request) {
    message.error("无法连接到服务器，请检查网络连接");
  } else {
    message.error("请求出错，请重试");
  }

  return Promise.reject(error);
};
