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
  // --- State ---
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

  // --- Refs ---
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- Utilities ---
  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // --- Effects ---
  // 初始化数据
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
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 同步 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty("--theme-hover", `color-mix(in srgb, ${themeColor}, black 10%)`);
  }, [themeColor]);

  // 背景变色逻辑
  useEffect(() => {
    const updateTheme = async () => {
      if (!loading && themeColorAuto && (background.startsWith("http") || background.startsWith("data:"))) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  // 导航滑块逻辑
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
    return () => { window.removeEventListener("resize", updatePill); clearTimeout(timer); };
  }, [activeCategory, categories, loading]);

  // 分类校验逻辑
  useEffect(() => {
    if (!loading && categories.length > 0) {
      const currentExists = categories.find((c) => c.id === activeCategory);
      if (!currentExists) setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory, loading]);

  useEffect(() => {
    if (!loading) {
      const currentCat = categories.find((c) => c.id === activeCategory);
      if (currentCat && currentCat.subCategories.length > 0) {
        const subExists = currentCat.subCategories.find((s) => s.id === activeSubCategoryId);
        if (!subExists) setActiveSubCategoryId(currentCat.subCategories[0].id);
      } else {
        setActiveSubCategoryId("");
      }
    }
  }, [activeCategory, categories, activeSubCategoryId, loading]);

  // --- Handlers ---
  const handleUpdateAppearance = async (url: string, opacity: number, color?: string) => {
    const updatedColor = color || themeColor;
    setBackground(url);
    setCardOpacity(opacity);
    setThemeColor(updatedColor);
    if (color) setThemeColorAuto(false);
    try {
      await storageService.setBackground(url);
      await storageService.savePreferences({ cardOpacity: opacity, themeColor: updatedColor, themeMode, themeColorAuto: color ? false : themeColorAuto }, true);
    } catch (err) { console.error(err); }
  };

  const handleUpdateThemeColor = (color: string, auto: boolean) => {
    setThemeColor(color);
    setThemeColorAuto(auto);
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

  // --- Render Helpers ---
  const isDark = themeMode === ThemeMode.Dark;
  const adaptiveGlassBlur = isDark ? 50 : 30;
  const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "bg-slate-900/60 border-white/10 shadow-2xl" : "bg-white/60 border-white/40 shadow-xl"}`;
  const actionButtonClass = `relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-white/40" size={40} />
        <div className="text-white/30 text-sm tracking-widest uppercase font-sans">Loading Dashboard...</div>
      </div>
    );
  }

  const visibleCategory = categories.find((c) => c.id === activeCategory);
  const visibleSubCategory = visibleCategory?.subCategories.find((s) => s.id === activeSubCategoryId);

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --glass-blur: ${adaptiveGlassBlur}px;
        }
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img key={background} src={background} alt="Background" className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isDark ? 0.8 : 1 }} />
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`} />
      </div>

      {/* Navigation */}
      <nav className="flex justify-center items-center py-6 px-4 relative z-[100]">
        <div className={islandContainerClass} style={{ backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(180%)` }}>
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center px-1">
            <div className="relative flex items-center" ref={navTrackRef}>
              <div className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 pointer-events-none ${isDark ? "bg-white/10" : "bg-white shadow-md border"}`} style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity }} />
              {categories.map((cat) => (
                <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 px-4 py-2 rounded-full text-sm transition-colors ${activeCategory === cat.id ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium") : (isDark ? "text-white/50" : "text-slate-500")}`}>
                  {cat.title}
                </button>
              ))}
            </div>
            <div className="w-[1px] h-5 mx-2 bg-white/10" />
            <button onClick={toggleLanguage} className={actionButtonClass}><Globe size={18} /></button>
            <button onClick={toggleTheme} className={actionButtonClass}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setIsModalOpen(true)} className={actionButtonClass}><Settings size={18} /></button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-14 relative z-[70]">
          <SearchBar themeMode={themeMode} />
        </section>

        <div className="w-full flex flex-col items-center mt-[-60px] mb-6">
          <ConsoleLog />
        </div>

