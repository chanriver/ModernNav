import React from "react";
import { Link as LinkIcon, Github } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface FooterProps {
  isDark: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDark }) => {
  const { t } = useLanguage();

  return (
    <footer
      className={`relative z-10 py-5 text-center text-[11px] flex flex-col md:flex-row justify-center items-center gap-4 border-t backdrop-blur-sm transition-colors duration-500 ${
        isDark
          ? "text-white/30 border-white/5 bg-black/10"
          : "text-slate-500 border-black/5 bg-white/20"
      }`}
    >
      <div className="flex gap-4">
        <a
          href="https://coyoo.ggff.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] cursor-pointer transition-colors"
          aria-label={t("friendly_links")}
        >
          <LinkIcon size={12} /> {t("friendly_links")}
        </a>
        <a
          href="https://github.com/lyan0220"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-[var(--theme-primary)] cursor-pointer transition-colors"
          aria-label={t("about_us")}
        >
          <LinkIcon size={12} /> {t("about_us")}
        </a>
      </div>
      <div className="flex items-center">
        <p>
          {t("copyright")} © {new Date().getFullYear()} ModernNav
          <span className="mx-2 opacity-50">|</span>
          <span className="opacity-80">{t("powered_by")}</span>
        </p>
        <a
          href="https://github.com/lyan0220/ModernNav"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-semibold hover:text-[var(--theme-primary)] transition-colors"
        >
          Lyan
        </a>
      </div>
    </footer>
  );
};
