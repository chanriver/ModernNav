import React from "react";

interface BackgroundLayerProps {
  background: string;
  isDark: boolean;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  background,
  isDark,
}) => {
  const isBackgroundUrl =
    background.startsWith("http") || background.startsWith("data:");

  return (
    <div className="fixed inset-0 z-0">
      {isBackgroundUrl ? (
        <img
          key={background}
          src={background}
          alt="Background"
          className="w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: isDark ? 0.8 : 1 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = "0";
          }}
        />
      ) : (
        <div
          className="w-full h-full transition-opacity duration-700"
          style={{
            background: background,
            opacity: isDark ? 1 : 0.9,
          }}
        />
      )}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark ? "bg-slate-900/30" : "bg-white/10"
        }`}
      ></div>
    </div>
  );
};
