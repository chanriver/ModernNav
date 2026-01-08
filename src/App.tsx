import React, { useState, useEffect, useRef, useMemo } from "react";
// --- 1. 基础图标与组件 ---
import { Settings, Link as LinkIcon, Globe, Sun, Moon, Loader2, Github } from "lucide-react";
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
  // --- 状态控制 ---
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 导航状态
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");

  const { t, language, setLanguage } = useLanguage();
  const isDark = themeMode === ThemeMode.Dark;

  // 灵动岛动画引用
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- 3. 核心：实现“置顶”逻辑的数据处理 ---
  const displayLinks = useMemo(() => {
    const currentCat = categories.find((c) => c.id === activeCategory);
    if (!currentCat) return [];

    // 获取当前主分类下所有的链接（拍平）
    const allLinks = currentCat.subCategories.flatMap(sub => 
      sub.items.map(item => ({ ...item, parentSubId: sub.id }))
    );

    // 如果没有选中二级分类，直接返回全部
    if (!activeSubCategoryId) return allLinks;

    // 如果选中了二级分类：将匹配的置顶，不匹配的放后面
    const prioritized = allLinks.filter(link => link.parentSubId === activeSubCategoryId);
    const others = allLinks.filter(link => link.parentSubId !== activeSubCategoryId);
    
    return [...prioritized, ...others];
  }, [activeCategory, activeSubCategoryId, categories]);

  // --- 4. 初始化与主题 ---
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
        
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
        
        let color = data.prefs.themeColor || "#6280a3";
        if (data.prefs.themeColorAuto && data.background.startsWith("http")) {
          color = await getDominantColor(data.background);
        }
        setThemeColor(color);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initData();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
  }, [themeColor]);

  useEffect(() => {
    const updatePill = () => {
      const activeTab = tabsRef.current[activeCategory];
      if (activeTab && navTrackRef.current) {
        const trackRect = navTrackRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setNavPillStyle({ left: tabRect.left - trackRect.left, width: tabRect.width, opacity: 1 });
      }
    };
    setTimeout(updatePill, 50);
  }, [activeCategory, categories, loading]);

  // --- 5. 渲染函数 ---
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-white/40" size={40} /></div>;

  const currentCategoryObj = categories.find(c => c.id === activeCategory);

  return (
    <div className={`min-h-screen relative overflow-x-hidden flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`:root { --theme-primary: ${themeColor}; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* 背景层 */}
      <div className="fixed inset-0 z-0">
        <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} />
        <div className={`absolute inset-0 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`} />
      </div>

      {/* --- 灵动岛：双层结构，主分类下紧跟二级分类 --- */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100]">
        <div className={`flex flex-col items-center p-1.5 rounded-[32px] border transition-all shadow-2xl backdrop-blur-3xl ${
          isDark ? "border-white/10 bg-black/20" : "border-white/40 bg-white/60"
        }`}>
          {/* 主分类行 */}
          <div className="relative flex items-center gap-1 px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar">
              <div className="absolute top-0 bottom-0 rounded-full transition-all duration-300 bg-white/20" style={{ ...navPillStyle, height: "100%" }} />
              {categories.map((cat) => (
                <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => { setActiveCategory(cat.id); setActiveSubCategoryId(""); }}
                  className={`relative z-10 px-5 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${activeCategory === cat.id ? "text-white" : "text-white/40"}`}>
                  {cat.title}
                </button>
              ))}
            </div>
            <div className="w-[1px] h-5 mx-2 bg-white/10" />
            <div className="flex items-center gap-1">
              <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="p-2 text-white/60"><Globe size={18} /></button>
              <button onClick={() => setIsModalOpen(true)} className="p-2 text-white/60"><Settings size={18} /></button>
            </div>
          </div>

          {/* 二级分类行（仅在主分类下有多个子分类时显示） */}
          {currentCategoryObj && currentCategoryObj.subCategories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-4 pb-1">
              {currentCategoryObj.subCategories.map((sub) => (
                <button key={sub.id} onClick={() => setActiveSubCategoryId(activeSubCategoryId === sub.id ? "" : sub.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    activeSubCategoryId === sub.id ? "bg-[var(--theme-primary)] text-white border-transparent" : "bg-white/5 text-white/40 border-white/5"
                  }`}>
                  {sub.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* --- 内容区：严格保持原始 UI --- */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 max-w-[1000px] relative z-10">
        
        <section className="w-full mb-14 relative z-[70]"><SearchBar themeMode={themeMode} /></section>

        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <div className={`px-6 text-center select-none font-black ${
            isDark ? "text-white [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,0_2px_10px_rgba(0,0,0,1)]" : "text-black [text-shadow:1px_1px_0_#fff,-1px_-1px_0_#fff,0_2px_8px_rgba(255,255,255,1)]"
          }`} style={{ fontSize: '1.2rem' }}><ConsoleLog /></div> 
        </div>

        <main className="w-full pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayLinks.map((link, idx) => (
              <GlassCard key={`${link.id}-${idx}`} opacity={cardOpacity} themeMode={themeMode} onClick={() => window.open(link.url, "_blank")}
                // 严格恢复 h-20 原始样式
                className="h-20 flex flex-row items-center px-5 gap-5 group transition-all duration-500">
                <div className="flex-shrink-0 group-hover:scale-110 transition-transform h-9 w-9"><SmartIcon icon={link.icon} size={36} /></div>
                <span className={`text-[16px] font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{link.title}</span>
              </GlassCard>
            ))}
          </div>
        </main>
      </div>

      {/* --- 页脚：单行、高反差、楷体诗句 --- */}
      <footer className={`relative z-10 py-5 flex justify-center items-center border-t transition-all ${
        isDark ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white/40 text-slate-900"
      }`}>
        <div className="hidden lg:block absolute font-black text-[32px] right-[calc(50%+400px)] whitespace-nowrap animate-pulse opacity-80" 
          style={{ fontFamily: '"STKaiti", "楷体", serif' }}>宠辱不惊，看庭前花开花落</div>

        <div className="relative z-20 flex flex-row items-center gap-4 whitespace-nowrap font-bold text-[13px]">
          <a href="https://nav.361026.xyz" target="_blank" className="hover:text-[var(--theme-primary)]"><LinkIcon size={14} className="inline mr-1" />{t("friendly_links")}</a>
          <span className="w-[1px] h-3 bg-current opacity-20"></span>
          <div>{t("copyright")} © {new Date().getFullYear()} <span className="text-[var(--theme-primary)]">ModernNav</span> | Powered by Chanriver</div>
        </div>

        <div className="hidden lg:block absolute font-black text-[32px] left-[calc(50%+400px)] whitespace-nowrap animate-pulse opacity-80" 
          style={{ fontFamily: '"STKaiti", "楷体", serif', animationDelay: '3.5s' }}>去留无意，望天上云卷云舒</div>
      </footer>

      <SyncIndicator />
      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={() => {}} onUpdateTheme={(c) => setThemeColor(c)} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
