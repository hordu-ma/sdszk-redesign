// verificationService.js - 验证码服务
import { log } from "../utils/logger.js";

/**
 * 验证码服务
 * 管理手机验证码的生成、存储、验证和防刷机制
 */
class VerificationService {
  constructor() {
    // 使用内存存储验证码（开发环境）
    // 生产环境应该使用Redis
    this.verificationCodes = new Map(); // phone -> { code, expires, lastSent }
    this.EXPIRY_TIME = 5 * 60 * 1000; // 5分钟过期
    this.RATE_LIMIT = 60 * 1000; // 60秒内只能发送一次
  }

  /**
   * 生成6位随机数字验证码
   * @returns {string} 验证码
   */
  generateCode() {
    return Math.random().toString().slice(-6).padStart(6, "0");
  }

  /**
   * 检查手机号发送频率限制
   * @param {string} phone 手机号
   * @returns {boolean} 是否可以发送
   */
  canSendCode(phone) {
    const record = this.verificationCodes.get(phone);
    if (!record) return true;

    const now = Date.now();
    const timeSinceLastSent = now - (record.lastSent || 0);

    return timeSinceLastSent >= this.RATE_LIMIT;
  }

  /**
   * 获取剩余等待时间（秒）
   * @param {string} phone 手机号
   * @returns {number} 剩余等待时间
   */
  getRemainingWaitTime(phone) {
    const record = this.verificationCodes.get(phone);
    if (!record) return 0;

    const now = Date.now();
    const timeSinceLastSent = now - (record.lastSent || 0);
    const remainingTime = this.RATE_LIMIT - timeSinceLastSent;

    return remainingTime > 0 ? Math.ceil(remainingTime / 1000) : 0;
  }

  /**
   * 发送验证码
   * @param {string} phone 手机号
   * @returns {Promise<{success: boolean, message: string, waitTime?: number}>}
   */
  async sendVerificationCode(phone) {
    try {
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return {
          success: false,
          message: "手机号格式不正确",
        };
      }

      // 检查发送频率限制
      if (!this.canSendCode(phone)) {
        const waitTime = this.getRemainingWaitTime(phone);
        return {
          success: false,
          message: `请等待 ${waitTime} 秒后重试`,
          waitTime,
        };
      }

      // 生成验证码
      const code = this.generateCode();
      const now = Date.now();
      const expires = now + this.EXPIRY_TIME;

      // 存储验证码
      this.verificationCodes.set(phone, {
        code,
        expires,
        lastSent: now,
      });

      // 模拟短信发送（开发环境）
      await this.mockSendSMS(phone, code);

      log.info("验证码发送成功", {
        phone: this.maskPhone(phone),
        code: process.env.NODE_ENV === "development" ? code : "******",
      });

      return {
        success: true,
        message: "验证码发送成功",
        // 开发环境返回验证码便于测试
        ...(process.env.NODE_ENV === "development" && { code }),
      };
    } catch (error) {
      log.error("验证码发送异常", {
        error: error.message,
        context: "sendVerificationCode",
        phone: this.maskPhone(phone),
      });
      return {
        success: false,
        message: "验证码发送失败，请稍后重试",
      };
    }
  }

  /**
   * 验证验证码
   * @param {string} phone 手机号
   * @param {string} inputCode 用户输入的验证码
   * @returns {boolean} 验证是否通过
   */
  verifyCode(phone, inputCode) {
    try {
      const record = this.verificationCodes.get(phone);

      if (!record) {
        log.info("验证码验证失败：未找到验证码记录", {
          phone: this.maskPhone(phone),
        });
        return false;
      }

      const now = Date.now();

      // 检查是否过期
      if (now > record.expires) {
        this.verificationCodes.delete(phone);
        log.info("验证码验证失败：验证码已过期", {
          phone: this.maskPhone(phone),
        });
        return false;
      }

      // 验证码比对
      const isValid = record.code === inputCode;

      if (isValid) {
        // 验证成功后删除验证码
        this.verificationCodes.delete(phone);
        log.info("验证码验证成功", { phone: this.maskPhone(phone) });
      } else {
        log.info("验证码验证失败：验证码不正确", {
          phone: this.maskPhone(phone),
          inputCode: inputCode.replace(/./g, "*"),
        });
      }

      return isValid;
    } catch (error) {
      log.error("验证码验证异常", {
        error: error.message,
        context: "verifyCode",
        phone: this.maskPhone(phone),
      });
      return false;
    }
  }

  /**
   * 清理过期的验证码记录
   */
  cleanupExpiredCodes() {
    const now = Date.now();
    const expiredPhones = [];

    for (const [phone, record] of this.verificationCodes) {
      if (now > record.expires) {
        expiredPhones.push(phone);
      }
    }

    expiredPhones.forEach((phone) => {
      this.verificationCodes.delete(phone);
    });

    if (expiredPhones.length > 0) {
      log.info(`清理了 ${expiredPhones.length} 条过期验证码记录`);
    }
  }

  /**
   * 模拟短信发送（开发环境）
   * @private
   * @param {string} phone 手机号
   * @param {string} code 验证码
   */
  async mockSendSMS(phone, code) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    log.info("模拟短信发送", {
      phone: this.maskPhone(phone),
      message: `【思政课中心】您的验证码是：${code}，5分钟内有效。请勿泄露给他人。`,
      provider: "mock_sms_service",
    });

    // 在开发环境中，将验证码也记录到控制台便于调试
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 验证码发送到 ${this.maskPhone(phone)}: ${code}\n`);
    }
  }

  /**
   * 掩码手机号（隐私保护）
   * @private
   * @param {string} phone 手机号
   * @returns {string} 掩码后的手机号
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }

  /**
   * 获取服务状态
   * @returns {object} 服务状态信息
   */
  getStatus() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    for (const [, record] of this.verificationCodes) {
      if (now > record.expires) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      totalRecords: this.verificationCodes.size,
      activeRecords: activeCount,
      expiredRecords: expiredCount,
      rateLimit: `${this.RATE_LIMIT / 1000}秒`,
      expiryTime: `${this.EXPIRY_TIME / 1000 / 60}分钟`,
    };
  }
}

// 创建单例实例
const verificationService = new VerificationService();

// 定期清理过期验证码（每10分钟）
setInterval(
  () => {
    verificationService.cleanupExpiredCodes();
  },
  10 * 60 * 1000,
);

export default verificationService;
