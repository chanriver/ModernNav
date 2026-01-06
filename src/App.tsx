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

  // --- Navigation & Filter State ---
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- Refs ---
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const { t, language, setLanguage } = useLanguage();

  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // Initial Data
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

  // 滑块动画
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

  // 滚动联动监听：当用户手动滚动页面时，自动高亮对应的二级菜单项
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

  // --- Handlers ---
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

  const toggleTheme = () => {
    const newTheme = themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
    storageService.savePreferences({ cardOpacity, themeColor, themeMode: newTheme, themeColorAuto });
  };

  const toggleLanguage = () => setLanguage(language === "en" ? "zh" : "en");

  const isDark = themeMode === ThemeMode.Dark;
  const adaptiveGlassBlur = isDark ? 50 : 30;

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4"><Loader2 className="animate-spin text-white/40" size={40} /></div>;

  const islandStyle = {
    backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    background: isDark ? `rgba(var(--theme-primary-rgb), 0.12)` : `rgba(255,255,255,0.65)`,
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root { --theme-primary: ${themeColor}; --theme-primary-rgb: ${hexToRgb(themeColor)}; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* 背景 */}
      <div className="fixed inset-0 z-0">
        {background.startsWith("http") ? (
          <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} alt="" />
        ) : (
          <div className="w-full h-full" style={{ background: background }} />
        )}
      </div>

      {/* 灵动岛导航 */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] text-sm font-medium">
        <div className={`relative flex items-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "border-white/10 shadow-2xl" : "border-white/40 shadow-xl"}`} style={islandStyle}>
          <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar px-1" style={{ maxWidth: 'calc(100vw - 160px)' }}>
            <div className="absolute top-0 bottom-0 rounded-full bg-white/15 border border-white/20 transition-all duration-300 pointer-events-none" style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%", background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)' }} />
            {categories.map((cat) => (
              <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeCategory === cat.id ? (isDark ? "text-white" : "text-slate-900") : "text-white/50"}`}>
                {cat.title}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-5 mx-2 bg-white/10" />
          <div className="flex items-center gap-1">
            <button onClick={toggleLanguage} className="p-2.5 rounded-full text-white/60 hover:bg-white/10"><Globe size={18} /></button>
            <button onClick={toggleTheme} className="p-2.5 rounded-full text-white/60 hover:bg-white/10">{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setIsModalOpen(true)} className="p-2.5 rounded-full text-white/60 hover:bg-white/10"><Settings size={18} /></button>
          </div>

          {/* 二级菜单：跟随主菜单定位 */}
          {(() => {
            const activeCat = categories.find(c => c.id === activeCategory);
            if (!activeCat || (activeCat.subCategories.length <= 1 && activeCat.subCategories[0]?.title === "Default")) return null;
            return (
              <div 
                className="absolute top-[calc(100%+12px)] flex gap-1.5 p-1.5 rounded-2xl backdrop-blur-md animate-fade-in shadow-xl"
                style={{ 
                  left: navPillStyle.left, 
                  transform: `translateX(calc(-50% + ${navPillStyle.width / 2}px))`,
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
                }}
              >
                {activeCat.subCategories.map((sub) => (
                  <button key={sub.id} onClick={() => handleSubCategoryClick(activeCategory, sub.id)} className={`px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${activeSubCategoryId === sub.id ? "bg-[var(--theme-primary)] text-white shadow-lg" : "text-white/60 hover:bg-white/10"}`}>
                    {sub.title}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </nav>

      {/* 核心内容区 */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-14 animate-fade-in-down relative z-[70]"><SearchBar themeMode={themeMode} /></section>
        
        {/* 名人名言：保持原有的强化阴影样式 */}
        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <div className={`px-6 text-center select-none ${isDark ? "text-white [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,0_2px_10px_rgba(0,0,0,1)]" : "text-black [text-shadow:1px_1px_0_#fff,-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,0_2px_8px_rgba(255,255,255,1)]"}`} style={{ fontSize: '1.2rem', fontWeight: '900', lineHeight: '1.4', filter: isDark ? 'brightness(1.2)' : 'contrast(1.2)' }}>
            <ConsoleLog />
          </div> 
        </div>

        <main className="w-full pb-20 relative z-[10] space-y-8">
          {categories.filter(c => c.id === activeCategory).map(cat => (
            <div key={cat.id} className="animate-fade-in">
              {cat.subCategories.map(sub => (
                <section key={sub.id} id={`subcat-${cat.id}-${sub.id}`} data-subid={sub.id} className="sub-category-section scroll-mt-[200px] mb-12">
                  <div className="flex items-center gap-6 mb-8 mt-4">
                    <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                    <h3 className={`text-lg md:text-xl font-black tracking-tight px-6 py-2 rounded-xl transition-all duration-300 ${isDark ? "text-white bg-white/10 border border-white/10" : "text-slate-900 bg-white/60 border border-black/5"}`} style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                      {sub.title === "Default" ? cat.title : sub.title}
                    </h3>
                    <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sub.items.map((link) => (
                      <GlassCard
                        key={link.id}
                        hoverEffect={true}
                        opacity={cardOpacity}
                        themeMode={themeMode}
                        onClick={() => window.open(link.url, "_blank")}
                        className="h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter"
                      >
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9">
                          <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden text-left">
                          <span className={`text-[16px] font-bold truncate w-full ${isDark ? "text-white group-hover:text-[var(--theme-primary)]" : "text-slate-800"}`}>
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
      <footer className={`relative z-10 py-5 text-center text-[11px] flex flex-col md:flex-row justify-center items-center gap-4 border-t backdrop-blur-sm ${isDark ? "text-white/30 border-white/5 bg-black/10" : "text-slate-500 border-black/5 bg-white/20"}`}>
        <div className="flex gap-4">
          <a href="https://nav.361026.xyz" target="_blank" className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] transition-colors"><LinkIcon size={12} /> {t("friendly_links")}</a>
          <a href="https://github.com/chanriver" target="_blank" className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] transition-colors"><Github size={12} /> {t("about_us")}</a>
        </div>
        <p>{t("copyright")} © {new Date().getFullYear()} ModernNav <span className="mx-2 opacity-50">|</span> {t("powered_by")} <a href="https://github.com/chanriver/ModernNav" target="_blank" className="font-semibold hover:text-[var(--theme-primary)] transition-colors">Chanriver</a></p>
      </footer>

      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={() => {}} onUpdateTheme={() => {}} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;
