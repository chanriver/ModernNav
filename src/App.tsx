import React, { useMemo, useState } from "react";
import { ThemeMode, Category, LinkItem } from "./types";
import { CategoryNav } from "./components/CategoryNav";
import { GlassCard } from "./components/GlassCard";
import { SmartIcon } from "./components/SmartIcon";
import { Footer } from "./components/Footer";
import { ConsoleLog } from "./components/ConsoleLog";
import { useTheme } from "./contexts/ThemeContext";
import { categories as rawCategories } from "./data/categories";

export default function App() {
  const { themeMode } = useTheme();

  const [activeCategory, setActiveCategory] = useState<string>(
    rawCategories[0]?.id || ""
  );
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>("");

  /* =============================
   * 1️⃣ 当前激活的主分类
   * ============================= */
  const currentCategory = useMemo(
    () => rawCategories.find((c) => c.id === activeCategory),
    [activeCategory]
  );

  /* =============================
   * 2️⃣ 二级分类显示在主分类下面
   * ============================= */
  const subCategories = currentCategory?.subCategories ?? [];

  /* =============================
   * 3️⃣ 卡片显示逻辑（核心）
   * ============================= */
  const displaySections = useMemo(() => {
    if (!currentCategory) return [];

    // 👉 点击主分类：显示所有子分类 + 标题
    if (!activeSubCategoryId) {
      return currentCategory.subCategories.map((sub) => ({
        id: sub.id,
        title: sub.title,
        items: sub.items,
      }));
    }

    // 👉 点击二级分类：该子分类排最前
    const activeSub = currentCategory.subCategories.find(
      (s) => s.id === activeSubCategoryId
    );

    if (!activeSub) return [];

    return [
      {
        id: activeSub.id,
        title: activeSub.title,
        items: activeSub.items,
      },
    ];
  }, [currentCategory, activeSubCategoryId]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* =============================
       * 顶部灵动岛导航（原样保留）
       * ============================= */}
      <CategoryNav
        categories={rawCategories}
        activeCategory={activeCategory}
        activeSubCategoryId={activeSubCategoryId}
        onCategoryClick={(cat) => {
          setActiveCategory(cat.id);
          setActiveSubCategoryId(""); // 点击主分类，重置二级
        }}
        onSubCategoryClick={(catId, subId) => {
          setActiveCategory(catId);
          setActiveSubCategoryId(subId);
        }}
        themeMode={themeMode}
        toggleTheme={() => {}}
        toggleLanguage={() => {}}
        openSettings={() => {}}
      />

      {/* =============================
       * 二级分类（显示在主分类下面）
       * ============================= */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 px-4 mt-3">
          {subCategories.map((sub) => {
            const isActive = sub.id === activeSubCategoryId;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubCategoryId(sub.id)}
                className={`
                  px-5 py-2 rounded-xl font-bold transition-all
                  ${
                    isActive
                      ? "bg-[var(--theme-primary)] text-white scale-105 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }
                `}
                style={{
                  fontSize: "16px", // ✅ 二级分类字号变大
                }}
              >
                {sub.title}
              </button>
            );
          })}
        </div>
      )}

      {/* =============================
       * 主内容区（卡片）
       * ============================= */}
      <main className="flex-1 px-4 mt-6 space-y-10">
        {displaySections.map((section) => (
          <section key={section.id}>
            {/* 二级分类标题 */}
            <h2 className="text-lg font-bold mb-4 px-2">
              {section.title}
            </h2>

            {/* 卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.items.map((item: LinkItem) => (
                <GlassCard
                  key={item.id}
                  hoverEffect
                  className="h-20 flex items-center px-5 gap-4 cursor-pointer"
                  onClick={() => window.open(item.url, "_blank")}
                >
                  {/* 图标 */}
                  <div className="flex-shrink-0">
                    <SmartIcon
                      icon={item.icon}
                      size={36}
                      imgClassName="w-9 h-9 rounded-md"
                    />
                  </div>

                  {/* 站点名称 */}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[16px] font-bold truncate">
                      {item.title}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* =============================
       * Console + Footer（原样保留）
       * ============================= */}
      <ConsoleLog />
      <Footer />
    </div>
  );
}
