// App.tsx
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
} from "lucide-react";
import { SmartIcon } from "./components/SmartIcon";
import { ConsoleLog } from "./components/ConsoleLog";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";
import { storageService, DEFAULT_BACKGROUND } from "./services/storage";
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
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");
  const { t, language, setLanguage } = useLanguage();

  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl = background.startsWith("http") || background.startsWith("data:");

  const hexToRgb = (hex: string) => {
    let s = hex.startsWith('#') ? hex : '#' + hex;
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
  }, [themeColor]);

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

  const toggleTheme = () => {
    const newTheme = themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en");
  };

  const handleMainCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubCategoryId(""); // 取消二级分类选择
  };

  const handleSubCategoryClick = (subId: string) => {
    setActiveSubCategoryId(subId);
  };

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

  const activeCat = categories.find(c => c.id === activeCategory);

  // 显示卡片逻辑
  let itemsToShow: typeof activeCat.items = [];
  let displayedSubTitle = "";
  if (activeCat) {
    if (!activeSubCategoryId) {
      // 主分类点击：显示所有子分类卡片
      activeCat.subCategories.forEach(sub => {
        itemsToShow.push(...sub.items);
      });
    } else {
      // 二级分类点击
      const sub = activeCat.subCategories.find(s => s.id === activeSubCategoryId);
      if (sub) {
        itemsToShow = sub.items;
        displayedSubTitle = sub.title; // 用于显示二级分类名称
      }
    }
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />

      {/* 背景 */}
      <div className="fixed inset-0 z-0">
        {isBackgroundUrl ? (
          <img src={background} alt="Background" className="w-full h-full object-cover transition-opacity duration-700" />
        ) : (
          <div className="w-full h-full transition-opacity duration-700" style={{ background }} />
        )}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`}></div>
      </div>

      {/* 灵动岛主导航 */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100] isolation-isolate text-sm font-medium tracking-wide">
        <div className={`relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ${isDark ? "border-white/10" : "border-white/40"}`}>
          <div className="flex space-x-3">
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => handleMainCategoryClick(cat.id)} className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${isActive ? "bg-[var(--theme-primary)] text-white" : isDark ? "text-white/70 hover:text-white/90" : "text-slate-700 hover:text-slate-900"}`}>
                  {cat.title}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button onClick={toggleLanguage}><Globe size={18} /></button>
            <button onClick={toggleTheme}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setIsModalOpen(true)}><Settings size={18} /></button>
          </div>
        </div>

        {/* 二级分类 */}
        {activeCat && activeCat.subCategories.length > 0 && (
          <div className="flex flex-wrap justify-center mt-4 gap-2">
            {activeCat.subCategories.map(sub => {
              const isActive = activeSubCategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubCategoryClick(sub.id)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${isActive ? "bg-[var(--theme-primary)] text-white scale-105" : isDark ? "text-white/80 hover:bg-white/10" : "text-slate-800 hover:bg-black/5"}`}
                  style={{ fontSize: "16px" }} // 二级分类字体大
                >
                  {sub.title}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* 搜索栏 */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 max-w-[900px] relative z-[10]">
        <section className="w-full mb-6 relative z-[70]">
          <SearchBar themeMode={themeMode} />
        </section>

        {/* 二级分类标题显示在卡片上方 */}
        {displayedSubTitle && (
          <h2 className="w-full text-left text-lg font-bold mb-2 px-2">{displayedSubTitle}</h2>
        )}

        {/* 卡片 */}
        <main className="w-full pb-20 relative z-[10] space-y-8">
          {itemsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {itemsToShow.map(link => (
                <GlassCard
                  key={link.id}
                  title={link.description ? `站点：${link.title}\n链接：${link.url}\n简介：${link.description}` : `站点：${link.title}\n链接：${link.url}`}
                  hoverEffect={true}
                  opacity={cardOpacity}
                  themeMode={themeMode}
                  onClick={() => window.open(link.url, "_blank")}
                  className="h-20 flex flex-row items-center px-5 gap-5"
                >
                  <div className={`flex-shrink-0 flex items-center justify-center h-9 w-9`}>
                    <SmartIcon icon={link.icon} size={36} imgClassName="w-9 h-9 object-contain drop-shadow-md rounded-lg" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className={`text-[16px] font-bold truncate w-full`}>
                      {link.title}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 flex flex-col items-center gap-3 ${isDark ? "text-white/20" : "text-slate-400"}`}>
              <FolderOpen size={40} strokeWidth={1} />
              <p className="text-sm">{t("no_links")}</p>
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="w-full text-center text-sm py-6 text-slate-500">
          © 2026 Your Dashboard
        </footer>
      </div>

      <SyncIndicator />
      <ConsoleLog />
      <LinkManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
        background={background}
        prefs={{ cardOpacity, themeColor, themeMode, themeColorAuto }}
        onUpdateAppearance={(url, opacity, color) => { }}
        onUpdateTheme={(color, auto) => { }}
        isDefaultCode={isDefaultCode}
      />
    </div>
  );
};

export default App;
