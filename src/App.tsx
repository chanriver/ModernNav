import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Link as LinkIcon,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Loader2,
  Github,
  FolderOpen,
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
  // ========================
  // State 管理
  // ========================
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

  // ========================
  // Navigation 动画相关
  // ========================
  const [navPillStyle, setNavPillStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const navTrackRef = useRef<HTMLDivElement>(null);

  const isFirstRender = useRef(true);

  // ========================
  // 工具函数：Hex → RGB
  // ========================
  const hexToRgb = (hex: string) => {
    let s = hex.startsWith("#") ? hex : "#" + hex;
    if (s.length === 4) {
      s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // ========================
  // Effect: 设置主题色 CSS 变量
  // ========================
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    document.documentElement.style.setProperty("--theme-primary-rgb", hexToRgb(themeColor));
    document.documentElement.style.setProperty(
      "--theme-hover",
      `color-mix(in srgb, ${themeColor}, black 10%)`
    );
  }, [themeColor]);

  // ========================
  // 初始数据加载
  // ========================
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

  // ========================
  // 响应式导航 Pill 位置
  // ========================
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

  // ========================
  // 根据背景自动更新主题色
  // ========================
  useEffect(() => {
    const updateTheme = async () => {
      if (!loading && themeColorAuto && (background.startsWith("http") || background.startsWith("data:"))) {
        const color = await getDominantColor(background);
        setThemeColor(color);
      }
    };
    updateTheme();
  }, [background, loading, themeColorAuto]);

  // ========================
  // 点击主分类逻辑
  // ========================
  const handleMainCategoryClick = (cat: Category) => {
    setActiveCategory(cat.id);
    setActiveSubCategoryId(""); // 取消二级分类选择，显示所有卡片
  };

  // ========================
  // 点击二级分类逻辑
  // ========================
  const handleSubCategoryClick = (catId: string, subId: string) => {
    setActiveCategory(catId);
    setActiveSubCategoryId(subId);
  };

  // ========================
  // 显示的卡片逻辑
  // ========================
  const visibleCards = () => {
    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return [];
    if (!activeSubCategoryId) {
      // 未选择二级分类 → 显示所有子分类卡片
      return cat.subCategories.flatMap(sub => sub.items);
    } else {
      // 选择二级分类 → 显示该子分类卡片
      const sub = cat.subCategories.find(s => s.id === activeSubCategoryId);
      return sub ? sub.items : [];
    }
  };

  // ========================
  // 切换语言 & 主题
  // ========================
  const toggleLanguage = () => setLanguage(language === "en" ? "zh" : "en");
  const toggleTheme = () => {
    const newTheme = themeMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    setThemeMode(newTheme);
  };

  const isDark = themeMode === ThemeMode.Dark;
  const isBackgroundUrl = background.startsWith("http") || background.startsWith("data:");

  // ========================
  // 页面加载中状态
  // ========================
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

  // ========================
  // 渲染页面
  // ========================
  return (
    <div className={`min-h-screen relative overflow-x-hidden font-sans flex flex-col ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      <ToastContainer />

      {/* 背景 */}
      <div className="fixed inset-0 z-0">
        {isBackgroundUrl ? (
          <img src={background} alt="Background" className="w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isDark ? 0.8 : 1 }} />
        ) : (
          <div className="w-full h-full transition-opacity duration-700" style={{ background, opacity: isDark ? 1 : 0.9 }} />
        )}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-slate-900/30" : "bg-white/10"}`}></div>
      </div>

      {/* ========================
          导航: 主分类 + 二级分类
      ======================== */}
      <nav className="flex flex-col justify-center items-center py-6 px-4 relative z-[100]">
        <div className="flex gap-4 flex-wrap justify-center max-w-full" ref={navTrackRef}>
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <div key={cat.id} className="flex flex-col items-start">
                {/* 主分类按钮 */}
                <button
                  ref={el => { tabsRef.current[cat.id] = el; }}
                  onClick={() => handleMainCategoryClick(cat)}
                  className={`px-4 py-2 rounded-full font-semibold ${isActive ? "bg-[var(-]()
