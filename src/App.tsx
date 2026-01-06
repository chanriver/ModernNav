import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
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
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const { language, setLanguage } = useLanguage();
  const isDark = themeMode === ThemeMode.Dark;

  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

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
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initData();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
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
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [activeCategory, categories, loading]);

  // 滚动联动
  useEffect(() => {
    if (loading || categories.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const subId = entry.target.getAttribute('data-subid');
          if (subId) setActiveSubCategoryId(subId);
        }
      });
    }, { rootMargin: '-180px 0px -70% 0px' });
    document.querySelectorAll('.sub-category-section').forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [loading, activeCategory, categories]);

  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    if (cat.subCategories.length > 0) setActiveSubCategoryId(cat.subCategories[0].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubCategoryClick = (catId: string, subId: string) => {
    isScrollingRef.current = true;
    setActiveSubCategoryId(subId);
    const element = document.getElementById(`subcat-${catId}-${subId}`);
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 180;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-white/40" size={40} /></div>;

  return (
    <div className={`min-h-screen relative flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root { --theme-primary: ${themeColor}; }
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
      `}</style>

      {/* 原始背景层 */}
      <div className="fixed inset-0 -z-40">
        {background.startsWith("http") ? (
          <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} alt="" />
        ) : (
          <div className="w-full h-full" style={{ background }} />
        )}
      </div>

      {/* 原始导航栏 UI 结构 */}
      <nav className="flex flex-col items-center py-6 px-4 sticky top-0 z-[100]">
        <div className={`relative flex items-center p-1.5 rounded-full border transition-all ${isDark ? "border-white/10 bg-black/20" : "border-white/40 bg-white/60"} backdrop-blur-3xl shadow-xl`}>
          <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar px-1" style={{ maxWidth: 'calc(100vw - 160px)' }}>
            <div className="absolute top-0 bottom-0 rounded-full transition-all duration-300 pointer-events-none" style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%", background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)' }} />
            {categories.map((cat) => (
              <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeCategory === cat.id ? (isDark ? "text-white" : "text-slate-900") : "text-white/50"}`}>
                {cat.title}
              </button>
            ))}
          </div>
          <div className={`w-[1px] h-5 mx-2 ${isDark ? "bg-white/10" : "bg-slate-400/20"}`} />
          <div className="flex items-center gap-1">
            <button onClick={() => setLanguage(language === "en" ? "zh" : "en")} className="p-2 rounded-full hover:bg-white/10"><Globe size={18} /></button>
            <button onClick={() => setThemeMode(isDark ? ThemeMode.Light : ThemeMode.Dark)} className="p-2 rounded-full hover:bg-white/10">{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full hover:bg-white/10"><Settings size={18} /></button>
          </div>

          {/* 二级菜单：样式完全还原，仅添加动态位移 */}
          {(() => {
            const activeCat = categories.find(c => c.id === activeCategory);
            if (!activeCat || activeCat.subCategories.length <= 1) return null;
            return (
              <div 
                className="absolute top-[calc(100%+12px)] flex gap-1.5 p-1.5 rounded-2xl backdrop-blur-md animate-fade-in shadow-lg"
                style={{ 
                  left: navPillStyle.left, 
                  transform: `translateX(calc(-50% + ${navPillStyle.width / 2}px))`,
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
                }}
              >
                {activeCat.subCategories.map((sub) => (
                  <button 
                    key={sub.id} 
                    onClick={() => handleSubCategoryClick(activeCategory, sub.id)} 
                    className={`px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${activeSubCategoryId === sub.id ? "bg-[var(--theme-primary)] text-white shadow-md" : "text-white/60 hover:bg-white/10"}`}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </nav>

      {/* 内容区：SearchBar 与 ConsoleLog 比例完全还原 */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 max-w-[1200px] relative z-10">
        <section className="w-full mb-14"><SearchBar themeMode={themeMode} /></section>
        
        {/* 名人名言：位置与原版一致 */}
        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <ConsoleLog />
        </div>

        <main className="w-full pb-64 space-y-12">
          {categories.filter(c => c.id === activeCategory).map(cat => (
            <div key={cat.id} className="animate-fade-in">
              {cat.subCategories.map(sub => (
                <section key={sub.id} id={`subcat-${cat.id}-${sub.id}`} data-subid={sub.id} className="sub-category-section scroll-mt-[200px] mb-12">
                  {/* 子分类标题样式完全还原 */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/20" : "to-slate-300"}`} />
                    <h3 className={`text-lg md:text-xl font-bold px-5 py-1.5 rounded-full transition-all ${activeSubCategoryId === sub.id ? "text-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30" : isDark ? "text-white/80" : "text-slate-700"}`}>
                      {sub.title === "Default" ? cat.title : sub.title}
                    </h3>
                    <div className={`h-[1px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/20" : "to-slate-300"}`} />
                  </div>

                  {/* 卡片布局完全还原 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sub.items.map(link => (
                      <GlassCard 
                        key={link.id} 
                        opacity={cardOpacity} 
                        themeMode={themeMode} 
                        onClick={() => window.open(link.url, "_blank")} 
                        className="h-20 flex flex-row items-center px-5 gap-5 group cursor-pointer"
                      >
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9">
                          <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain rounded-lg shadow-sm" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden text-left">
                          <span className={`text-[15px] font-bold truncate w-full ${isDark ? "text-white" : "text-slate-800"}`}>
                            {link.title}
                          </span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ))}
        </main>
      </div>

      <SyncIndicator />
      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={() => {}} onUpdateTheme={() => {}} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
