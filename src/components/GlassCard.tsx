import React from "react";
import { ThemeMode } from "../types";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  opacity?: number; 
  themeMode?: ThemeMode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  onClick,
  opacity = 0.1,
  themeMode = ThemeMode.Dark,
  style,
  ...props
}) => {
  const isDark = themeMode === ThemeMode.Dark;

  const MIN_TINT = isDark ? 0.2 : 0.3;
  const MAX_TINT = isDark ? 0.8 : 0.8;
  const safeAlpha = MIN_TINT + opacity * (MAX_TINT - MIN_TINT);

  const baseColor = isDark
    ? `rgba(15, 23, 42, ${safeAlpha})` 
    : `rgba(255, 255, 255, ${safeAlpha})`;

  const borderColor = isDark ? "border-white/[0.08]" : "border-white/30";
  const shadowClass = isDark
    ? "shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)]" 
    : "shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)]";

  const containerClasses = `
    relative overflow-hidden rounded-2xl border
    transition-all duration-300 ease-out
    group
    ${borderColor}
    ${shadowClass}
    ${
      hoverEffect
        ? `
      hover:scale-[1.02] 
      hover:-translate-y-1 
      hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)]
      ${isDark ? "hover:border-white/20" : "hover:border-white/50"} 
      cursor-pointer`
        : ""
    }
    ${className}
  `;

  const saturation = isDark ? 90 : 180;
  const blurAmount = isDark ? 50 : 25;

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      style={{
        backgroundColor: baseColor,
        backdropFilter: `blur(${blurAmount}px) saturate(${saturation}%)`,
        WebkitBackdropFilter: `blur(${blurAmount}px) saturate(${saturation}%)`,
        ...style,
      }}
      {...props}
    >
      {/* LAYER 0: NOISE TEXTURE */}
      <div className="absolute inset-0 z-0 glass-noise pointer-events-none opacity-40" />

      {/* LAYER 1: INNER RIM LIGHT */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl z-0"
        style={{
          boxShadow: isDark
            ? "inset 0 0.4px 0 0 rgba(255,255,255,0.08)"
            : "inset 0 0.4px 0 0 rgba(255,255,255,0.4)",
        }}
      />

      {/* LAYER 2: SURFACE SHEEN */}
      <div
        className={`absolute inset-0 pointer-events-none z-0 bg-gradient-to-br ${
          isDark
            ? "from-white/[0.05] via-transparent to-black/[0.1]"
            : "from-white/[0.3] via-transparent to-transparent"
        }`}
      />

      {/* LAYER 3: INTERACTIVE HOVER SHIMMER */}
      {hoverEffect && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div
            className={`absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent ${
              isDark ? "via-white/[0.05]" : "via-white/20"
            } to-transparent -translate-x-full group-hover:animate-shimmer`}
          />
        </div>
      )}

      {/* LAYER 4: CONTENT - 修改为 flex-row 布局适应长条框 */}
      <div
        className={`relative z-10 w-full h-full flex items-center pointer-events-none ${
          isDark ? "text-white" : "text-slate-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
