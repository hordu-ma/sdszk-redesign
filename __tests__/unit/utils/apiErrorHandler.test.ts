import { describe, it, expect, vi, beforeEach } from "vitest";
import { message, notification } from "ant-design-vue";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import {
  ApiError,
  handleApiError,
  ErrorUtils,
} from "../../../src/utils/apiErrorHandler";
import { ERROR_CODES, STATUS_CODES } from "../../../src/config";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../../src/types/error.types";

// Mock dependencies
vi.mock("ant-design-vue", () => ({
  message: {
    error: vi.fn(),
    warning: vi.fn(),
  },
  notification: {
    error: vi.fn(),
  },
}));

vi.mock("@/router", () => ({
  default: {
    push: vi.fn(),
  },
}));

const mockUserStore = {
  isAuthenticated: false,
  logout: vi.fn().mockResolvedValue(undefined),
  initUserInfo: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

describe("apiErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    mockUserStore.isAuthenticated = false;
    mockUserStore.logout.mockClear();
    mockUserStore.initUserInfo.mockClear();
  });

  describe("ApiError Class", () => {
    it("should create an instance with correct properties", () => {
      const error = new ApiError("Test Message", "TEST_CODE", 400);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe("Test Message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.status).toBe(400);
      expect(error.name).toBe("ApiError");
    });

    it("getFormattedMessage should include validation errors if they exist", () => {
      const validationErrors = { email: ["Invalid email format"] };
      const error = new ApiError("Validation Failed", "VALIDATION_ERROR", 422, {
        errors: validationErrors,
      });
      const expectedMessage = "Validation Failed\nemail: Invalid email format";
      expect(error.getFormattedMessage()).toBe(expectedMessage);
    });

    it("is() should correctly check the error code", () => {
      const error = new ApiError("Test", ERROR_CODES.INVALID_TOKEN, 401);
      expect(error.is(ERROR_CODES.INVALID_TOKEN)).toBe(true);
      expect(error.is(ERROR_CODES.SERVER_ERROR)).toBe(false);
    });

    it("isAuthError should return true for authorization errors", () => {
      const error1 = new ApiError(
        "Unauthorized",
        "ANY_CODE",
        STATUS_CODES.UNAUTHORIZED,
      );
      const error2 = new ApiError("Expired", ERROR_CODES.AUTH_EXPIRED, 500);
      const error3 = new ApiError("Invalid", ERROR_CODES.INVALID_TOKEN, 500);
      const error4 = new ApiError("Other", "OTHER_CODE", 500);

      expect(error1.isAuthError()).toBe(true);
      expect(error2.isAuthError()).toBe(true);
      expect(error3.isAuthError()).toBe(true);
      expect(error4.isAuthError()).toBe(false);
    });

    it("isPermissionError should return true for permission errors", () => {
      const error1 = new ApiError(
        "Forbidden",
        "ANY_CODE",
        STATUS_CODES.FORBIDDEN,
      );
      const error2 = new ApiError("Denied", ERROR_CODES.PERMISSION_DENIED, 500);
      const error3 = new ApiError("Other", "OTHER_CODE", 500);

      expect(error1.isPermissionError()).toBe(true);
      expect(error2.isPermissionError()).toBe(true);
      expect(error3.isPermissionError()).toBe(false);
    });

    it("isValidationError should return true for validation errors", () => {
      const error1 = new ApiError(
        "Bad Request",
        "ANY_CODE",
        STATUS_CODES.BAD_REQUEST,
      );
      const error2 = new ApiError(
        "Validation",
        ERROR_CODES.VALIDATION_ERROR,
        500,
      );
      const error3 = new ApiError("Other", "OTHER_CODE", 500);

      expect(error1.isValidationError()).toBe(true);
      expect(error2.isValidationError()).toBe(true);
      expect(error3.isValidationError()).toBe(false);
    });

    it("isNetworkError should return true for network errors", () => {
      const error = new ApiError("Network", ERROR_CODES.NETWORK_ERROR, 0);
      expect(error.isNetworkError()).toBe(true);
    });
  });

  describe("ErrorUtils", () => {
    it("isApiError should correctly identify ApiError instances", () => {
      const apiError = new ApiError("Test", "CODE", 500);
      const genericError = new Error("Generic");
      expect(ErrorUtils.isApiError(apiError)).toBe(true);
      expect(ErrorUtils.isApiError(genericError)).toBe(false);
      expect(ErrorUtils.isApiError({})).toBe(false);
    });

    it("createError should return a new ApiError instance", () => {
      const error = ErrorUtils.createError("New Error", "NEW_CODE", 503);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe("New Error");
      expect(error.code).toBe("NEW_CODE");
      expect(error.status).toBe(503);
    });
  });

  describe("handleApiError", () => {
    it("should handle 401 Unauthorized error, call logout, and redirect", async () => {
      // Arrange
      const axiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 401",
        response: {
          status: STATUS_CODES.UNAUTHORIZED,
          statusText: "Unauthorized",
          headers: {},
          config: {} as any,
          data: {
            message: "Token expired",
            code: ERROR_CODES.AUTH_EXPIRED,
          },
        },
        toJSON: () => ({}),
      } as AxiosError<ApiErrorResponse>;

      // Act
      try {
        await handleApiError(axiosError);
      } catch (error: any) {
        // Assert
        expect(error).toBeInstanceOf(ApiError);
        expect(error.isAuthError()).toBe(true);
      }

      expect(mockUserStore.logout).toHaveBeenCalledOnce();
      expect(message.error).toHaveBeenCalledWith("Token expired");
      expect(router.push).toHaveBeenCalledWith("/admin/login");
    });

    it("should handle 403 Forbidden error and redirect", async () => {
      // Arrange
      const axiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 403",
        response: {
          status: STATUS_CODES.FORBIDDEN,
          statusText: "Forbidden",
          headers: {},
          config: {} as any,
          data: {
            message: "Permission denied",
            code: ERROR_CODES.PERMISSION_DENIED,
          },
        },
        toJSON: () => ({}),
      } as AxiosError<ApiErrorResponse>;

      // Act
      try {
        await handleApiError(axiosError);
      } catch (error: any) {
        // Assert
        expect(error.isPermissionError()).toBe(true);
      }

      expect(message.error).toHaveBeenCalledWith("Permission denied");
      expect(router.push).toHaveBeenCalledWith("/admin/403");
    });

    it("should handle 422 Validation error and show messages", async () => {
      // Arrange
      const axiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 400",
        response: {
          status: STATUS_CODES.BAD_REQUEST, // or 422
          statusText: "Bad Request",
          headers: {},
          config: {} as any,
          data: {
            message: "Validation failed",
            code: ERROR_CODES.VALIDATION_ERROR,
            status: STATUS_CODES.BAD_REQUEST,
            errors: {
              email: ["The email must be a valid email address."],
              password: ["The password must be at least 8 characters."],
            },
          },
        },
        toJSON: () => ({}),
      } as AxiosError<ApiErrorResponse>;

      // Act
      try {
        await handleApiError(axiosError);
      } catch (error: any) {
        // Assert
        expect(error.isValidationError()).toBe(true);
      }

      expect(message.error).toHaveBeenCalledWith(
        "The email must be a valid email address.",
      );
      expect(message.error).toHaveBeenCalledWith(
        "The password must be at least 8 characters.",
      );
      expect(notification.error).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });

    it("should handle 500 Server Error and show a notification", async () => {
      // Arrange
      const axiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 500",
        response: {
          status: STATUS_CODES.SERVER_ERROR,
          statusText: "Internal Server Error",
          headers: {},
          config: {} as any,
          data: {
            message: "Something went wrong on the server",
            code: ERROR_CODES.SERVER_ERROR,
            status: STATUS_CODES.SERVER_ERROR,
          },
        },
        toJSON: () => ({}),
      } as AxiosError<ApiErrorResponse>;

      // Act
      try {
        await handleApiError(axiosError);
      } catch (error: any) {
        // Assert
        expect(error.is(ERROR_CODES.SERVER_ERROR)).toBe(true);
      }

      expect(notification.error).toHaveBeenCalledOnce();
      expect(notification.error).toHaveBeenCalledWith({
        message: "请求错误",
        description: "Something went wrong on the server",
        duration: 5,
      });
      expect(message.error).not.toHaveBeenCalled();
    });
  });
});
