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
import { ClockWidget } from './components/ClockWidget';
import { PoemWidget } from './components/PoemWidget';
const App: React.FC = () => {
  // State
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

  // Navigation Animation State
  const [navPillStyle, setNavPillStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

  const isFirstRender = useRef(true);
  const hexToRgb = (hex: string) => {
  // 兼容处理：确保 hex 是标准的 #RRGGBB 格式
  let s = hex.startsWith('#') ? hex : '#' + hex;
  if (s.length === 4) { // 处理简写如 #f00
    s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }
  const r = parseInt(s.slice(1, 3), 16);
  const g = parseInt(s.slice(3, 5), 16);
  const b = parseInt(s.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};
  useEffect(() => {
  // 设置原始颜色变量
  document.documentElement.style.setProperty("--theme-primary", themeColor);

  // --- 新增：设置 RGB 分量变量，供 GlassCard 的 rgba() 使用 ---
  document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));

  document.documentElement.style.setProperty(
    "--theme-hover",
    `color-mix(in srgb, ${themeColor}, black 10%)`
  );
}, [themeColor]);
  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Simplified Load: Network First, Fallback to Cache
        const data = await storageService.fetchAllData();

        setCategories(data.categories);
        setBackground(data.background);
        setCardOpacity(data.prefs.cardOpacity);
        setThemeMode(data.prefs.themeMode);
        setIsDefaultCode(data.isDefaultCode);
        setThemeColorAuto(data.prefs.themeColorAuto ?? true);

        let finalColor = data.prefs.themeColor || "#6280a3";

        if (
          (data.prefs.themeColorAuto ?? true) &&
          data.background.startsWith("http")
        ) {
          finalColor = await getDominantColor(data.background);
        }

        setThemeColor(finalColor);

        // Set Active Category
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

  // 确保 CSS 实时同步
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);

    document.documentElement.style.setProperty(
      "--theme-hover",
      `color-mix(in srgb, ${themeColor}, black 10%)`
    );
  }, [themeColor]);

  // Update Sliding Pill Position
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

  // Extract color when background changes (if auto mode is on)
  useEffect(() => {
    const updateTheme = async () => {
      if (
        !loading &&
        themeColorAuto &&
        (background.startsWith("http") || background.startsWith("data:"))
      ) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  // Ensure activeCategory is valid
  useEffect(() => {
    if (!loading && categories.length > 0) {
      const currentExists = categories.find((c) => c.id === activeCategory);
      if (!currentExists) {
        const firstCat = categories[0];
        setActiveCategory(firstCat.id);
      }
    }
  }, [categories, activeCategory, loading]);

  // Ensure activeSubCategoryId is valid
  useEffect(() => {
    if (!loading) {
      const currentCat = categories.find((c) => c.id === activeCategory);
      if (currentCat && currentCat.subCategories.length > 0) {
        const subExists = currentCat.subCategories.find(
          (s) => s.id === activeSubCategoryId
        );
        if (!subExists) {
          setActiveSubCategoryId(currentCat.subCategories[0].id);
        }
      } else {
        setActiveSubCategoryId("");
      }
    }
  }, [activeCategory, categories, activeSubCategoryId, loading]);

  // Handle appearance updates from Modal
  const handleUpdateAppearance = async (
    url: string,
    opacity: number,
    color?: string
  ) => {
    const updatedColor = color || themeColor;

    setBackground(url);
    setCardOpacity(opacity);
    setThemeColor(updatedColor);

    if (color) setThemeColorAuto(false);

    try {
      await storageService.setBackground(url);
      await storageService.savePreferences(
        {
          cardOpacity: opacity,
          themeColor: updatedColor,
          themeMode,
          themeColorAuto: color ? false : themeColorAuto,
        },
        true
      );
    } catch (err) {
      console.error("Failed to save theme preferences:", err);
    }
  };

  const handleUpdateThemeColor = (color: string, auto: boolean) => {
    setThemeColor(color);
    setThemeColorAuto(auto);
    document.documentElement.style.setProperty("--theme-primary", color);

    storageService.savePreferences({
      cardOpacity,
      themeColor: color,
      themeMode,
      themeColorAuto: auto,
    });
  };

  const toggleTheme = () => {
    const newTheme =
      themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
    storageService.savePreferences({
      cardOpacity,
      themeColor,
      themeMode: newTheme,
      themeColorAuto,
    });
  };

  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    if (cat.subCategories.length > 0) {
      setActiveSubCategoryId(cat.subCategories[0].id);
    } else {
      setActiveSubCategoryId("");
    }
  };

  const handleSubCategoryClick = (catId: string, subId: string) => {
    setActiveCategory(catId);
    setActiveSubCategoryId(subId);
  };



  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en");
  };

  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl =
    background.startsWith("http") || background.startsWith("data:");

  const adaptiveGlassBlur = isDark ? 50 : 30;

  const dropdownClasses = isDark ? "apple-glass-dark" : "apple-glass-light";
  const navDropdownItemBase = `text-left px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center justify-between group/item`;

  const getDropdownItemClass = (isActive: boolean) => {
    if (isActive) {
      return `${navDropdownItemBase} bg-[var(--theme-primary)] text-white font-medium shadow-md`;
    }
    return `${navDropdownItemBase} ${
      isDark
        ? "text-white/90 hover:bg-white/10"
        : "text-slate-700 hover:bg-black/5"
    } active:scale-[0.98]`;
  };

  const navIconColor = isDark ? "text-white/60" : "text-slate-600";

  const glassLayerNoise = (
    <div className="absolute inset-0 z-0 glass-noise pointer-events-none opacity-50 rounded-full" />
  );

  const glassLayerRim = (
    <div
      className="absolute inset-0 pointer-events-none rounded-full z-0"
      style={{
        boxShadow: isDark
          ? "inset 0 1px 0 0 rgba(255,255,255,0.08)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.4)",
      }}
    />
  );

  const glassLayerSheen = (
  <div
    className="absolute inset-0 pointer-events-none z-0 rounded-full"
    style={{
      background: isDark
        ? "linear-gradient(145deg, rgba(255,255,255,0.18), transparent 40%, rgba(0,0,0,0.35))"
        : "linear-gradient(145deg, rgba(255,255,255,0.9), transparent 45%)",
    }}
  />
);


const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500
${
  isDark
    ? "border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
    : "border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
}`;


  const islandStyle = {
  backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
  WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
  background: isDark
    ? `rgba(var(--theme-primary-rgb), 0.12)`
    : `rgba(255,255,255,0.65)`,
};


  const slidingPillClass = `
absolute top-0 bottom-0 rounded-full pointer-events-none
transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
${
  isDark
    ? "bg-gradient-to-b from-white/25 via-white/10 to-black/20 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_20px_rgba(0,0,0,0.35)]"
    : "bg-gradient-to-b from-white via-white/70 to-white/40 border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
}`;


  const categoryButtonBase = `
    relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors duration-300 cursor-pointer select-none
    active:scale-95 transition-transform ease-out
  `;

  const categoryButtonColors = (isActive: boolean) => {
    if (isActive) {
      return isDark ? "text-white font-medium" : "text-slate-900 font-medium";
    }
    return isDark
      ? "text-white/50 hover:text-white/80"
      : "text-slate-500 hover:text-slate-800";
  };

  const actionButtonClass = `
    relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 ease-out
    active:scale-90 active:shadow-inner
    hover:bg-[var(--theme-primary)]/20 hover:text-current hover:border-[var(--theme-primary)]/10
    border border-transparent
    ${navIconColor}
    active:bg-[var(--theme-primary)]/30
  `;

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

  const visibleCategory = categories.find((c) => c.id === activeCategory);
  const visibleSubCategory = visibleCategory?.subCategories.find(
    (s) => s.id === activeSubCategoryId
  );

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${
        isDark ? "text-slate-100" : "text-slate-800"
      }`}
    >
      <ToastContainer />

      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --theme-hover: color-mix(in srgb, ${themeColor}, black 10%);
          --theme-active: color-mix(in srgb, ${themeColor}, black 20%);
          --theme-light: color-mix(in srgb, ${themeColor}, white 30%);
          --glass-blur: ${adaptiveGlassBlur}px;
        }
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {isBackgroundUrl ? (
          <img
            key={background}
            src={background}
            alt="Background"
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: isDark ? 0.8 : 1 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0";
            }}
          />
        ) : (
          <div
            className="w-full h-full transition-opacity duration-700"
            style={{
              background: background,
              opacity: isDark ? 1 : 0.9,
            }}
          />
        )}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isDark ? "bg-slate-900/30" : "bg-white/10"
          }`}
        ></div>
      </div>

      {/* Navigation - Dynamic Island */}
      <nav className="flex justify-center items-center py-6 px-4 relative z-[100] isolation-isolate text-sm font-medium tracking-wide">
        <div className={islandContainerClass} style={islandStyle}>
          {glassLayerNoise}
          {glassLayerRim}
          {glassLayerSheen}

          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center max-w-full px-1">
            {/* SECTION 1: Categories */}
            <div className="relative flex items-center" ref={navTrackRef}>
              <div
                className={slidingPillClass}
                style={{
                  left: navPillStyle.left,
                  width: navPillStyle.width,
                  opacity: navPillStyle.opacity,
                  height: "100%",
                }}
              />
              {categories.map((cat) => {
                const hasSingleDefault =
                  cat.subCategories.length === 1 &&
                  cat.subCategories[0].title === "Default";
                const isActive = activeCategory === cat.id;
                return (
                  <div key={cat.id} className="relative group">
                    <button
                      ref={(el) => {
                        tabsRef.current[cat.id] = el;
                      }}
                      onClick={() => handleMainCategoryClick(cat)}
                      className={`${categoryButtonBase} ${categoryButtonColors(
                        isActive
                      )}`}
                    >
                      <span className="truncate max-w-[120px] relative z-10">
                        {cat.title}
                      </span>
                      {!hasSingleDefault && (
                        <ChevronDown
                          size={14}
                          className={`relative z-10 transition-transform duration-300 group-hover:rotate-180 ${
                            isActive ? "text-current" : "opacity-50"
                          }`}
                        />
                      )}
                    </button>
                    {!hasSingleDefault && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-[100] w-34 animate-fade-in origin-top">
                        <div
                          className={`${dropdownClasses} rounded-xl p-1 flex flex-col gap-0.5 overflow-hidden ring-1 ring-white/5 shadow-2xl`}
                        >
                          {cat.subCategories.length > 0 ? (
                            cat.subCategories.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubCategoryClick(cat.id, sub.id);
                                }}
                                className={getDropdownItemClass(
                                  activeCategory === cat.id &&
                                    activeSubCategoryId === sub.id
                                )}
                              >
                                <span className="truncate">{sub.title}</span>
                                {activeCategory === cat.id &&
                                  activeSubCategoryId === sub.id && (
                                    <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
                                  )}
                              </button>
                            ))
                          ) : (
                            <div
                              className={`px-3 py-2 text-[10px] text-center italic ${
                                isDark ? "text-white/40" : "text-slate-400"
                              }`}
                            >
                              {t("no_submenus")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SECTION 2: Separator */}
            <div
              className={`w-[1px] h-5 mx-2 rounded-full ${
                isDark ? "bg-white/10" : "bg-slate-400/20"
              }`}
            ></div>

            {/* SECTION 3: Actions */}
            <button
              onClick={toggleLanguage}
              className={actionButtonClass}
              title="Switch Language"
            >
              <Globe size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className={actionButtonClass}
              title="Toggle Theme"
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className={actionButtonClass}
              title={t("settings")}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-14 animate-fade-in-down relative z-[70] isolation-isolate">
          <SearchBar themeMode={themeMode} />
        </section>
{/* 在 App.tsx 的 SearchBar 容器下方 */}
<div className="w-full flex flex-col items-center mt-[-55px] mb-8 relative z-[60]">
  {/* 去掉背景框，直接通过文字阴影强化反差 */}
  <div className={`
    transition-all duration-500
    ${isDark 
      ? "text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.8),0_1px_3px_rgba(0,0,0,1)]" 
      : "text-slate-900 [text-shadow:0_1px_8px_rgba(255,255,255,0.8)]"
    }
  `}>
    <ConsoleLog />
  </div>
  
  {/* 装饰短线 */}
{/*  <div 
    className="w-16 h-[2px] mt-4 opacity-30 rounded-full"
    style={{ backgroundColor: 'var(--theme-primary)' }}
  ></div> */}
</div>
        <main className="w-full pb-20 relative z-[10] space-y-8">
  {visibleSubCategory ? (
    <div key={visibleSubCategory.id}>
      {/* 分类标题分割线 */}
      {/* 分类标题分割线区域 */}
<div className="flex items-center gap-6 mb-8 mt-4">
  {/* 左侧装饰线：加粗一点点 */}
  <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
  
  {/* --- 强化后的标题样式 --- */}
  <h3 className={`
    text-lg md:text-xl font-black tracking-tight px-6 py-2 rounded-xl
    transition-all duration-300
    ${isDark 
      ? "text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
      : "text-slate-900 bg-white/60 shadow-sm border border-black/5"
    }
  `} 
  style={{ 
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    // 强制使用系统黑体，增加可读性
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    {visibleSubCategory.title === "Default" ? visibleCategory?.title : visibleSubCategory.title}
  </h3>
  
  {/* 右侧装饰线 */}
  <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
</div>

      {/* 修改后的网格布局：手机1列，平板2列，电脑4列 */}
      <div 
        key={visibleSubCategory.id}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {visibleSubCategory.items.map((link) => (
          <GlassCard
            key={link.id}
            title={
  link.description 
    ? `站点：${link.title}\n链接：${link.url}\n简介：${link.description}` 
    : `站点：${link.title}\n链接：${link.url}`
}
            hoverEffect={true}
            opacity={cardOpacity}
            themeMode={themeMode}
            onClick={() => window.open(link.url, "_blank")}
            // 修改为 h-20 且 padding 增加，内容水平排列
            className="h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter"
            style={{ animationFillMode: 'backwards' }}
            
          >
            {/* 图标容器：尺寸加大 50% (24px -> 36px) */}
            <div
              className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9 ${
                isDark ? "text-white/90" : "text-slate-700"
              }`}
            >
              <SmartIcon 
                icon={link.icon} 
                size={36} 
                imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg"
              />
            </div>

            {/* 文字容器：靠左对齐，字号加大 */}
            <div className="flex flex-col items-start overflow-hidden">
              <span
                className={`text-[16px] font-bold truncate w-full transition-colors duration-300 ${
                  isDark ? "text-white group-hover:text-[var(--theme-primary)]" : "text-slate-800"
                }`}
              >
                {link.title}
              </span>
              {/* 可选：显示描述信息 */}
             {/* {link.description && (
                <span className={`text-[11px] truncate w-full opacity-50 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                  {link.description}
                </span>
              )} */}
            </div>
          </GlassCard>
        ))}
      </div>

      {visibleSubCategory.items.length === 0 && (
        <div className={`text-center py-16 flex flex-col items-center gap-3 ${isDark ? "text-white/20" : "text-slate-400"}`}>
          <FolderOpen size={40} strokeWidth={1} />
          <p className="text-sm">{t("no_links")}</p>
        </div>
      )}
    </div>
  ) : (
    <div className={`text-center py-12 ${isDark ? "text-white/30" : "text-slate-400"}`}>
      No sub-categories found.
    </div>
  )}
