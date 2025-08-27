import { App } from "vue";
import permissionDirective from "./permission";
import hasPermissionComponent from "../components/common/HasPermission.vue";

export default {
  install(app: App) {
    // 注册 v-permission 指令
    app.directive("permission", permissionDirective);

    // 注册 HasPermission 组件
    app.component("HasPermission", hasPermissionComponent);
  },
};
