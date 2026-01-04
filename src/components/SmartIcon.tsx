import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface SmartIconProps {
  icon: string | undefined;
  className?: string; // Container class
  imgClassName?: string; // Specific image class
  size?: number;
}

export const SmartIcon: React.FC<SmartIconProps> = ({
  icon,
  className = "",
  imgClassName = "",
  size = 20,
}) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Default fallback icon
  const DefaultIcon = Icons.Globe; // Changed to Globe for better generic representation

  useEffect(() => {
    // Reset status when icon URL changes
    setStatus("loading");
  }, [icon]);

  if (!icon) {
    return <DefaultIcon size={size} className={className} strokeWidth={1.5} />;
  }

  // Case 1: URL Image
  if (icon.startsWith("http") || icon.startsWith("data:")) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Placeholder / Fallback - Visible while loading or on error */}
        {(status === "loading" || status === "error") && (
          <DefaultIcon 
            size={size} 
            className={`absolute inset-0 m-auto text-slate-400/50 ${status === "loading" ? "animate-pulse" : ""}`} 
            strokeWidth={1.5} 
          />
        )}
        
        {/* Actual Image */}
        {status !== "error" && (
          <img
            src={icon}
            alt={icon}
            loading="lazy"
            decoding="async"
            className={`transition-opacity duration-300 ease-out ${imgClassName} ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        )}
      </div>
    );
  }

  // Case 2: Lucide Icon
  // @ts-ignore
  const IconComponent = Icons[icon] as React.FC<LucideProps>;
  if (IconComponent) {
    return <IconComponent size={size} className={className} strokeWidth={1.5} />;
  }

  // Case 3: Emoji or Text
  return (
    <span
      className={`text-xl leading-none filter drop-shadow-md select-none ${className}`}
      style={{ fontSize: size }}
    >
      {icon}
    </span>
  );
};
