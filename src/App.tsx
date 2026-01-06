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
  // --- 状态定义 ---
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);
  const [cardOpacity, setCardOpacity] = useState<number>(0.1);
  const [themeColor, setThemeColor] = useState<string>("#6280a3");
  const [themeColorAuto, setThemeColorAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.Dark);
  const [isDefaultCode, setIsDefaultCode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 导航与联动状态 ---
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");
  const [navPillStyle, setNavPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // --- Refs ---
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const { t, language, setLanguage } = useLanguage();
  const isDark = themeMode === ThemeMode.Dark;

  // --- 辅助函数 ---
  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // --- Effects ---

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
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 2. 主题变量同步
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
  }, [themeColor]);

  // 3. 灵动岛滑块更新
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

  // 4. 滚动联动监听 (Intersection Observer)
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-180px 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingRef.current) return;
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
  }, [loading, activeCategory, categories]);

  // --- 事件处理 ---
  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    if (cat.subCategories.length > 0) {
      setActiveSubCategoryId(cat.subCategories[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubCategoryClick = (catId: string, subId: string) => {
    isScrollingRef.current = true;
    setActiveSubCategoryId(subId);
    const element = document.getElementById(`subcat-${catId}-${subId}`);
    if (element) {
      const topOffset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-white/40" size={40} />
      </div>
    );
  }

  // --- UI 组件 ---
  const adaptiveGlassBlur = isDark ? 50 : 30;
  const islandStyle = {
    backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(200%)`,
    background: isDark ? `rgba(var(--theme-primary-rgb), 0.12)` : `rgba(255,255,255,0.65)`
  };

  return (
    <div className={`min-h-screen relative selection:bg-[var(--theme-primary)] selection:text-white flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />
      <style>{`
        :root { --theme-primary: ${themeColor}; }
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; overflow-x: auto; }
      `}</style>

      {/* 背景层 */}
      <div className="fixed inset-0 -z-40">
        {background.startsWith("http") ? (
          <img src={background} className="w-full h-full object-cover" style={{ opacity: isDark ? 0.8 : 1 }} alt="bg" />
        ) : (
          <div className="w-full h-full" style={{ background: background }} />
        )}
      </div>

      {/* 导航栏 */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] text-sm font-medium">
        <div className={`relative flex items-center justify-center p-1.5 rounded-full border transition-all ${isDark ? "border-white/10 shadow-2xl" : "border-white/40 shadow-xl"}`} style={islandStyle}>
          <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center px-1">
            <div ref={navTrackRef} className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth" style={{ maxWidth: 'calc(100vw - 160px)' }}>
              <div className="absolute top-0 bottom-0 rounded-full transition-all duration-300 pointer-events-none" style={{ left: navPillStyle.left, width: navPillStyle.width, opacity: navPillStyle.opacity, height: "100%", background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)' }} />
              {categories.map((cat) => (
                <button key={cat.id} ref={(el) => { tabsRef.current[cat.id] = el; }} onClick={() => handleMainCategoryClick(cat)} className={`relative z-10 px-4 py-2 rounded-full whitespace-nowrap ${activeCategory === cat.id ? (isDark ? "text-white" : "text-slate-900") : "text-white/
