import React from "react";
import { GlassCard } from "./GlassCard";

interface SkeletonLoaderProps {
  cardOpacity: number;
  themeMode: "light" | "dark";
  maxContainerWidth?: number;
  cardWidth?: number;
  cardHeight?: number;
  gridColumns?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  cardOpacity,
  themeMode,
  maxContainerWidth = 900,
  cardWidth = 96,
  cardHeight = 96,
  gridColumns = 6,
}) => {
  const isDark = themeMode === "dark";

  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="w-full max-w-[400px] mx-auto h-12 rounded-2xl bg-white/5 border border-white/10 mb-14" />

      {/* Grid Skeleton */}
      <div
        className="mx-auto w-full"
        style={{ maxWidth: `${maxContainerWidth}px` }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
          <div className="w-24 h-3 bg-white/10 rounded-full" />
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
        </div>

        <div
          className="grid gap-3 sm:gap-4 w-full"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          }}
        >
          {[...Array(16)].map((_, i) => (
            <GlassCard
              key={i}
              opacity={cardOpacity}
              themeMode={themeMode as any}
              className="flex flex-col items-center justify-center p-2"
              style={{ height: `${cardHeight}px` }}
            >
              <div className="w-6 h-6 rounded-md bg-white/10 mb-2" />
              <div className="w-12 h-2 bg-white/10 rounded-full" />
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
