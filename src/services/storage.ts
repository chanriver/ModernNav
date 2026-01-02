import { Category, ThemeMode, UserPreferences } from "../types";
import { INITIAL_CATEGORIES } from "../constants";
import { apiClient } from "./apiClient";

// --- EVENT LISTENERS ---
type NotifyType = "success" | "error" | "info";
type NotifyListener = (type: NotifyType, message: string) => void;
let _notifyListeners: NotifyListener[] = [];

type SyncStatusListener = (isSyncing: boolean) => void;
let _syncStatusListeners: SyncStatusListener[] = [];

// --- CONSTANTS ---
const LS_KEYS = {
  CATEGORIES: "modernNav_categories",
  BACKGROUND: "modernNav_bg",
  PREFS: "modernNav_prefs",
  DIRTY: "modernNav_dirty",
};

export const DEFAULT_BACKGROUND =
  "radial-gradient(circle at 50% -20%, #334155, #0f172a, #020617)";
const CURRENT_BACKUP_VERSION = 1;

const DEFAULT_PREFS: UserPreferences = {
  cardOpacity: 0.1,
  themeColor: "#6280a3",
  themeMode: ThemeMode.Dark,
  themeColorAuto: true,
};

// Backup Data Structure
interface BackupData {
  version: number;
  timestamp: number;
  categories: Category[];
  background?: string;
  prefs?: UserPreferences;
}

// --- HELPERS ---

const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      if (Array.isArray(fallback) && Array.isArray(parsed.data)) {
        return parsed.data as T;
      }
      if (!Array.isArray(fallback) && typeof parsed.data === "object") {
        return parsed.data as T;
      }
    }
    return parsed as T;
  } catch (e) {
    console.warn("JSON Parse Failed:", e);
    return fallback;
  }
};

const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const stringVal = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, stringVal);
  } catch (e) {
    console.warn("LS Write Failed", e);
  }
};

// --- STORAGE SERVICE ---

