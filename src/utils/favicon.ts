// favicon.ts - 动态更新网页favicon的工具函数

/**
 * 动态更新网页的favicon图标
 * @param iconUrl 图标URL，可以是base64、相对路径或绝对URL
 * @param type 图标类型，默认为image/png
 */
export function updateFavicon(
  iconUrl: string,
  type: string = "image/png",
): void {
  try {
    // 移除现有的favicon链接
    const existingLinks = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"]',
    );
    existingLinks.forEach((link) => link.remove());

    // 创建新的favicon链接元素
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = type;
    link.href = iconUrl;

    // 添加到head中
    document.head.appendChild(link);

    console.log("Favicon updated successfully:", iconUrl);
  } catch (error) {
    console.error("Failed to update favicon:", error);
  }
}

/**
 * 设置默认favicon
 * @param defaultPath 默认图标路径
 */
export function setDefaultFavicon(defaultPath: string = "/favicon.png"): void {
  updateFavicon(defaultPath);
}

/**
 * 从系统设置中获取并应用favicon
 * @param settingsApi 设置API实例
 */
export async function applyFaviconFromSettings(
  settingsApi: any,
): Promise<void> {
  try {
    // 使用静默错误处理，避免在未登录时影响用户体验
    const response = await settingsApi.getAllSettings({
      redirectOnAuth: false,
      showNotification: false,
    });

    if (response.success && response.data?.general) {
      // 查找siteLogo设置
      const logoSetting = response.data.general.find(
        (setting: any) => setting.key === "siteLogo",
      );

      if (logoSetting?.value && logoSetting.value.trim() !== "") {
        // 如果是base64格式
        if (logoSetting.value.startsWith("data:image/")) {
          updateFavicon(logoSetting.value);
        }
        // 如果是URL路径
        else if (
          logoSetting.value.startsWith("http") ||
          logoSetting.value.startsWith("/")
        ) {
          updateFavicon(logoSetting.value);
        } else {
          // 作为相对路径处理
          updateFavicon(`/${logoSetting.value}`);
        }
      } else {
        // 没有设置logo时使用默认图标
        setDefaultFavicon();
      }
    } else {
      // 如果设置为空或无效，使用默认favicon
      setDefaultFavicon();
    }
  } catch (error: any) {
    // 如果是认证错误（401），静默处理
    if (error?.status === 401) {
      console.debug("favicon设置需要登录权限，使用默认图标");
    } else {
      console.warn("应用favicon设置失败:", error?.message || error);
    }
    setDefaultFavicon();
  }
}

/**
 * 初始化favicon设置
 * 在应用启动时调用，从系统设置中加载favicon
 */
export function initFavicon(): void {
  // 这个函数会在应用初始化时被调用
  // 延迟执行以确保API已经准备好
  setTimeout(async () => {
    try {
      // 动态导入settingsApi以避免循环依赖
      const { settingsApi } = await import("@/api");
      await applyFaviconFromSettings(settingsApi.instance);
    } catch (error: any) {
      // 初始化失败时静默使用默认图标，不影响用户体验
      if (error?.status !== 401) {
        console.warn("初始化favicon失败:", error);
      }
      setDefaultFavicon();
    }
  }, 1000);
}

/**
 * 监听系统设置变化并更新favicon
 * 当用户在设置页面更新logo时调用
 * @param newLogoValue 新的logo值
 */
export function onLogoSettingChange(newLogoValue: string): void {
  if (newLogoValue && newLogoValue.trim() !== "") {
    updateFavicon(newLogoValue);
  } else {
    setDefaultFavicon();
  }
}
