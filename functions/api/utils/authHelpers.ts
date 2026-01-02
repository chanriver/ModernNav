// 认证相关的工具函数

const ACCESS_TTL = 60 * 60 * 1000; // 60分钟
const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000; // 7天

// 请求限制配置
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 100; // 最大请求数

// 错误消息
const ERROR_MESSAGES = {
  INVALID_TOKEN: "Invalid or expired token",
  UNAUTHORIZED: "Unauthorized access",
  RATE_LIMITED: "Too many requests, please try again later",
  INVALID_CREDENTIALS: "Invalid credentials",
  SERVER_ERROR: "Server error, please try again later",
  INVALID_DATA: "Invalid data format",
  DATA_NOT_FOUND: "Requested data not found",
};

// 加密助手
export async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verify(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, signatureB64] = token.split(".");
    const expectedSignature = await sign(payloadB64, secret);
    if (signatureB64 !== expectedSignature) return false;
    const payload = JSON.parse(atob(payloadB64));
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export async function generateToken(
  type: "access" | "refresh",
  secret: string
): Promise<string> {
  const payload = btoa(
    JSON.stringify({
      exp: Date.now() + (type === "access" ? ACCESS_TTL : REFRESH_TTL),
      type,
    })
  );
  return payload + "." + (await sign(payload, secret));
}

// Cookie 助手
export function respondWithCookie(body: any, token: string, clear = false) {
  const cookie =
    "refresh_token=" +
    (clear ? "" : token) +
    "; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=" +
    (clear ? 0 : REFRESH_TTL / 1000);
  
  return new Response(JSON.stringify(body), {
    headers: { 
      "Content-Type": "application/json", 
      "Set-Cookie": cookie,
      // 增加安全头
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    },
  });
}

// 速率限制助手
export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private lastCleanup: number = Date.now();
  private requestCount: number = 0;

  constructor(
    private maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
    private windowMs: number = RATE_LIMIT_WINDOW
  ) {}

  /**
   * 清理过期记录，防止内存泄漏
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
    this.lastCleanup = now;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    this.requestCount++;

    if (
      (this.requestCount % 1000 === 0 || now - this.lastCleanup > 60 * 60 * 1000) &&
      this.store.size > 100
    ) {
      this.cleanup();
    }

    const record = this.store.get(identifier);

    if (!record || now > record.resetTime) {
      this.store.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getResetTime(identifier: string): number | null {
    const record = this.store.get(identifier);
    return record ? record.resetTime : null;
  }
}

// 获取客户端IP助手
export function getClientIP(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown"
  );
}

export {
  ACCESS_TTL,
  REFRESH_TTL,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX_REQUESTS,
  ERROR_MESSAGES,
};
