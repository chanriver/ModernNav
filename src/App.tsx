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
  // --- 基础状态 ---
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 导航状态 ---
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- Refs ---
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false); // 锁定标志，防止点击跳转时触发滚动联动逻辑

  const { t, language, setLanguage } = useLanguage();
  const isDark = themeMode === ThemeMode.Dark;

  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // 1. 初始化数据
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
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initData();
  }, []);

  // 2. 主题变量同步
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
  }, [themeColor]);

  // 3. 灵动岛滑块动画
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

  // 4. 【核心逻辑：滚动联动监听】
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-180px 0px -70% 0px', // 设定触发切换的灵敏区域
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingRef.current) return; // 如果是点击产生的跳转，忽略监听

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const subId = entry.target.getAttribute('data-subid');
          if (subId) setActiveSubCategoryId(subId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('.sub-category-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading, activeCategory, categories]); // 当大类切换导致内容重绘时，重新观察

  // --- 事件处理 ---

  // 点击大类：切换显示的内容，并滚回顶部
  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    if (cat.subCategories.length > 0) {
      setActiveSubCategoryId(cat.subCategories[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 点击小类：仅平滑滚动跳转
  const handleSubCategoryClick = (catId: string, subId: string) => {
    isScrollingRef.current = true; // 锁定联动监听
    setActiveSubCategoryId(subId);

    const element = document.getElementById(`subcat-${catId}-${subId}`);
    if (element) {
      const topOffset = 180; // 预留出导航栏高度
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }

    // 延时解锁，等待滚动完成
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  const toggleTheme = () => {
    const newTheme = themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
  };

  const toggleLanguage = () => setLanguage(language === "en" ? "zh" : "en");

  // --- 样式计算 ---
  const adaptiveGlassBlur = isDark ? 50 : 30;
  const islandStyle = { 
    backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, 
    WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, 
    background: isDark ? `rgba(var(--theme-primary-rgb), 0.12)` : `rgba(255,255,255,0.65)` 
  };
  const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "border-white/10 shadow-2xl" : "border-white/40 shadow-xl"}`;
  const actionButtonClass = `relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
      <Loader2 className="animate-spin text-white/40" size={40} />
      <div className="text-white/30 text-sm tracking-widest uppercase">Loading Dashboard...</div>
    </div>
  );

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root { --theme-primary: ${themeColor}; }
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
        @media (max-width: 768px) { nav { margin-bottom: 45px; } }
      `}</style>

      {/* PC端视频壁纸 */}
      <div className="fixed inset-0 -z-30 overflow-hidden hidden md:block">
        <video autoPlay loop muted playsInline src="https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-multi-colored-gradient-background-27224-large.mp4" className="absolute inset-0 w-full h-full object-cover" onCanPlayThrough={(e) => (e.currentTarget.style.opacity = "1")} style={{ opacity: 0, transition: 'opacity 2s ease-in-out' }} />
        <div className={`absolute inset-0 transition-colors ${isDark ? "bg-black/40 backdrop-blur-[2px]" : "bg-white/10"}`} />
      </div>

      {/* 降级背景层 */}
      <div className="fixed inset-0 -z-40">
        {background.startsWith("http") ? (
          <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} />
        ) : (
          <div className="w-full h-full" style={{ background: background }} />
        )}
      </div>

      {/* Navigation: 灵动岛 */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] text-sm font-medium tracking-wide">
        <div className={islandContainerClass} style={islandStyle}>
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center max-w-full px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1" style={{ maxWidth: 'calc(100vw - 160px)' }}>
              <div className="absolute top-0 bottom-0 rounded-full bg-white/20 transition-all duration-300 pointer-events-none" style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%", background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {categories.map((cat) => (
                <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 px-4 py-2 rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeCategory === cat.id ? (isDark ? "text-white" : "text-slate-900") : "text-white/50"}`}>
                  {cat.title}
                  {cat.subCategories.length > 1 && <ChevronDown size={14} className={`transition-transform duration-300 ${activeCategory === cat.id ? "rotate-180" : ""}`} />}
                </button>
              ))}
            </div>
            <div className={`w-[1px] h-5 mx-2 ${isDark ? "bg-white/10" : "bg-slate-400/20"}`}></div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className={actionButtonClass}><Globe size={18} /></button>
              <button onClick={toggleTheme} className={actionButtonClass}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
              <button onClick={() => setIsModalOpen(true)} className={actionButtonClass}><Settings size={18} /></button>
            </div>
          </div>
        </div>

        {/* 二级联动菜单：大类内的页内定位 */}
        {(() => {
          const activeCat = categories.find(c => c.id === activeCategory);
          if (!activeCat || activeCat.subCategories.length <= 1) return null;
          return (
            <div className="w-full max-w-[95vw] mt-4 animate-fade-in md:absolute md:top-[calc(100%-8px)] md:w-auto">
              <div className={`rounded-2xl p-1.5 flex flex-row flex-nowrap items-center gap-1.5 shadow-2xl ring-1 ring-white/5 overflow-x-auto no-scrollbar ${isDark ? 'apple-glass-dark' : 'apple-glass-light'}`}>
                {activeCat.subCategories.map((sub) => (
                  <button key={sub.id} onClick={() => handleSubCategoryClick(activeCategory, sub.id)} className={`px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeSubCategoryId === sub.id ? "bg-[var(--theme-primary)] text-white shadow-lg scale-105" : isDark ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-black/5"}`}>
                    {sub.title}
                    {activeSubCategoryId === sub.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </nav>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[1200px] relative z-[10]">
        <section className="w-full mb-14 relative z-[70]"><SearchBar themeMode={themeMode} /></section>
        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]"><ConsoleLog /></div>

        <main className="w-full pb-64 space-y-16">
          {/* 关键：只渲染选中的大类 */}
          {categories.filter(c => c.id === activeCategory).map(cat => (
            <div key={cat.id} className="animate-fade-in">
              {cat.subCategories.map(sub => (
                <section key={sub.id} id={`subcat-${cat.id}-${sub.id}`} data-subid={sub.id} className="sub-category-section scroll-mt-[180px] mb-16">
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/20" : "to-slate-300"}`}></div>
                    <h3 className={`text-lg md:text-xl font-bold px-6 py-2 rounded-full transition-all ${activeSubCategoryId === sub.id ? "ring-2 ring-[var(--theme-primary)]" : "opacity-80"}`}>
                      {sub.title === "Default" ? cat.title : sub.title}
                    </h3>
                    <div className={`h-[1px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/20" : "to-slate-300"}`}></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sub.items.map(link => (
                      <GlassCard key={link.id} opacity={cardOpacity} themeMode={themeMode} onClick={() => window.open(link.url, "_blank")} className="h-20 flex flex-row items-center px-5 gap-5 group">
                        <div className="flex-shrink-0 transition-transform group-hover:scale-110"><SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 rounded-lg" /></div>
                        <span className={`text-[15px] font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{link.title}</span>
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
      <footer className="text-center py-10 opacity-30 text-[10px] uppercase tracking-widest">
        {new Date().getFullYear()} ModernNav • All Rights Reserved
      </footer>

      <LinkManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={categories} setCategories={setCategories} background={background} prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }} onUpdateAppearance={() => {}} onUpdateTheme={() => {}} isDefaultCode={isDefaultCode} />
    </div>
  );
};

export default App;    return `${r}, ${g}, ${b}`;
  };

  // --- Effects ---

  // Initial Data Fetch
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

  // Sync Theme CSS
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty("--theme-hover", `color-mix(in srgb, ${themeColor}, black 10%)`);
  }, [themeColor]);

  // Update Sliding Pill
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

  // 【核心新增：滚动联动监听】
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-160px 0px -70% 0px', // 精准识别视口顶部区域
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // 如果正在进行点击导致的平滑滚动，不更新状态防止抖动
      if (isScrollingRef.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const catId = entry.target.getAttribute('data-catid');
          const subId = entry.target.getAttribute('data-subid');
          if (catId && subId) {
            setActiveCategory(catId);
            setActiveSubCategoryId(subId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('.sub-category-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading, categories]);

  // --- Handlers ---
  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    const firstSubId = cat.subCategories.length > 0 ? cat.subCategories[0].id : "";
    setActiveSubCategoryId(firstSubId);
    
    // 自动平滑滚动到该大类第一个子类
    if (firstSubId) {
      handleSubCategoryClick(cat.id, firstSubId);
    }
  };

  const handleSubCategoryClick = (catId: string, subId: string) => {
    isScrollingRef.current = true; // 锁定监听
    setActiveCategory(catId);
    setActiveSubCategoryId(subId);

    const element = document.getElementById(`subcat-${catId}-${subId}`);
    if (element) {
      const topOffset = 150; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    // 1秒后解除锁定，等待平滑滚动完成
    setTimeout(() => { isScrollingRef.current = false; }, 1000);
  };

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

  const toggleLanguage = () => setLanguage(language === "en" ? "zh" : "en");

  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl = background.startsWith("http") || background.startsWith("data:");
  const adaptiveGlassBlur = isDark ? 50 : 30;
  const dropdownClasses = isDark ? "apple-glass-dark" : "apple-glass-light";
  const actionButtonClass = `relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 ease-out active:scale-90 hover:bg-[var(--theme-primary)]/20 ${isDark ? "text-white/60" : "text-slate-600"}`;
  
  const glassLayerNoise = <div className="absolute inset-0 z-0 glass-noise pointer-events-none opacity-50 rounded-full" />;
  const glassLayerRim = <div className="absolute inset-0 pointer-events-none rounded-full z-0" style={{ boxShadow: isDark ? "inset 0 1px 0 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 0 rgba(255,255,255,0.4)" }} />;
  const glassLayerSheen = <div className="absolute inset-0 pointer-events-none z-0 rounded-full" style={{ background: isDark ? "linear-gradient(145deg, rgba(255,255,255,0.18), transparent 40%, rgba(0,0,0,0.35))" : "linear-gradient(145deg, rgba(255,255,255,0.9), transparent 45%)" }} />;
  const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" : "border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"}`;
  const islandStyle = { backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`, background: isDark ? `rgba(var(--theme-primary-rgb), 0.12)` : `rgba(255,255,255,0.65)` };
  const slidingPillClass = `absolute top-0 bottom-0 rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isDark ? "bg-gradient-to-b from-white/25 via-white/10 to-black/20 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_20px_rgba(0,0,0,0.35)]" : "bg-gradient-to-b from-white via-white/70 to-white/40 border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.15)]"}`;
  const categoryButtonBase = `relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors duration-300 cursor-pointer select-none active:scale-95 transition-transform ease-out`;
  const categoryButtonColors = (isActive: boolean) => isActive ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium") : (isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-800");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-white/40" size={40} />
        <div className="text-white/30 text-sm font-medium tracking-widest uppercase">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />

      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --glass-blur: ${adaptiveGlassBlur}px;
        }
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
        .no-scrollbar { mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); }
        @media (max-width: 768px) {
          .nav-island-container { max-width: 98vw; }
          nav { margin-bottom: 45px; transition: margin-bottom 0.3s ease; }
          .category-button-base { padding-left: 0.8rem; padding-right: 0.8rem; font-size: 0.85rem; }
        }
      `}</style>

      {/* --- PC端视频壁纸 --- */}
      <div className="fixed inset-0 -z-30 overflow-hidden hidden md:block">
        <video
          autoPlay loop muted playsInline
          src="https://assets.mixkit.co/videos/preview/mixkit-abstract-flowing-multi-colored-gradient-background-27224-large.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          onCanPlayThrough={(e) => (e.currentTarget.style.opacity = "1")}
          style={{ opacity: 0, transition: 'opacity 2s ease-in-out' }}
        />
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-black/40 backdrop-blur-[2px]" : "bg-white/10 backdrop-blur-[1px]"}`} />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Background Layer (手机端或视频加载前的降级) */}
      <div className="fixed inset-0 -z-40">
        {isBackgroundUrl ? (
          <img key={background} src={background} alt="BG" className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} />
        ) : (
          <div className="w-full h-full" style={{ background: background, opacity: isDark ? 1 : 0.9 }} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] isolation-isolate text-sm font-medium tracking-wide">
        <div className={islandContainerClass} style={islandStyle}>
          {glassLayerNoise}{glassLayerRim}{glassLayerSheen}
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center max-w-full px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1" style={{ maxWidth: 'calc(100vw - 160px)', WebkitOverflowScrolling: 'touch' }}>
              <div className={slidingPillClass} style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%" }} />
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <div key={cat.id} className="relative flex-shrink-0">
                    <button
                      ref={(el) => { tabsRef.current[cat.id] = el; }}
                      onClick={() => handleMainCategoryClick(cat)}
                      className={`${categoryButtonBase} ${categoryButtonColors(isActive)} whitespace-nowrap`}
                    >
                      <span className="truncate max-w-[100px] relative z-10">{cat.title}</span>
                      {cat.subCategories.length > 1 && (
                        <ChevronDown size={14} className={`relative z-10 transition-transform duration-300 ${isActive ? "rotate-180" : "opacity-50"}`} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className={`w-[1px] h-5 mx-2 rounded-full ${isDark ? "bg-white/10" : "bg-slate-400/20"}`}></div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className={actionButtonClass}><Globe size={18} /></button>
              <button onClick={toggleTheme} className={actionButtonClass}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
              <button onClick={() => setIsModalOpen(true)} className={actionButtonClass}><Settings size={18} /></button>
            </div>
          </div>
        </div>

        {/* 二级联动菜单 */}
        {(() => {
          const activeCat = categories.find(c => c.id === activeCategory);
          if (!activeCat || activeCat.subCategories.length <= 1) return null;
          return (
            <div className="w-full max-w-[95vw] mt-4 animate-fade-in md:absolute md:top-[calc(100%-8px)] md:w-auto">
              <div className={`${dropdownClasses} rounded-2xl p-1.5 flex flex-row flex-wrap md:flex-nowrap justify-center items-center gap-1.5 shadow-2xl ring-1 ring-white/5 overflow-x-auto no-scrollbar`}>
                {activeCat.subCategories.map((sub) => {
                  const isSubActive = activeSubCategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(activeCategory, sub.id)}
                      className={`px-4 py-2 rounded-xl text-xs transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isSubActive ? "bg-[var(--theme-primary)] text-white shadow-lg scale-105 font-bold" : isDark ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-black/5"}`}
                    >
                      <span>{sub.title}</span>
                      {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[1200px] relative z-[10]">
        <section className="w-full mb-14 animate-fade-in-down relative z-[70] isolation-isolate">
          <SearchBar themeMode={themeMode} />
        </section>

        <div className="w-full flex flex-col items-center mt-[-60px] mb-8 relative z-[60]">
          <div className={`px-6 text-center select-none font-black ${isDark ? "text-white [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,0_2px_10px_rgba(0,0,0,1)]" : "text-black [text-shadow:1px_1px_0_#fff,-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,0_2px_8px_rgba(255,255,255,1)]"}`} style={{ fontSize: '1.2rem' }}>
            <ConsoleLog />
          </div> 
        </div>

        {/* --- 全量渲染卡片区域 --- */}
        <main className="w-full pb-64 space-y-16">
          {categories.map((cat) => (
            <div key={cat.id}>
              {cat.subCategories.map((sub) => (
                <section
                  key={sub.id}
                  id={`subcat-${cat.id}-${sub.id}`}
                  data-catid={cat.id}
                  data-subid={sub.id}
                  className="sub-category-section scroll-mt-[160px] mb-12"
                >
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`h-[2px] flex-1 bg-gradient-to-r from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                    <h3 className={`text-lg md:text-xl font-black tracking-tight px-6 py-2 rounded-xl transition-all duration-300 ${isDark ? "text-white bg-white/10 border border-white/10 shadow-lg" : "text-slate-900 bg-white/60 border border-black/5 shadow-sm"}`} style={{ backdropFilter: 'blur(8px)' }}>
                      {sub.title === "Default" ? cat.title : sub.title}
                    </h3>
                    <div className={`h-[2px] flex-1 bg-gradient-to-l from-transparent ${isDark ? "to-white/30" : "to-slate-400/40"}`}></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sub.items.map((link) => (
                      <GlassCard
                        key={link.id}
                        title={link.description ? `简介：${link.description}` : link.title}
                        hoverEffect={true}
                        opacity={cardOpacity}
                        themeMode={themeMode}
                        onClick={() => window.open(link.url, "_blank")}
                        className="h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter"
                      >
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center h-9 w-9">
                          <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
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
          <a href="#" className="hover:text-[var(--theme-primary)] transition-colors flex items-center gap-1.5"><LinkIcon size={12} /> {t("friendly_links")}</a>
          <a href="#" className="hover:text-[var(--theme-primary)] transition-colors flex items-center gap-1.5"><Github size={12} /> {t("about_us")}</a>
        </div>
        <p>{t("copyright")} © {new Date().getFullYear()} ModernNav</p>
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