</main>
	</div>

      <SyncIndicator />

      <footer
        className={`relative z-10 py-5 text-center text-[11px] flex flex-col md:flex-row justify-center items-center gap-4 border-t backdrop-blur-sm transition-colors duration-500 ${
          isDark
            ? "text-white/30 border-white/5 bg-black/10"
            : "text-slate-500 border-black/5 bg-white/20"
        }`}
      >
        <div className="flex gap-4">
          <a
            href="https://math.nyc.mn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] cursor-pointer transition-colors"
          >
            <LinkIcon size={12} /> {t("friendly_links")}
          </a>
          <a
            href="https://github.com/chanriver"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] cursor-pointer transition-colors"
          >
            <Github size={12} /> {t("about_us")}
          </a>
        </div>
        <div className="flex items-center">
          <p>
            {t("copyright")} © {new Date().getFullYear()} ModernNav
            <span className="mx-2 opacity-50">|</span>
            <span className="opacity-80">{t("powered_by")}</span>
          </p>
          <a
            href="https://github.com/chanriver/ModernNav"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-semibold hover:text-[var(--theme-primary)] transition-colors"
          >
            Chanriver
          </a>
        </div>
      </footer>

      <LinkManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
        background={background}
        prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }}
        onUpdateAppearance={handleUpdateAppearance}
        onUpdateTheme={handleUpdateThemeColor}
        isDefaultCode={isDefaultCode}
      />
    </div>
  );
};

export default App;
