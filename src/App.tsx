import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Link as LinkIcon,
  Globe,
  FolderOpen,
  ChevronDown,
  Sun,
  Moon,
  Loader2,
  Github,
} from "lucide-react";
import * as Icons from "lucide-react";
import { SmartIcon } from "./components/SmartIcon";
import { ConsoleLog } from "./components/ConsoleLog";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";
import { storageService, DEFAULT_BACKGROUND } from "./services/storage";
import { getDominantColor } from "./utils/color";
import { Category, ThemeMode } from "./types";
import { useLanguage } from "./contexts/LanguageContext";

const App: React.FC = () => {
  // ------------------ State ------------------
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");
  const { t, language, setLanguage } = useLanguage();

  // ------------------ Navigation Animation ------------------
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl = background.startsWith("http") || background.startsWith("data:");

  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // ------------------ Effects ------------------
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty(
      "--theme-hover",
      `color-mix(in srgb, ${themeColor}, black 10%)`
    );
  }, [themeColor]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const data = await storageService.fetchAllData();
        setCategories(data.categories);
        setBackground(data.background);
        setCardOpacity(data.prefs.cardOpacity);
        setThemeMode(data.prefs.themeMode);
        setIsDefaultCode(data.isDefaultCode);
        setThemeColorAuto(data.prefs.themeColorAuto ?? true);
        let finalColor = data.prefs.themeColor || "#6280a3";

        if ((data.prefs.themeColorAuto ?? true) && data.background.startsWith("http")) {
          finalColor = await getDominantColor(data.background);
        }

        setThemeColor(finalColor);

        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    const updatePill = () => {
      const activeTab = tabsRef.current[activeCategory];
      if (activeTab && navTrackRef.current) {
        const trackRect = navTrackRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setNavPillStyle({
          left: tabRect.left - trackRect.left,
          width: tabRect.width,
          opacity: 1,
        });
      }
    };

    const timer = setTimeout(updatePill, 50);
    window.addEventListener("resize", updatePill);

    return () => {
      window.removeEventListener("resize", updatePill);
      clearTimeout(timer);
    };
  }, [activeCategory, categories, loading]);

  useEffect(() => {
    const updateTheme = async () => {
      if (!loading && themeColorAuto && isBackgroundUrl) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  useEffect(() => {
    if (!loading && categories.length > 0) {
      const currentExists = categories.find((c) => c.id === activeCategory);
      if (!currentExists) setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory, loading]);

  // ------------------ Handlers ------------------
  const handleUpdateAppearance = async (url: string, opacity: number, color?: string) => {
    const updatedColor = color || themeColor;
    setBackground(url);
    setCardOpacity(opacity);
    setThemeColor(updatedColor);
    if (color) setThemeColorAuto(false);

    try {
      await storageService.setBackground(url);
      await storageService.savePreferences({
        cardOpacity: opacity,
        themeColor: updatedColor,
        themeMode,
        themeColorAuto: color ? false : themeColorAuto,
      }, true);
    } catch (err) {
      console.error("Failed to save theme preferences:", err);
    }
  };

  const handleUpdateThemeColor = (color: string, auto: boolean) => {
    setThemeColor(color);
    setThemeColorAuto(auto);
    document.documentElement.style.setProperty("--theme-primary", color);
    storageService.savePreferences({ cardOpacity, themeColor: color, themeMode, themeColorAuto: auto });
  };

  const toggleTheme = () => {
    const newTheme = themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
    storageService.savePreferences({ cardOpacity, themeColor, themeMode: newTheme, themeColorAuto });
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en");
  };

  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    setActiveSubCategoryId(""); // 取消选择二级分类
  };

  const handleSubCategoryClick = (subId: string) => {
    setActiveSubCategoryId(subId);
  };

  // ------------------ Loading ------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-white/40" size={40} />
        <div className="text-white/30 text-sm font-medium tracking-widest uppercase">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  // ------------------ Active Category & SubCategory ------------------
  const activeCat = categories.find(c => c.id === activeCategory);

  // 如果没有选择二级分类，显示所有子分类卡片
  let itemsToShow: typeof activeCat.items = [];
  if (activeCat) {
    if (!activeSubCategoryId) {
      itemsToShow = activeCat.subCategories.flatMap(sub => sub.items);
    } else {
      const activeSub = activeCat.subCategories.find(sub => sub.id === activeSubCategoryId);
      itemsToShow = activeSub ? activeSub.items : [];
    }
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />

      {/* 背景层 */}
      <div className="fixed inset-0 z-0">
        {isBackgroundUrl ? (
          <img src={background} alt="Background" className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isDark ? 0.8 : 1 }} />
        ) : (
          <div className="w-full h-full transition-opacity duration-700" style={{ background: background, opacity: isDark ? 1 : 0.9 }} />
        )}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`}></div>
      </div>

      {/* -------------------- 灵动岛主导航 -------------------- */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] isolation-isolate text-sm font-medium tracking-wide">
        <div className={`relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" : "border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"}`}>
          {/* 主分类滑动区域 */}
          <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1 max-w-[calc(100vw-160px)]">
            <div className={`absolute top-0 bottom-0 rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isDark ? "bg-gradient-to-b from-white/25 via-white/10 to-black/20 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_20px_rgba(0,0,0,0.35)]" : "bg-gradient-to-b from-white via-white/70 to-white/40 border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.15)]"}`} style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%" }} />
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <div key={cat.id} className="relative flex-shrink-0">
                  <button ref={el => tabsRef.current[cat.id] = el} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors duration-300 cursor-pointer select-none active:scale-95 ${isActive ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium") : (isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-800")}`}>
                    <span className="truncate max-w-[100px] relative z-10">{cat.title}</span>
                    {cat.subCategories.length > 0 && <ChevronDown size={14} className={`relative z-10 transition-transform duration-300 ${isActive ? "rotate-180" : "opacity-50"}`} />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-1 ml-2">
            <button onClick={toggleLanguage} className={`relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`}><Globe size={18} /></button>
            <button onClick={toggleTheme} className={`relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setIsModalOpen(true)} className={`relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`}><Settings size={18} /></button>
          </div>
        </div>

        {/* -------------------- 二级分类显示在主分类下 -------------------- */}
        <div className="w-full mt-2 flex flex-wrap justify-center gap-2">
          {activeCat && activeCat.subCategories.map(sub => {
            const isSubActive = activeSubCategoryId === sub.id;
            return (
              <button key={sub.id} onClick={() => handleSubCategoryClick(sub.id)} className={`px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isSubActive ? "bg-[var(--theme-primary)] text-white shadow-lg scale-105 font-bold" : isDark ? "text-white/80 hover:bg-white/10" : "text-slate-800 hover:bg-black/5"}`} style={{ fontSize: "14px" }}>
                {sub.title}
                {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* -------------------- 搜索栏 -------------------- */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-14 animate-fade-in-down relative z-[70] isolation-isolate">
          <SearchBar themeMode={themeMode} />
        </section>

        {/* -------------------- 卡片显示 -------------------- */}
        <main className="w-full pb-20 relative z-[10] space-y-8">
          {itemsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {itemsToShow.map(link => (
                <GlassCard key={link.id} title={link.description ? `站点：${link.title}\n链接：${link.url}\n简介：${link.description}` : `站点：${link.title}\n链接：${link.url}`} hoverEffect={true} opacity={cardOpacity} themeMode={themeMode} onClick={() => window.open(link.url, "_blank")} className="h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter" style={{ animationFillMode: 'backwards' }}>
                  <div className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9 ${isDark ? "text-white/90" : "text-slate-700"}`}>
                    <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className={`text-[16px] font-bold truncate w-full transition-colors duration-300 ${isDark ? "text-white group-hover:text-[var(--theme-primary)]" : "text-slate-800"}`}>
                      {link.title}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 flex flex-col items-center gap-3 ${isDark ? "text-white/20" : "text-slate-400"}`}>
              <FolderOpen size={40} strokeWidth={1} />
              <p className="text-sm">{t("no_links")}</p>
            </div>
          )}
        </main>
      </div>

      <SyncIndicator />

      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={handleUpdateAppearance} onUpdateTheme={handleUpdateThemeColor} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
