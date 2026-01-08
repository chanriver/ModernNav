import React, { useState, useEffect, useRef } from "react";
// --- 1. 图标与基础组件导入 ---
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
import { SmartIcon } from "./components/SmartIcon";
import { ConsoleLog } from "./components/ConsoleLog";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";

// --- 2. 业务逻辑、服务与上下文导入 ---
import { storageService, DEFAULT_BACKGROUND } from "./services/storage";
import { getDominantColor } from "./utils/color";
import { Category, ThemeMode } from "./types";
import { useLanguage } from "./contexts/LanguageContext";

const App: React.FC = () => {
  // ----------------------------------------------------------------
  // 【状态定义】核心应用数据与 UI 状态
  // ----------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 导航激活状态
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");

  const { t, language, setLanguage } = useLanguage();

  // ----------------------------------------------------------------
  // 【引用与动画】用于控制导航滑块的位置计算
  // ----------------------------------------------------------------
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------------------
  // 【工具函数】处理颜色转换
  // ----------------------------------------------------------------
  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // ----------------------------------------------------------------
  // 【生命周期 Effect】数据初始化与主题同步
  // ----------------------------------------------------------------

  // 初始化：从存储服务拉取所有数据
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

  // 实时同步主题色到全局 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty("--theme-hover", `color-mix(in srgb, ${themeColor}, black 10%)`);
  }, [themeColor]);

  // 更新灵动岛导航滑块的位置
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

  // 背景改变时（自动模式）提取主色调
  useEffect(() => {
    const updateTheme = async () => {
      if (!loading && themeColorAuto && (background.startsWith("http") || background.startsWith("data:"))) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  // ----------------------------------------------------------------
  // 【交互处理】分类切换、主题与语言操作
  // ----------------------------------------------------------------

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

  // ----------------------------------------------------------------
  // 【样式常量计算】用于 JSX 渲染的动态类名
  // ----------------------------------------------------------------
  const isDark = themeMode === ThemeMode.Dark;
  const adaptiveGlassBlur = isDark ? 50 : 30;

  const islandStyle = {
    backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    background: isDark ? `rgba(var(--theme-primary-rgb), 0.12)` : `rgba(255,255,255,0.65)`,
  };

  const actionButtonClass = `relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 ease-out active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`;

  // ----------------------------------------------------------------
  // 【核心渲染渲染片段】加载状态处理
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-white/40" size={40} />
        <div className="text-white/30 text-sm font-medium tracking-widest uppercase">Loading Dashboard...</div>
      </div>
    );
  }

  const visibleCategory = categories.find((c) => c.id === activeCategory);
  const visibleSubCategory = visibleCategory?.subCategories.find((s) => s.id === activeSubCategoryId);

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />

      {/* --- 1. 全局 CSS 变量注入 --- */}
      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --glass-blur: ${adaptiveGlassBlur}px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
        .no-scrollbar { mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); }
      `}</style>

      {/* --- 2. 背景渲染层 --- */}
      <div className="fixed inset-0 z-0">
        {background.startsWith("http") ? (
          <img src={background} alt="BG" className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isDark ? 0.8 : 1 }} />
        ) : (
          <div className="w-full h-full transition-opacity duration-700" style={{ background, opacity: isDark ? 1 : 0.9 }} />
        )}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`} />
      </div>

      {/* --- 3. 灵动岛导航栏 --- */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] text-sm font-medium">
        <div className="relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 shadow-2xl border-white/10" style={islandStyle}>
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center px-1">
            {/* 主分类滑动区 */}
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1" style={{ maxWidth: 'calc(100vw - 160px)' }}>
              <div className="absolute top-0 bottom-0 rounded-full transition-all duration-300 ease-out bg-white/20" style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%" }} />
              {categories.map((cat) => (
                <button 
                  key={cat.id} 
                  ref={(el) => { tabsRef.current[cat.id] = el; }} 
                  onClick={() => handleMainCategoryClick(cat)}
                  className={`relative z-10 px-4 py-2 rounded-full transition-colors whitespace-nowrap ${activeCategory === cat.id ? "text-white" : "text-white/50"}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
            {/* 分隔线与工具按钮 */}
            <div className="w-[1px] h-5 mx-2 bg-white/10"></div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className={actionButtonClass}><Globe size={18} /></button>
              <button onClick={toggleTheme} className={actionButtonClass}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
              <button onClick={() => setIsModalOpen(true)} className={actionButtonClass}><Settings size={18} /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- 4. 搜索区与动态名言 --- */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-14 relative z-[70]">
          <SearchBar themeMode={themeMode} />
        </section>
        
        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <div className={`px-6 text-center select-none font-black ${isDark ? "text-white [text-shadow:0_2px_10px_rgba(0,0,0,1)]" : "text-black [text-shadow:0_2px_8px_rgba(255,255,255,1)]"}`} style={{ fontSize: '1.2rem' }}>
            <ConsoleLog />
          </div> 
        </div>

        {/* --- 5. 主内容网格 (链接卡片) --- */}
        <main className="w-full pb-20 space-y-8">
          {visibleSubCategory && (
            <div key={visibleSubCategory.id}>
              <div className="flex items-center gap-6 mb-8 mt-4">
                <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                <h3 className={`text-lg md:text-xl font-black px-6 py-2 rounded-xl border ${isDark ? "text-white bg-white/10 border-white/10" : "text-slate-900 bg-white/60 border-black/5"}`}>
                  {visibleSubCategory.title === "Default" ? visibleCategory?.title : visibleSubCategory.title}
                </h3>
                <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleSubCategory.items.map((link) => (
                  <GlassCard key={link.id} opacity={cardOpacity} themeMode={themeMode} onClick={() => window.open(link.url, "_blank")} className="h-20 flex flex-row items-center px-5 gap-5 group">
                    <div className="flex-shrink-0 group-hover:scale-110 transition-transform h-9 w-9"><SmartIcon icon={link.icon} size={36} /></div>
                    <span className={`text-[16px] font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{link.title}</span>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <SyncIndicator />

      {/* --- 6. 禅意高反差页脚 --- */}
      <footer className={`relative z-10 py-5 text-center flex justify-center items-center border-t backdrop-blur-sm transition-all duration-500 ${isDark ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white/40 text-slate-900"}`}>
        {/* 左侧诗句 */}
        <div className={`hidden lg:block absolute transition-all duration-1000 animate-[pulse_7s_infinite] pointer-events-none ${isDark ? "[text-shadow:0_0_20px_rgba(0,0,0,1)]" : "[text-shadow:0_0_20px_rgba(255,255,255,1)]"}`}
          style={{ fontFamily: '"STKaiti", "Kaiti SC", "楷体", serif', fontSize: '32px', fontWeight: '900', right: 'calc(50% + 400px)', whiteSpace: 'nowrap' }}>
          宠辱不惊，看庭前花开花落
        </div>

        {/* 中间版权内容 */}
        <div className="relative z-20 flex flex-row items-center gap-4 whitespace-nowrap font-bold" style={{ fontSize: '13px' }}>
          <div className="flex items-center gap-4">
            <a href="https://nav.361026.xyz" target="_blank" className="hover:text-[var(--theme-primary)] flex items-center gap-1.5"><LinkIcon size={14} /> {t("friendly_links")}</a>
            <a href="https://github.com/chanriver" target="_blank" className="hover:text-[var(--theme-primary)] flex items-center gap-1.5"><Github size={14} /> {t("about_us")}</a>
          </div>
          <span className={`w-[1px] h-3 ${isDark ? "bg-white/40" : "bg-black/20"}`}></span>
          <div className="flex items-center gap-1.5">
            <span>{t("copyright")} © {new Date().getFullYear()} <span className="text-[var(--theme-primary)]">ModernNav</span></span>
            <span className="opacity-40">|</span>
            <span>{t("powered_by")} <a href="https://github.com/chanriver/ModernNav" target="_blank" className="hover:underline">Chanriver</a></span>
          </div>
        </div>

        {/* 右侧诗句 */}
        <div className={`hidden lg:block absolute transition-all duration-1000 animate-[pulse_7s_infinite] pointer-events-none ${isDark ? "[text-shadow:0_0_20px_rgba(0,0,0,1)]" : "[text-shadow:0_0_20px_rgba(255,255,255,1)]"}`}
          style={{ fontFamily: '"STKaiti", "Kaiti SC", "楷体", serif', fontSize: '32px', fontWeight: '900', left: 'calc(50% + 400px)', whiteSpace: 'nowrap', animationDelay: '3.5s' }}>
          去留无意，望天上云卷云舒
        </div>
      </footer>

      {/* --- 7. 管理模态框 --- */}
      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={handleUpdateAppearance} onUpdateTheme={(c, a) => setThemeColor(c)} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
