{/* 主内容区域：核心逻辑修改 */}
      <main className="w-full pb-20 relative z-[10] space-y-12">
        {visibleCategory ? (
          <div key={activeCategory} className="space-y-12 flex flex-col">
            {/* 排序逻辑：把点击选中的 subCategoryId 排在数组第一位 */}
            {[...visibleCategory.subCategories]
              .sort((a, b) => {
                if (a.id === activeSubCategoryId) return -1;
                if (b.id === activeSubCategoryId) return 1;
                return 0;
              })
              .map((sub) => (
                <div 
                  key={sub.id} 
                  className={`transition-all duration-700 animate-fade-in ${
                    sub.id === activeSubCategoryId ? "order-first" : ""
                  }`}
                >
                  {/* 子分类标题线 */}
                  {(sub.title !== "Default" || visibleCategory.subCategories.length > 1) && (
                    <div className="flex items-center gap-6 mb-8 mt-4">
                      <div className={`h-[2px] transition-all duration-500 ${
                        sub.id === activeSubCategoryId 
                          ? "w-16 bg-[var(--theme-primary)]" 
                          : "w-8 bg-slate-400/30"
                      }`}></div>
                      <h3 className={`text-lg font-black transition-all ${
                        sub.id === activeSubCategoryId ? "text-[var(--theme-primary)] scale-110" : "text-slate-400"
                      }`}>
                        {sub.title === "Default" ? visibleCategory.title : sub.title}
                      </h3>
                      <div className="h-[2px] flex-1 bg-slate-400/10"></div>
                    </div>
                  )}

                  {/* 卡片网格 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sub.items.map((link) => (
                      <GlassCard
                        key={link.id}
                        // ... 之前的 GlassCard 属性保持不变 ...
                        className={`h-20 flex flex-row items-center px-5 gap-5 group animate-card-enter ${
                          sub.id === activeSubCategoryId ? "ring-1 ring-[var(--theme-primary)]/40" : ""
                        }`}
                      >
                         {/* ... 卡片内部图标和文字内容保持不变 ... */}
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 opacity-30">No Data</div>
        )}
      </main>
