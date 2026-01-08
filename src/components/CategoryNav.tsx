import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, Globe, Moon, Sun, Settings } from "lucide-react";
import { Category, ThemeMode } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  activeSubCategoryId: string;
  onCategoryClick: (cat: Category) => void;
  onSubCategoryClick: (catId: string, subId: string) => void;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  openSettings: () => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategory,
  activeSubCategoryId,
  onCategoryClick,
  onSubCategoryClick,
  themeMode,
  toggleTheme,
  toggleLanguage,
  openSettings,
}) => {
  const { t } = useLanguage();
  const isDark = themeMode === ThemeMode.Dark;

  // Navigation Animation State
  const [navPillStyle, setNavPillStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

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
  }, [activeCategory, categories]);

  const adaptiveGlassBlur = isDark ? 50 : 30;

  const dropdownClasses = isDark ? "apple-glass-dark" : "apple-glass-light";
  const navDropdownItemBase = `text-left px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center justify-between group/item`;

  const getDropdownItemClass = (isActive: boolean) => {
    if (isActive) {
      return `${navDropdownItemBase} bg-[var(--theme-primary)] text-white font-medium shadow-md`;
    }
    return `${navDropdownItemBase} ${
      isDark
        ? "text-white/90 hover:bg-white/10"
        : "text-slate-700 hover:bg-black/5"
    } active:scale-[0.98]`;
  };

  const navIconColor = isDark ? "text-white/60" : "text-slate-600";

  const islandContainerClass = `relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
    isDark
      ? "bg-slate-900/60 border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]"
      : "bg-white/60 border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]"
  }`;

  const islandStyle = {
    backdropFilter: `blur(${adaptiveGlassBlur}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${adaptiveGlassBlur}px) saturate(180%)`,
  };

  const slidingPillClass = `absolute top-0 bottom-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] pointer-events-none ${
    isDark
      ? "bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5"
      : "bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] border border-black/5"
  }`;

  const categoryButtonBase = `
    relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors duration-300 cursor-pointer select-none
    active:scale-95 transition-transform ease-out
  `;

  const categoryButtonColors = (isActive: boolean) => {
    if (isActive) {
      return isDark ? "text-white font-medium" : "text-slate-900 font-medium";
    }
    return isDark
      ? "text-white/50 hover:text-white/80"
      : "text-slate-500 hover:text-slate-800";
  };

  const actionButtonClass = `
    relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 ease-out
    active:scale-90 active:shadow-inner
    hover:bg-[var(--theme-primary)]/20 hover:text-current hover:border-[var(--theme-primary)]/10
    border border-transparent
    ${navIconColor}
    active:bg-[var(--theme-primary)]/30
  `;

  const glassLayerNoise = (
    <div className="absolute inset-0 z-0 glass-noise pointer-events-none opacity-50 rounded-full" />
  );

  const glassLayerRim = (
    <div
      className="absolute inset-0 pointer-events-none rounded-full z-0"
      style={{
        boxShadow: isDark
          ? "inset 0 1px 0 0 rgba(255,255,255,0.08)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.4)",
      }}
    />
  );

  const glassLayerSheen = (
    <div
      className={`absolute inset-0 pointer-events-none z-0 bg-gradient-to-br ${
        isDark
          ? "from-white/[0.02] via-transparent to-black/[0.1]"
          : "from-white/[0.3] via-transparent to-transparent"
      } rounded-full`}
    />
  );

  // ... 前面逻辑保持不变 ...
return (
  <nav className="flex flex-col items-center py-6 px-4 relative z-[100] gap-4">
    {/* 第一行：主导航灵动岛 */}
    <div className={islandContainerClass} style={islandStyle}>
      {glassLayerNoise}
      {glassLayerRim}
      {glassLayerSheen}

      <div className="relative z-10 flex items-center gap-1 flex-wrap justify-center max-w-full px-1">
        <div className="relative flex items-center" ref={navTrackRef}>
          {/* 滑动背景块 */}
          <div
            className={slidingPillClass}
            style={{
              left: navPillStyle.left,
              width: navPillStyle.width,
              opacity: navPillStyle.opacity,
              height: "100%",
            }}
          />
          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => { tabsRef.current[cat.id] = el; }}
              onClick={() => onCategoryClick(cat)}
              className={`${categoryButtonBase} ${categoryButtonColors(activeCategory === cat.id)}`}
            >
              <span className="truncate max-w-[120px] relative z-10">{cat.title}</span>
            </button>
          ))}
        </div>

        <div className={`w-[1px] h-5 mx-2 rounded-full ${isDark ? "bg-white/10" : "bg-slate-400/20"}`}></div>

        <div className="flex items-center gap-1">
          <button onClick={toggleLanguage} className={actionButtonClass}><Globe size={18} /></button>
          <button onClick={toggleTheme} className={actionButtonClass}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
          <button onClick={openSettings} className={actionButtonClass}><Settings size={18} /></button>
        </div>
      </div>
    </div>

    {/* 第二行：平铺的二级子菜单 (点击主分类后常驻) */}
    {(() => {
      const activeCat = categories.find(c => c.id === activeCategory);
      // 如果子分类多于1个，或者唯一的子分类不是 "Default"，则显示二级导航
      const hasSubCats = activeCat && (
        activeCat.subCategories.length > 1 || 
        (activeCat.subCategories.length === 1 && activeCat.subCategories[0].title !== "Default")
      );
      
      if (!hasSubCats) return null;

      return (
        <div className="flex justify-center w-full animate-fade-in">
          <div className={`${dropdownClasses} rounded-2xl p-1.5 flex flex-row flex-wrap justify-center items-center gap-2 shadow-lg border border-white/10`}>
            {activeCat.subCategories.map((sub) => {
              const isSubActive = activeSubCategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSubCategoryClick(activeCategory, sub.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs transition-all duration-300 flex items-center gap-2
                    ${isSubActive 
                      ? "bg-[var(--theme-primary)] text-white shadow-md font-bold scale-105" 
                      : isDark ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-black/5"
                    }`}
                >
                  {sub.title}
                  {isSubActive && <div className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    })()}
  </nav>
);
};
