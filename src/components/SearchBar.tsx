import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { SearchEngine, ThemeMode } from "../types";
import { SEARCH_ENGINES } from "../constants";

interface SearchBarProps {
  themeMode: ThemeMode;
}

export const SearchBar: React.FC<SearchBarProps> = ({ themeMode }) => {
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(SEARCH_ENGINES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  const isDark = themeMode === ThemeMode.Dark;

  const stateClasses = isDark
    ? `bg-slate-900/40 border-white/10 ${isFocused ? 'bg-slate-900/80 border-[var(--theme-primary)]/50 ring-4 ring-[var(--theme-primary)]/10' : ''}`
    : `bg-white/40 border-slate-200 ${isFocused ? 'bg-white/90 border-[var(--theme-primary)]/50 ring-4 ring-[var(--theme-primary)]/10' : ''}`;

  const containerStyle = {
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(`${selectedEngine.urlTemplate}${encodeURIComponent(query)}`, "_blank");
    setQuery("");
  };

  return (
    /* 核心修改：mt-[-30px] 强制大幅度上移，mb-16 保持与下方内容的距离 */
    <div className="w-full max-w-[640px] mx-auto relative z-[70] mt-[-30px] mb-16 px-4">
      <form onSubmit={handleSearch} className="relative w-full" ref={dropdownRef}>
        <div
          className={`relative flex items-center rounded-2xl transition-all duration-500 h-16 border-2 ${stateClasses} shadow-xl`}
          style={containerStyle}
        >
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`h-full flex items-center gap-2 pl-5 pr-4 rounded-l-2xl border-r ${isDark ? "border-white/10 text-white/70" : "border-slate-200 text-slate-600"} hover:bg-white/5 transition-colors`}
          >
            <span className="w-6 h-6 flex-shrink-0">{selectedEngine.icon}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="搜索你感兴趣的内容..."
            className={`flex-1 h-full bg-transparent px-5 text-xl outline-none transition-all ${isDark ? "text-white placeholder-white/20" : "text-slate-800 placeholder-slate-400"}`}
          />

          <button
            type="submit"
            className={`h-full px-6 flex items-center justify-center transition-all ${isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
          >
            <Search size={24} strokeWidth={2} />
          </button>
        </div>

        {/* 下拉菜单保持之前的巨化设计 */}
        {isDropdownOpen && (
          <div 
            className={`absolute top-full left-0 right-0 mt-4 p-5 ${isDark ? 'bg-slate-800/95 border-white/10' : 'bg-white/95 border-slate-200'} border rounded-[2.5rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] z-[80] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className="grid grid-cols-2 gap-4">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => {
                    setSelectedEngine(engine);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-5 px-5 h-20 rounded-2xl transition-all ${
                    selectedEngine.id === engine.id 
                      ? "bg-[var(--theme-primary)] text-white shadow-lg scale-105" 
                      : `hover:bg-black/5 ${isDark ? "text-white hover:bg-white/10" : "text-slate-800"}`
                  }`}
                >
                  <span className="w-10 h-10 flex-shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
                    {engine.icon}
                  </span>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xl font-semibold leading-tight">{engine.name}</span>
                    <span className="text-xs opacity-60 font-normal">点击切换引擎</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
