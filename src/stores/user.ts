import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { DefineStoreOptionsBase } from "pinia";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface UserState {
  user: Ref<UserData | null>;
  isAuthenticated: Ref<boolean>;
}

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<UserData | null>(null);
    const isAuthenticated = ref(false);

    // 登录
    function login(userData: UserData) {
      user.value = userData;
      isAuthenticated.value = true;
    }

    // 登出
    function logout() {
      user.value = null;
      isAuthenticated.value = false;
    }

    // 检查认证状态
    function checkAuth() {
      return isAuthenticated.value;
    }

    return {
      user,
      isAuthenticated,
      login,
      logout,
      checkAuth,
    };
  },
  {
    persist: true,
  }
);
