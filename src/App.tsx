import React, { useState } from "react";
import { FolderOpen } from "lucide-react";
import { SmartIcon } from "./components/SmartIcon";
import { SearchBar } from "./components/SearchBar";
import { GlassCard } from "./components/GlassCard";
import { LinkManagerModal } from "./components/LinkManagerModal";
import { ToastContainer } from "./components/Toast";
import { SyncIndicator } from "./components/SyncIndicator";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { CategoryNav } from "./components/CategoryNav";
import { Footer } from "./components/Footer";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useDashboardLogic } from "./hooks/useDashboardLogic";
import { useLanguage } from "./contexts/LanguageContext";
import { ThemeMode } from "./types";

const App: React.FC = () => {
  const { state, actions } = useDashboardLogic();
  const {
    loading,
    categories,
    background,
    cardOpacity,
    themeColor,
    themeColorAuto,
    themeMode,
    isDefaultCode,
    activeCategory,
    activeSubCategoryId,
    maxContainerWidth,
    cardWidth,
    cardHeight,
    gridColumns,
  } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  if (loading) {
    return (
      <div
        className={`min-h-screen relative flex flex-col items-center pt-8 md:pt-12 px-4 ${
          themeMode === ThemeMode.Dark ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <BackgroundLayer background={background} isDark={themeMode === ThemeMode.Dark} />
        <div className="w-full max-w-[1000px] relative z-10">
          <SkeletonLoader 
            cardOpacity={cardOpacity} 
            themeMode={themeMode} 
            maxContainerWidth={maxContainerWidth}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            gridColumns={gridColumns}
          />
        </div>
      </div>
    );
  }

  const isDark = themeMode === ThemeMode.Dark;
  const adaptiveGlassBlur = isDark ? 50 : 30;

  const visibleCategory = categories.find((c) => c.id === activeCategory);
  const visibleSubCategory = visibleCategory?.subCategories.find(
    (s) => s.id === activeSubCategoryId
  );

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white font-sans flex flex-col ${
        isDark ? "text-slate-100" : "text-slate-800"
      }`}
    >
      <ToastContainer />

      <style>{`
        :root {
          --theme-primary: ${themeColor};
          --theme-hover: color-mix(in srgb, ${themeColor}, black 10%);
          --theme-active: color-mix(in srgb, ${themeColor}, black 20%);
          --theme-light: color-mix(in srgb, ${themeColor}, white 30%);
          --glass-blur: ${adaptiveGlassBlur}px;
        }
      `}</style>

      {/* Background Layer */}
      <BackgroundLayer background={background} isDark={isDark} />

      {/* Navigation - Dynamic Island */}
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        activeSubCategoryId={activeSubCategoryId}
        onCategoryClick={actions.handleMainCategoryClick}
        onSubCategoryClick={actions.handleSubCategoryClick}
        themeMode={themeMode}
        toggleTheme={actions.toggleTheme}
        toggleLanguage={actions.toggleLanguage}
        openSettings={() => setIsModalOpen(true)}
      />

      <div 
        className="container mx-auto px-4 flex-1 flex flex-col items-center pt-8 md:pt-12 relative z-[10]"
        style={{ maxWidth: `${maxContainerWidth}px` }}
      >
        <section className="w-full mb-14 animate-fade-in-down relative z-[70] isolation-isolate">
          <SearchBar themeMode={themeMode} />
        </section>

        <main className="w-full pb-20 relative z-[10] space-y-8">
          {visibleSubCategory ? (
            <div key={visibleSubCategory.id} className="">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${
                    isDark ? "to-white/20" : "to-slate-400/30"
                  }`}
                ></div>
                <h3
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 ${
                    isDark ? "text-white/50" : "text-slate-400"
                  }`}
                >
                  {visibleSubCategory.title === "Default"
                    ? visibleCategory?.title
                    : visibleSubCategory.title}
                </h3>
                <div
                  className={`h-[1px] flex-1 bg-gradient-to-l from-transparent ${
                    isDark ? "to-white/20" : "to-slate-400/30"
                  }`}
                ></div>
              </div>

              <div
                key={visibleSubCategory.id}
                className="grid gap-3 sm:gap-4 w-full"
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                }}
              >
                {visibleSubCategory.items.map((link, index) => {
                  // Fallback icon logic: Use provided icon, or try to get favicon from URL
                  const iconSource =
                    link.icon ||
                    `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`;

                  return (
                    <GlassCard
                      key={link.id}
                      hoverEffect={true}
                      opacity={cardOpacity}
                      themeMode={themeMode}
                      onClick={() => window.open(link.url, "_blank")}
                      className="flex flex-col items-center justify-center text-center p-2 relative group animate-card-enter"
                      style={{
                        height: `${cardHeight}px`,
                        animationFillMode: "backwards",
                      }}
                      title={
                        link.description
                          ? `${link.description}\n${link.url}`
                          : `${link.title}\n${link.url}`
                      }
                    >
                      <div
                        className={`mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] flex items-center justify-center h-6 w-6 ${
                          isDark ? "text-white/90" : "text-slate-700"
                        }`}
                      >
                        <SmartIcon
                          icon={iconSource}
                          imgClassName="w-6 h-6 object-contain drop-shadow-md rounded-md"
                          size={24}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-medium truncate w-full px-1 transition-colors duration-300 ${
                          isDark
                            ? "text-white/80 group-hover:text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {link.title}
                      </span>
                    </GlassCard>
                  );
                })}
              </div>

              {visibleSubCategory.items.length === 0 && (
                <div
                  className={`text-center py-16 flex flex-col items-center gap-3 ${
                    isDark ? "text-white/20" : "text-slate-400"
                  }`}
                >
                  <FolderOpen size={40} strokeWidth={1} />
                  <p className="text-sm">{t("no_links")}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`text-center py-12 ${
                isDark ? "text-white/30" : "text-slate-400"
              }`}
            >
              No sub-categories found. Click Settings to configure.
            </div>
          )}
        </main>
      </div>

      <SyncIndicator />

      <Footer isDark={isDark} />

      <LinkManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        setCategories={actions.setCategories}
        background={background}
        prefs={{ 
          cardOpacity, 
          themeColor, 
          themeMode, 
          themeColorAuto,
          maxContainerWidth,
          cardWidth,
          cardHeight,
          gridColumns
        }}
        onUpdateAppearance={(url: string, opacity: number, color?: string, layout?: any, themeAuto?: boolean) => 
          actions.handleUpdateAppearance(url, opacity, color, layout, themeAuto)
        }
        isDefaultCode={isDefaultCode}
      />
    </div>
  );
};

export default App;
