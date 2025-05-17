import { type Directive, type DirectiveBinding } from "vue";
import { useUserStore } from "../stores/user";

type PermissionValue = string | string[];

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const userStore = useUserStore();
    const { value } = binding;

    if (typeof value === "string") {
      if (!userStore.hasPermission(value)) {
        el.parentNode?.removeChild(el);
      }
    } else if (Array.isArray(value)) {
      const hasPermission = value.some((permission) =>
        userStore.hasPermission(permission)
      );
      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    }
  },
} as Directive<HTMLElement, PermissionValue>;
