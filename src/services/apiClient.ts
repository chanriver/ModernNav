const AUTH_KEYS = {
  ACCESS_TOKEN: "modernNav_token",
  TOKEN_EXPIRY: "modernNav_tokenExpiry",
  USER_LOGGED_OUT: "modernNav_userLoggedOut",
};

/**
 * 统一 API 客户端
 * 处理带认证的请求、无感刷新 (Silent Refresh) 以及 Token 管理
 */
class ApiClient {
  private _accessToken: string | null = null;
  private _isRefreshing = false;
  private _refreshSubscribers: ((token: string | null) => void)[] = [];

  constructor() {
    this._loadTokenFromStorage();
  }

  /**
   * 从本地存储加载 Token 信息
   */
  private _loadTokenFromStorage() {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY);
    
    if (token && expiry && parseInt(expiry, 10) > Date.now()) {
      this._accessToken = token;
    }
  }

  /**
   * 保存 Token 到本地存储
   */
  private _saveTokenToStorage(token: string, expiresInMs: number = 60 * 60 * 1000) {
    this._accessToken = token;
    if (typeof window === "undefined") return;
    const expiryTime = Date.now() + expiresInMs;
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(AUTH_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    localStorage.removeItem(AUTH_KEYS.USER_LOGGED_OUT);
  }

  /**
   * 清除本地 Token 状态
   */
  private _clearTokenStorage() {
    this._accessToken = null;
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_KEYS.TOKEN_EXPIRY);
    localStorage.setItem(AUTH_KEYS.USER_LOGGED_OUT, "true");
  }

  /**
   * 获取当前有效 Access Token
   */
  async getAccessToken(): Promise<string | null> {
    if (this._accessToken) {
      const expiry = localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY);
      if (expiry && parseInt(expiry, 10) > Date.now()) {
        return this._accessToken;
      }
    }
    
    // 如果 Token 已过期或不存在，尝试刷新
    if (localStorage.getItem(AUTH_KEYS.USER_LOGGED_OUT) === "true") return null;
    return await this.refreshAccessToken();
  }

  /**
   * 刷新 Access Token (无感刷新逻辑)
   */
  async refreshAccessToken(): Promise<string | null> {
    if (this._isRefreshing) {
      return new Promise((resolve) => {
        this._refreshSubscribers.push(resolve);
      });
    }

    this._isRefreshing = true;

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.accessToken;
        this._saveTokenToStorage(newToken);
        this._onTokenRefreshed(newToken);
        return newToken;
      } else {
        // 刷新失败（例如 Refresh Token 过期）
        this._clearTokenStorage();
        this._onTokenRefreshed(null);
        return null;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this._onTokenRefreshed(null);
      return null;
    } finally {
      this._isRefreshing = false;
    }
  }

  private _onTokenRefreshed(token: string | null) {
    this._refreshSubscribers.forEach((callback) => callback(token));
    this._refreshSubscribers = [];
  }

  /**
   * 基础请求封装
   */
  async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = path.startsWith("http") ? path : path;
    
    // 自动附加 Authorization 头（除非明确指定不附加）
    const headers = new Headers(options.headers || {});
    if (!headers.has("Authorization")) {
      const token = await this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...options, headers });

    // 处理 401 响应（Token 可能在请求发送间隙过期）
    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        // 重试原始请求
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${retryResponse.status}`);
        }
        return await retryResponse.json();
      } else {
        throw new Error("Unauthorized: Session expired");
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 登录
   */
  async login(code: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", code }),
      });

      if (response.ok) {
        const data = await response.json();
        this._saveTokenToStorage(data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      this._clearTokenStorage();
    }
  }

  /**
   * 检查是否已验证
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const apiClient = new ApiClient();