<main className="w-full pb-20 relative z-[10] space-y-8">
  {visibleSubCategory ? (
    <div key={visibleSubCategory.id}>
      {/* 1. 修复：二级分类标题显示逻辑 */}
      <div className="flex items-center gap-6 mb-8 mt-4">
        <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`} />
        <h3 className={`text-lg md:text-xl font-black tracking-tight px-6 py-2 rounded-xl ${isDark ? "text-white bg-white/10" : "text-slate-900 bg-white/60 shadow-sm"}`}>
          {/* 如果子分类名为 Default，则显示主分类名；否则显示子分类名 */}
          {visibleSubCategory.title === "Default" || !visibleSubCategory.title 
            ? visibleCategory?.title 
            : visibleSubCategory.title}
        </h3>
        <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`} />
      </div>

      {/* 2. 修复：网格布局与悬停信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleSubCategory.items.map((link) => (
          <GlassCard
            key={link.id}
            // 修复：鼠标悬停时显示的完整信息 (原生 HTML title 提示)
            title={`站点：${link.title}\n链接：${link.url}${link.description ? `\n简介：${link.description}` : ''}`}
            hoverEffect={true}
            opacity={cardOpacity}
            themeMode={themeMode}
            onClick={() => window.open(link.url, "_blank")}
            className="h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter cursor-pointer"
          >
            {/* 图标 */}
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9">
              <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg" />
            </div>
            {/* 标题 */}
            <div className="flex flex-col items-start overflow-hidden">
              <span className={`text-[16px] font-bold truncate w-full transition-colors ${isDark ? "text-white group-hover:text-[var(--theme-primary)]" : "text-slate-800"}`}>
                {link.title}
              </span>
              {/* 如果你想在卡片上也显示一小段简介，可以取消下面注释 */}
              {/* <span className="text-[10px] opacity-40 truncate w-full">{link.url}</span> */}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 无内容占位 */}
      {visibleSubCategory.items.length === 0 && (
        <div className="text-center py-20 opacity-20 flex flex-col items-center gap-2">
          <FolderOpen size={48} strokeWidth={1} />
          <p>此分类下暂无剑谱（链接）</p>
        </div>
      )}
    </div>
  ) : (
    <div className="text-center py-12 opacity-30">未找到对应分类</div>
  )}
</main>
      </div> {/* 此处闭合 Container */}

      {/* --- 浮动挂件：独立于容器之外 --- */}
      <div className="hidden lg:flex fixed left-10 top-1/2 -translate-y-1/2 z-40">
        <div className="group transition-all duration-700 hover:translate-x-3 p-5 select-none drop-shadow-2xl">
          <ClockWidget />
        </div>
      </div>

      <div className="hidden lg:flex fixed right-16 top-1/2 -translate-y-1/2 z-40 max-w-2xl text-right">
        <div className="transition-transform duration-700 hover:-translate-x-4 flex flex-col items-end drop-shadow-2xl">
          <PoemWidget />
        </div>
      </div>

      <SyncIndicator />

      {/* Footer */}
      <footer className={`relative z-10 py-5 text-center text-[11px] flex flex-col md:flex-row justify-center items-center gap-4 border-t backdrop-blur-sm ${isDark ? "text-white/30 border-white/5 bg-black/10" : "text-slate-500 border-black/5 bg-white/20"}`}>
        <div className="flex gap-4">
          <a href="https://math.nyc.mn" target="_blank" className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] transition-colors"><LinkIcon size={12} /> {t("friendly_links")}</a>
          <a href="https://github.com/chanriver" target="_blank" className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] transition-colors"><Github size={12} /> {t("about_us")}</a>
        </div>
        <p>{t("copyright")} © {new Date().getFullYear()} ModernNav</p>
      </footer>

      <LinkManagerModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        categories={categories} setCategories={setCategories}
        background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }}
        onUpdateAppearance={handleUpdateAppearance} onUpdateTheme={handleUpdateThemeColor}
        isDefaultCode={isDefaultCode}
      />
    </div>
  );
};

export default App;
