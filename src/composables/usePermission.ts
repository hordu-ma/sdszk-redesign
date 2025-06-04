import { computed } from 'vue'
import { useUserStore } from '../stores/user'

export function usePermission() {
  const userStore = useUserStore()

  // 检查单个权限
  const hasPermission = (permission: string) => {
    return userStore.hasPermission(permission)
  }

  // 检查多个权限（全部满足）
  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(permission => userStore.hasPermission(permission))
  }

  // 检查多个权限（满足其中之一）
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => userStore.hasPermission(permission))
  }

  // 是否为管理员
  const isAdmin = computed(() => userStore.isAdmin)

  // 是否为编辑者
  const isEditor = computed(() => userStore.isEditor)

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
    isEditor,
  }
}
