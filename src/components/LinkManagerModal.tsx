import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  LayoutGrid,
  Database,
  ShieldCheck,
  Image as ImageIcon,
  LogOut,
  Settings,
} from "lucide-react";
import { Category, UserPreferences } from "../types";
import { storageService } from "../services/storage";
import { useLanguage } from "../contexts/LanguageContext";
import { AuthScreen } from "./settings/AuthScreen";
import { AppearanceTab } from "./settings/AppearanceTab";
import { DataTab } from "./settings/DataTab";
import { SecurityTab } from "./settings/SecurityTab";
import { ContentTab } from "./settings/ContentTab";
import { GeneralTab } from "./settings/GeneralTab";

interface LinkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  background: string;
  prefs: UserPreferences;
  onUpdateAppearance: (
    url: string,
    opacity: number,
    color?: string,
    layoutPrefs?: { width: number; cardWidth: number; cardHeight: number; cols: number },
    themeAuto?: boolean,
    extraPrefs?: Partial<UserPreferences>
  ) => void;

  isDefaultCode?: boolean;
}

export const LinkManagerModal: React.FC<LinkManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  setCategories,
  background,
  prefs,
  onUpdateAppearance,
  isDefaultCode = false,
}) => {
  const { t } = useLanguage();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "general" | "data" | "security"
  >("content");

  // Initial Auth Check
  useEffect(() => {
    if (isOpen) {
      storageService.isAuthenticated().then((isAuth) => {
        setIsAuthenticated(isAuth);
      });
    }
  }, [isOpen]);

  // Session Activity Monitor
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    const interval = setInterval(() => {
      storageService.isAuthenticated().then((isAuth) => {
        if (!isAuth) setIsAuthenticated(false);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Handlers
  const syncCategories = async (newCategories: Category[]) => {
    setCategories(newCategories);
    try {
      await storageService.saveCategories(newCategories);
    } catch (e) {
      console.error("Failed to sync", e);
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
  };

  const handleImport = (
    newCategories: Category[],
    newBg?: string,
    newPrefs?: UserPreferences
  ) => {
    syncCategories(newCategories);
    if (newBg || newPrefs) {
      const bg = newBg || background;
      const opacity = newPrefs?.cardOpacity ?? prefs.cardOpacity;
      onUpdateAppearance(
        bg,
        opacity,
        newPrefs?.themeColor,
        undefined,
        newPrefs?.themeColorAuto ?? true
      );

      // Persist these as they might not be fully synced in the onUpdate callback depending on implementation
      if (newBg) storageService.setBackground(newBg);
      if (newPrefs) storageService.savePreferences(newPrefs);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-[85vh] animate-fade-in-down transition-all ring-1 ring-white/5">
        {!isAuthenticated ? (
          <AuthScreen
            onAuthenticated={() => setIsAuthenticated(true)}
            onCancel={onClose}
            isDefaultCode={isDefaultCode}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50 shrink-0 h-16">
              <div className="flex items-center gap-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield size={20} className="text-emerald-400" />{" "}
                  {t("dashboard_manage")}
                </h2>
                <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/[0.05]">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={`tab-pill ${
                      activeTab === "content"
                        ? "tab-pill-active"
                        : "tab-pill-inactive"
                    }`}
                  >
                    <LayoutGrid size={14} className="inline mr-1 mb-0.5" />{" "}
                    {t("tab_content")}
                  </button>
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`tab-pill ${
                      activeTab === "general"
                        ? "tab-pill-active"
                        : "tab-pill-inactive"
                    }`}
                  >
                    <Settings size={14} className="inline mr-1 mb-0.5" />{" "}
                    {t("tab_general") || "General"}
                  </button>
                  <button
                    onClick={() => setActiveTab("appearance")}
                    className={`tab-pill ${
                      activeTab === "appearance"
                        ? "tab-pill-active"
                        : "tab-pill-inactive"
                    }`}
                  >
                    <ImageIcon size={14} className="inline mr-1 mb-0.5" />{" "}
                    {t("tab_appearance")}
                  </button>
                  <button
                    onClick={() => setActiveTab("data")}
                    className={`tab-pill ${
                      activeTab === "data"
                        ? "tab-pill-active"
                        : "tab-pill-inactive"
                    }`}
                  >
                    <Database size={14} className="inline mr-1 mb-0.5" />{" "}
                    {t("tab_data")}
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`tab-pill ${
                      activeTab === "security"
                        ? "tab-pill-active"
                        : "tab-pill-inactive"
                    }`}
                  >
                    <ShieldCheck size={14} className="inline mr-1 mb-0.5" />{" "}
                    {t("tab_security")}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                >
                  <LogOut size={16} />{" "}
                  <span className="hidden sm:inline">{t("logout")}</span>
                </button>
                <div className="w-px h-5 bg-white/[0.1]"></div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex bg-slate-900">
              {activeTab === "content" && (
                <ContentTab
                  categories={categories}
                  onUpdateCategories={syncCategories}
                  faviconApi={prefs.faviconApi}
                />
              )}
              {activeTab === "general" && (
                <GeneralTab
                  prefs={prefs}
                  onUpdate={(newPrefs) => onUpdateAppearance(background, prefs.cardOpacity, prefs.themeColor, undefined, prefs.themeColorAuto, newPrefs)}
                />
              )}
              {activeTab === "appearance" && (
                <AppearanceTab
                  currentBackground={background}
                  currentOpacity={prefs.cardOpacity}
                  currentThemeColor={prefs.themeColor || "#6280a3"}
                  currentThemeAuto={prefs.themeColorAuto ?? true}
                  onUpdate={onUpdateAppearance}
                  currentLayout={{
                    width: prefs.maxContainerWidth ?? 900,
                    cardWidth: prefs.cardWidth ?? 96,
                    cardHeight: prefs.cardHeight ?? 96,
                    cols: prefs.gridColumns ?? 6,
                  }}

                />
              )}
              {activeTab === "data" && (
                <DataTab
                  onImport={handleImport}
                  background={background}
                  prefs={prefs}
                />
              )}
              {activeTab === "security" && <SecurityTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