export const storageService = {
  init: () => {
    if (typeof window !== "undefined") {
      storageService._loadDirtyState();
      
      storageService._setupOnlineListener();

      if (storageService.checkGlobalDirtyState()) {
        storageService._pendingSync = true;
        storageService.notify("info", "You have unsynced changes. Syncing...");

        if (storageService._isOnline) {
          storageService.syncPendingChanges();
        }
      }
    }
  },

  subscribeNotifications: (listener: NotifyListener) => {
    _notifyListeners.push(listener);
    return () => {
      _notifyListeners = _notifyListeners.filter((l) => l !== listener);
    };
  },
  notify: (type: NotifyType, message: string) => {
    _notifyListeners.forEach((l) => l(type, message));
  },
  subscribeSyncStatus: (listener: SyncStatusListener) => {
    _syncStatusListeners.push(listener);
    return () => {
      _syncStatusListeners = _syncStatusListeners.filter((l) => l !== listener);
    };
  },
  notifySyncStatus: (isSyncing: boolean) => {
    _syncStatusListeners.forEach((l) => l(isSyncing));
  },
  checkGlobalDirtyState: () => {
    const localCategories = safeJsonParse(
      localStorage.getItem(LS_KEYS.CATEGORIES),
      null
    );
    const localBackground = localStorage.getItem(LS_KEYS.BACKGROUND);
    const localPrefs = safeJsonParse(localStorage.getItem(LS_KEYS.PREFS), null);

    return (
      (localCategories || localBackground || localPrefs) &&
      !storageService._isSynced
    );
  },


  _isSynced: false,
  _isOnline: navigator.onLine,
  _pendingSync: false,
  _dirty: {
    categories: false,
    background: false,
    prefs: false,
  },

  _saveDirtyState: () => {
    safeLocalStorageSet(LS_KEYS.DIRTY, storageService._dirty);
  },

  _loadDirtyState: () => {
    const dirtyState = safeJsonParse(localStorage.getItem(LS_KEYS.DIRTY), {
      categories: false,
      background: false,
      prefs: false,
    });
    // Ensure structure is valid
    storageService._dirty = {
      categories: !!dirtyState?.categories,
      background: !!dirtyState?.background,
      prefs: !!dirtyState?.prefs,
    };
    storageService._pendingSync = Object.values(storageService._dirty).some(
      (v) => v
    );
  },


  _setupOnlineListener: () => {
    if (typeof window !== "undefined") {
      const updateOnlineStatus = () => {
        const wasOffline = !storageService._isOnline;
        storageService._isOnline = navigator.onLine;

        if (
          wasOffline &&
          storageService._isOnline &&
          storageService._pendingSync
        ) {
          storageService.syncPendingChanges();
        }
      };

      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
    }
  },

  login: async (code: string): Promise<boolean> => {
    return apiClient.login(code);
  },

  logout: async () => {
    await apiClient.logout();
  },

  isAuthenticated: async (): Promise<boolean> => {
    return apiClient.isAuthenticated();
  },

  updateAccessCode: async (
    currentCode: string,
    newCode: string
  ): Promise<boolean> => {
    try {
      await apiClient.request("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "update", currentCode, newCode }),
      });
      return true;
    } catch {
      return false;
    }
  },

  _lastSaveTime: 0,

  fetchAllData: async () => {
    let cloudData = null;
    try {
      cloudData = await apiClient.request("/api/bootstrap");
    } catch (e) {
      console.warn("Fetch failed");
    }

    let finalCategories =
      cloudData?.categories ||
      safeJsonParse(
        localStorage.getItem(LS_KEYS.CATEGORIES),
        INITIAL_CATEGORIES
      );
    let finalBackground =
      cloudData?.background ||
      localStorage.getItem(LS_KEYS.BACKGROUND) ||
      DEFAULT_BACKGROUND;
    let finalPrefs =
      cloudData?.prefs ||
      safeJsonParse(localStorage.getItem(LS_KEYS.PREFS), DEFAULT_PREFS);

    // Data Priority: Local (if dirty) > Cloud > Local (fallback) > Default
    
    // 1. Categories
    if (!storageService._dirty.categories && cloudData?.categories) {
       finalCategories = cloudData.categories;
    }

    // 2. Background
    if (!storageService._dirty.background && cloudData?.background) {
       finalBackground = cloudData.background;
    }

    // 3. Prefs
    if (!storageService._dirty.prefs && cloudData?.prefs) {
       finalPrefs = cloudData.prefs;
    }

    // 防护逻辑
    if (!Array.isArray(finalCategories)) finalCategories = INITIAL_CATEGORIES;
    if (
      typeof finalBackground === "string" &&
      finalBackground.startsWith('"')
    ) {
      try {
        finalBackground = JSON.parse(finalBackground);
      } catch {}
    }
    if (
      typeof finalBackground === "string" &&
      finalBackground.startsWith("{")
    ) {
      const parsed = safeJsonParse<any>(finalBackground, null);
      if (parsed && parsed.data) finalBackground = parsed.data;
    }
    if (typeof finalBackground !== "string")
      finalBackground = DEFAULT_BACKGROUND;

    // 验证finalPrefs是否为有效的UserPreferences对象
    if (!finalPrefs || typeof finalPrefs !== "object") {
      finalPrefs = DEFAULT_PREFS;
    } else {
      // 确保所有必需属性都存在
      if (typeof finalPrefs.cardOpacity !== "number") {
        finalPrefs.cardOpacity = DEFAULT_PREFS.cardOpacity;
      }
      if (finalPrefs.themeColor && typeof finalPrefs.themeColor !== "string") {
        finalPrefs.themeColor = DEFAULT_PREFS.themeColor;
      }
      if (
        !finalPrefs.themeMode ||
        !Object.values(ThemeMode).includes(finalPrefs.themeMode)
      ) {
        finalPrefs.themeMode = DEFAULT_PREFS.themeMode;
      }
    }

    safeLocalStorageSet(LS_KEYS.CATEGORIES, finalCategories);
    safeLocalStorageSet(LS_KEYS.BACKGROUND, finalBackground);
    safeLocalStorageSet(LS_KEYS.PREFS, finalPrefs);

    return {
      categories: finalCategories,
      background: finalBackground,
      prefs: finalPrefs,
      isDefaultCode: !!cloudData?.isDefaultCode,
    };
  },

  _saveItem: async (key: string, data: any, type: string, force = false) => {
    safeLocalStorageSet(key, data);
    
    // Mark as dirty and save status
    if (type === "categories") storageService._dirty.categories = true;
    if (type === "background") storageService._dirty.background = true;
    if (type === "prefs") storageService._dirty.prefs = true;
    storageService._saveDirtyState();
    
    if (!(await apiClient.isAuthenticated())) {
      storageService._isSynced = false;
      storageService._pendingSync = true;
      return;
    }

    if (!force && !storageService._isOnline) {
      storageService._isSynced = false;
      storageService._pendingSync = true;
      return;
    }

    // 防抖逻辑（除非强制同步）
    const now = Date.now();
    const debounceTime = type === "prefs" ? 300 : 1000;
    if (!force && now - storageService._lastSaveTime < debounceTime) return;
    storageService._lastSaveTime = now;

    storageService.notifySyncStatus(true);
    try {
      await apiClient.request("/api/update", {
        method: "POST",
        body: JSON.stringify({ type, data }),
      });

      storageService._isSynced = true;
      storageService._pendingSync = false;
      
      // Clear dirty flag for this specific type
      if (type === "categories") storageService._dirty.categories = false;
      if (type === "background") storageService._dirty.background = false;
      if (type === "prefs") storageService._dirty.prefs = false;
      storageService._saveDirtyState();

      // Check if any other items are still dirty
      storageService._pendingSync = Object.values(storageService._dirty).some(v => v);

    } catch (e) {
      storageService._isSynced = false;
      storageService._pendingSync = true;
      storageService.notify(
        "error",
        `Cloud sync failed: ${(e as Error).message || "Unknown error"}. Saved locally.`
      );
    } finally {
      storageService.notifySyncStatus(false);
    }
  },

  saveCategories: async (categories: Category[]) =>
    storageService._saveItem(LS_KEYS.CATEGORIES, categories, "categories"),
  setBackground: async (url: string) =>
    storageService._saveItem(LS_KEYS.BACKGROUND, url, "background"),
  savePreferences: async (prefs: UserPreferences, force: boolean = false) =>
    storageService._saveItem(LS_KEYS.PREFS, prefs, "prefs", force),
  syncPendingChanges: async (force = false) => {
    if (!storageService._isOnline && !force) {
      storageService._pendingSync = true;
      storageService.notify(
        "info",
        "You are offline. Changes will be synced when you are back online."
      );
      return;
    }

    if (!(await apiClient.isAuthenticated())) {
      storageService.notify("error", "Authentication required to sync data");
      return;
    }

    try {
      storageService.notifySyncStatus(true);
      
      // Load current dirty state
      storageService._loadDirtyState();
      const dirty = storageService._dirty;

      // 1. Push Local -> Cloud (Only if dirty)
      if (dirty.categories) {
        const data = safeJsonParse(localStorage.getItem(LS_KEYS.CATEGORIES), []);
        await storageService._saveItem(LS_KEYS.CATEGORIES, data, "categories", true);
      }
      if (dirty.background) {
         const data = localStorage.getItem(LS_KEYS.BACKGROUND) || "";
         await storageService._saveItem(LS_KEYS.BACKGROUND, data, "background", true);
      }
      if (dirty.prefs) {
         const data = safeJsonParse(localStorage.getItem(LS_KEYS.PREFS), {});
         await storageService._saveItem(LS_KEYS.PREFS, data, "prefs", true);
      }

      // 2. Pull Cloud -> Local (Only if Clean)
      // fetch cloud data to check if we need to update anything that is NOT dirty
      const cloudData = await apiClient.request("/api/bootstrap");

      let updated = false;

      if (!storageService._dirty.categories && cloudData.categories) {
         safeLocalStorageSet(LS_KEYS.CATEGORIES, cloudData.categories);
         updated = true;
      }
      
      if (!storageService._dirty.background && cloudData.background) {
         safeLocalStorageSet(LS_KEYS.BACKGROUND, cloudData.background);
         updated = true;
      }
      
      if (!storageService._dirty.prefs && cloudData.prefs) {
         safeLocalStorageSet(LS_KEYS.PREFS, cloudData.prefs);
         updated = true;
      }

      // Re-evaluate pending sync status
      storageService._pendingSync = Object.values(storageService._dirty).some(v => v);
      storageService._isSynced = !storageService._pendingSync;

    } catch (error) {
      console.error("Sync failed:", error);
      storageService._pendingSync = true;
      storageService.notify(
        "error",
        "Sync failed. Your changes are saved locally and will be synced later."
      );
    } finally {
      storageService.notifySyncStatus(false);
    }
  },

  exportData: () => {
    const backup: BackupData = {
      version: CURRENT_BACKUP_VERSION,
      timestamp: Date.now(),
      categories: safeJsonParse<Category[]>(
        localStorage.getItem(LS_KEYS.CATEGORIES),
        INITIAL_CATEGORIES
      ),
      background:
        localStorage.getItem(LS_KEYS.BACKGROUND) || DEFAULT_BACKGROUND,
      prefs: safeJsonParse<UserPreferences>(
        localStorage.getItem(LS_KEYS.PREFS),
        DEFAULT_PREFS
      ),
    };
    const dataUri =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `modern-nav-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
  },

  importData: (file: File): Promise<Partial<BackupData>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          resolve(Array.isArray(parsed) ? { categories: parsed } : parsed);
        } catch {
          reject(new Error("Invalid backup file"));
        }
      };
      reader.readAsText(file);
    });
  },
};

storageService.init();
