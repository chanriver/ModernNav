import React, { useState, useEffect, useRef } from "react";

// --- 图标库 ---
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

// --- 自定义组件 ---
import { SmartIcon } from "./components/SmartIcon";
import { ConsoleLog } from "./components/ConsoleLog";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";
import { ClockWidget } from './components/ClockWidget';
import { PoemWidget } from './components/PoemWidget';

// --- 服务 & 工具 ---
import { storageService, DEFAULT_BACKGROUND } from "./services/storage";
import { getDominantColor } from "./utils/color";
import { Category, ThemeMode } from "./types";

// --- 上下文 ---
import { useLanguage } from "./contexts/LanguageContext";

const App: React.FC = () => {
  // ========================
  // ① 全局状态定义
  // ========================
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 分类数据
  const [categories, setCategories] = useState<Category[]>([]);
  // 背景
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  // 主题颜色与模式
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  // 设置弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 活动分类 / 子分类
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");

  // 语言上下文
  const { t, language, setLanguage } = useLanguage();

  // ========================
  // ② 导航动画相关状态
  // ========================
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

  const isFirstRender = useRef(true);

  // ========================
  // ③ 工具函数：hex -> rgb
  // ========================
  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // ========================
  // ④ 同步 CSS 变量
  // ========================
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty(
      "--theme-hover",
      `color-mix(in srgb, ${themeColor}, black 10%)`
    );
  }, [themeColor]);

  // ========================
  // ⑤ 初始化数据
  // ========================
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

        // 设置默认活动分类
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // ========================
  // ⑥ 导航滑块计算
  // ========================
  useEffect(() => {
    const updatePill = () => {
      const activeTab = tabsRef.current[activeCategory];
      if (activeTab && navTrackRef.current) {
        const trackRect = navTrackRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setNavPillStyle({ left: tabRect.left - trackRect.left, width: tabRect.width, opacity: 1 });
      }
    };
    const timer = setTimeout(updatePill, 50);
    window.addEventListener("resize", updatePill);
    return () => {
      window.removeEventListener("resize", updatePill);
      clearTimeout(timer);
    };
  }, [activeCategory, categories, loading]);

  // ========================
  // ⑦ 背景自动取色
  // ========================
  useEffect(() => {
    const updateTheme = async () => {
      if (!loading && themeColorAuto && (background.startsWith("http") || background.startsWith("data:"))) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  // ========================
  // ⑧ 分类合法性检查
  // ========================
  useEffect(() => {
    if (!loading && categories.length > 0) {
      const exists = categories.find(c => c.id === activeCategory);
      if (!exists) setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory, loading]);

  useEffect(() => {
    if (!loading) {
      const currentCat = categories.find(c => c.id === activeCategory);
      if (currentCat && currentCat.subCategories.length > 0) {
        const subExists = currentCat.subCategories.find(s => s.id === activeSubCategoryId);
        if (!subExists) setActiveSubCategoryId(currentCat.subCategories[0].id);
      } else setActiveSubCategoryId("");
    }
  }, [activeCategory, categories, activeSubCategoryId, loading]);

  // ========================
  // ⑨ 业务事件处理
  // ========================
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

  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    setActiveSubCategoryId(cat.subCategories.length > 0 ? cat.subCategories[0].id : "");
  };

  const handleSubCategoryClick = (catId: string, subId: string) => {
    setActiveCategory(catId);
    setActiveSubCategoryId(subId);
  };

  const toggleLanguage = () => setLanguage(language === "en" ? "zh" : "en");

  // ========================
  // ⑩ 样式变量计算
  // ========================
  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl = background.startsWith("http") || background.startsWith("data:");
  const adaptiveGlassBlur = isDark ? 50 : 30;

  const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500
    ${isDark ? "border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" : "border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"}`;
  const islandStyle = { backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, background: isDark ? `rgba(${hexToRgb(themeColor)},0.12)` : "rgba(255,255,255,0.65)" };
  const slidingPillClass = `absolute top-0 bottom-0 rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isDark ? "bg-gradient-to-b from-white/25 via-white/10 to-black/20 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_20px_rgba(0,0,0,0.35)]" : "bg-gradient-to-b from-white via-white/70 to-white/40 border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.15)]"}`;
  const categoryButtonBase = `relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors duration-300 cursor-pointer select-none active:scale-95 transition-transform ease-out`;
  const categoryButtonColors = (isActive: boolean) => isActive ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium") : (isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-800");

  // ========================
  // ⑪ Loading 页面
  // ========================
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
      <Loader2 className="animate-spin text-white/40" size={40} />
      <div className="text-white/30 text-sm font-medium tracking-widest uppercase">Loading Dashboard...</div>
    </div>
  );

  // ========================
  // ⑫ 活动分类 / 子分类
  // ========================
  const visibleCategory = categories.find(c => c.id === activeCategory);
  const visibleSubCategory = visibleCategory?.subCategories.find(s => s.id === activeSubCategoryId);

  // ========================
  // ⑬ 主渲染结构
  // ========================
  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      {/* Toast 容器 */}
      <ToastContainer />

      {/* 全局 CSS */}
      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --theme-hover: color-mix(in srgb, ${themeColor}, black 10%);
          --theme-active: color-mix(in srgb, ${themeColor}, black 20%);
          --theme-light: color-mix(in srgb, ${themeColor}, white 30%);
          --glass-blur: ${adaptiveGlassBlur}px;
        }
      `}</style>

      {/* 背景层 */}
      <div className="fixed inset-0 z-0">
        {isBackgroundUrl ? <img key={background} src={background} alt="Background" className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isDark ? 0.8 : 1 }} /> :
        <div className="w-full h-full transition-opacity duration-700" style={{ background, opacity: isDark ? 1 : 0.9 }} />}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`}></div>
      </div>

      {/* --- 灵动岛导航 --- */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] isolation-isolate text-sm font-medium tracking-wide">
        <div className={islandContainerClass} style={islandStyle}>
          {/* 导航背景效果层 */}
          <div className="absolute inset-0 z-0 glass-noise pointer-events-none opacity-50 rounded-full"></div>
          <div className="absolute inset-0 pointer-events-none rounded-full z-0" style={{ boxShadow: isDark ? "inset 0 1px 0 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 0 rgba(255,255,255,0.4)" }}></div>
          <div className="absolute inset-0 pointer-events-none z-0 rounded-full" style={{ background: isDark ? "linear-gradient(145deg, rgba(255,255,255,0.18), transparent 40%, rgba(0,0,0,0.35))" : "linear-gradient(145deg, rgba(255,255,255,0.9), transparent 45%)" }}></div>

          {/* 主分类区域 */}
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center max-w-full px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1" style={{ maxWidth: 'calc(100vw - 160px)', WebkitOverflowScrolling: 'touch' }}>
              <div className={slidingPillClass} style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%" }} />
              {categories.map(cat => {
                const isActive = activeCategory === cat.id;
                const hasSingleDefault = cat.subCategories.length === 1 && cat.subCategories[0].title === "Default";
                return (
                  <div key={cat.id} className="relative flex-shrink-0">
                    <button ref={el => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`${categoryButtonBase} ${categoryButtonColors(isActive)} whitespace-nowrap`}>
                      <span className="truncate max-w-[100px] relative z-10">{cat.title}</span>
                      {!hasSingleDefault && <ChevronDown size={14} className={`relative z-10 transition-transform duration-300 ${isActive ? "rotate-180" : "opacity-50"}`} />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* 全局操作按钮 */}
            <div className={`w-[1px] h-5 mx-2 rounded-full ${isDark ? "bg-white/10" : "bg-slate-400/20"}`}></div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className="action-button" title="Switch Language"><Globe size={18} /></button>
              <button onClick={toggleTheme} className="action-button" title="Toggle Theme">{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
              <button onClick={() => setIsModalOpen(true)} className="action-button" title="Settings"><Settings size={18} /></button>
            </div>
          </div>

          {/* 二级菜单省略（与之前相同，逻辑一致） */}
        </div>
      </nav>

      {/* SearchBar / ConsoleLog / GlassCard 主体渲染 */}
      {/* ...保持原逻辑即可，不必重复粘贴，每个功能块已注释清楚 */}

      {/* Footer */}
      {/* ...与之前完全相同，含诗句 / 版权 / 友情链接 */}

      {/* 设置弹窗 */}
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
