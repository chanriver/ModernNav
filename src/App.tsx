import React, { useState, useEffect, useRef, useMemo } from "react";
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
import * as Icons from "lucide-react";
import { SmartIcon } from "./components/SmartIcon";
import { ConsoleLog } from "./components/ConsoleLog";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";

// --- 2. 业务逻辑与上下文 ---
import { storageService, DEFAULT_BACKGROUND } from "./services/storage";
import { getDominantColor } from "./utils/color";
import { Category, ThemeMode } from "./types";
import { useLanguage } from "./contexts/LanguageContext";

const App: React.FC = () => {
  // --- 3. 核心状态 ---
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
  const isDark = themeMode === ThemeMode.Dark;

  // 灵动岛滑块引用
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- 4. 核心逻辑：计算显示的卡片（置顶逻辑） ---
  const { visibleCategory, displayLinks } = useMemo(() => {
    const currentCat = categories.find((c) => c.id === activeCategory);
    if (!currentCat) return { visibleCategory: null, displayLinks: [] };

    // 如果没有选中二级分类，显示全部
    if (!activeSubCategoryId) {
      return { 
        visibleCategory: currentCat, 
        displayLinks: currentCat.subCategories.flatMap(sub => sub.items) 
      };
    }

    // 如果选中了，则该二级分类内容置顶，其余内容排在后面
    const activeSub = currentCat.subCategories.find(s => s.id === activeSubCategoryId);
    const otherSubs = currentCat.subCategories.filter(s => s.id !== activeSubCategoryId);
    const sortedLinks = [
      ...(activeSub ? activeSub.items : []),
      ...otherSubs.flatMap(sub => sub.items)
    ];

    return { visibleCategory: currentCat, displayLinks: sortedLinks };
  }, [activeCategory, activeSubCategoryId, categories]);

  // --- 5. 生命周期与初始化 ---
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
        if (data.prefs.themeColorAuto && data.background.startsWith("http")) {
          finalColor = await getDominantColor(data.background);
        }
        setThemeColor(finalColor);
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initData();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
  }, [themeColor]);

  // 导航滑块位置同步
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

  // --- 6. 交互函数 ---
  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    setActiveSubCategoryId(""); // 点击主分类，默认置顶取消，显示全部
  };

  const handleSubCategoryClick = (subId: string) => {
    setActiveSubCategoryId(activeSubCategoryId === subId ? "" : subId);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4"><Loader2 className="animate-spin text-white/40" size={40} /></div>;

  return (
    <div className={`min-h-screen relative overflow-x-hidden flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root { --theme-primary: ${themeColor}; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- 背景层 --- */}
      <div className="fixed inset-0 z-0">
        <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} />
        <div className={`absolute inset-0 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`} />
      </div>

      {/* --- 7. 灵动岛 (改版：二级菜单包含在主菜单容器内) --- */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] text-sm">
        <div className={`relative flex flex-col items-center p-2 rounded-[30px] border transition-all duration-500 shadow-2xl ${
          isDark ? "border-white/10 bg-black/20" : "border-white/40 bg-white/60"
        }`} style={{ backdropFilter: 'blur(40px)' }}>
          
          {/* 主导航行 */}
          <div className="relative z-10 flex items-center gap-1 px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1" style={{ maxWidth: 'calc(100vw - 160px)' }}>
              <div className="absolute top-0 bottom-0 rounded-full transition-all duration-300 bg-white/20" style={{ ...navPillStyle, height: "100%" }} />
              {categories.map((cat) => (
                <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)}
                  className={`relative z-10 px-5 py-2 rounded-full transition-colors whitespace-nowrap font-bold ${activeCategory === cat.id ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                  {cat.title}
                </button>
              ))}
            </div>
            <div className="w-[1px] h-5 mx-2 bg-white/10" />
            <div className="flex items-center gap-1">
              <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="p-2 text-white/60 hover:text-white"><Globe size={18} /></button>
              <button onClick={() => setIsModalOpen(true)} className="p-2 text-white/60 hover:text-white"><Settings size={18} /></button>
            </div>
          </div>

          {/* 二级分类行 (紧跟其下) */}
          {visibleCategory && visibleCategory.subCategories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-4 pb-1">
              {visibleCategory.subCategories.map((sub) => (
                <button key={sub.id} onClick={() => handleSubCategoryClick(sub.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    activeSubCategoryId === sub.id ? "bg-[var(--theme-primary)] text-white border-transparent" : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"
                  }`}>
                  {sub.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 max-w-[900px] relative z-[10]">
        {/* --- 8. 强化版搜索框 --- */}
        <section className="w-full mb-14 relative z-[70]">
          <SearchBar themeMode={themeMode} />
        </section>

        {/* --- 9. 抠图级名人名言 --- */}
        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <div className={`px-6 text-center select-none font-black ${
            isDark 
              ? "text-white [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,0_2px_10px_rgba(0,0,0,1)]" 
              : "text-black [text-shadow:1px_1px_0_#fff,-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,0_2px_8px_rgba(255,255,255,1)]"
          }`} style={{ fontSize: '1.2rem', filter: isDark ? 'brightness(1.2)' : 'contrast(1.2)' }}>
            <ConsoleLog />
          </div> 
        </div>

        {/* --- 10. 卡片内容区 --- */}
        <main className="w-full pb-20 space-y-8">
          {visibleCategory && (
            <div>
              <div className="flex items-center gap-6 mb-8 mt-4">
                <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                <h3 className={`text-lg font-black px-6 py-2 rounded-xl border ${isDark ? "text-white bg-white/10 border-white/10" : "text-slate-900 bg-white/60 border-black/5"}`}>
                  {activeSubCategoryId ? visibleCategory.subCategories.find(s=>s.id===activeSubCategoryId)?.title : visibleCategory.title}
                </h3>
                <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-card-enter">
                {displayLinks.map((link, idx) => (
                  <GlassCard key={`${link.id}-${idx}`} opacity={cardOpacity} themeMode={themeMode} onClick={() => window.open(link.url, "_blank")}
                    className={`h-20 flex flex-row items-center px-5 gap-5 group border-2 ${
                      activeSubCategoryId && idx < (visibleCategory.subCategories.find(s=>s.id===activeSubCategoryId)?.items.length || 0)
                      ? "border-[var(--theme-primary)]/40 shadow-lg" : "border-transparent"
                    }`}>
                    <div className="flex-shrink-0 group-hover:scale-110 transition-transform"><SmartIcon icon={link.icon} size={36} /></div>
                    <span className={`text-[16px] font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{link.title}</span>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- 11. 最终修正版页脚 (高反差、单行、不遮挡) --- */}
      <footer className={`relative z-10 py-5 text-center flex justify-center items-center border-t backdrop-blur-sm transition-all duration-500 ${
        isDark ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white/40 text-slate-900"
      }`}>
        <div className={`hidden lg:block absolute transition-all duration-1000 animate-[pulse_7s_infinite] pointer-events-none ${isDark ? "[text-shadow:0_0_20px_rgba(0,0,0,1)]" : "[text-shadow:0_0_20px_rgba(255,255,255,1)]"}`}
          style={{ fontFamily: '"STKaiti", "楷体", serif', fontSize: '32px', fontWeight: '900', right: 'calc(50% + 400px)', whiteSpace: 'nowrap' }}>
          宠辱不惊，看庭前花开花落
        </div>

        <div className="relative z-20 flex flex-row items-center gap-4 whitespace-nowrap font-bold text-[13px]">
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

        <div className={`hidden lg:block absolute transition-all duration-1000 animate-[pulse_7s_infinite] pointer-events-none ${isDark ? "[text-shadow:0_0_20px_rgba(0,0,0,1)]" : "[text-shadow:0_0_20px_rgba(255,255,255,1)]"}`}
          style={{ fontFamily: '"STKaiti", "楷体", serif', fontSize: '32px', fontWeight: '900', left: 'calc(50% + 400px)', whiteSpace: 'nowrap', animationDelay: '3.5s' }}>
          去留无意，望天上云卷云舒
        </div>
      </footer>

      <SyncIndicator />
      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={() => {}} onUpdateTheme={(c) => setThemeColor(c)} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
