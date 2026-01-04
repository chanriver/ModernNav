import React, { useState } from "react";
import { Globe, Type, Terminal, Save, CheckCircle2, Github, Link as LinkIcon, Plus, Trash2, Info } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { UserPreferences, FooterLink } from "../../types";

interface GeneralTabProps {
  prefs: UserPreferences;
  onUpdate: (newPrefs: Partial<UserPreferences>) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ prefs, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    siteTitle: prefs.siteTitle || "ModernNav",
    faviconApi: prefs.faviconApi || "https://favicon.im/{domain}?larger=true",
    footerGithub: prefs.footerGithub || "https://github.com/lyan0220",
    footerLinks: prefs.footerLinks || [],
  });
  const [saveStatus, setSaveStatus] = useState(false);

  const handleSave = () => {
    onUpdate(formData);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

  const addFooterLink = () => {
    setFormData({
      ...formData,
      footerLinks: [...formData.footerLinks, { title: "", url: "" }],
    });
  };

  const removeFooterLink = (index: number) => {
    const newLinks = [...formData.footerLinks];
    newLinks.splice(index, 1);
    setFormData({ ...formData, footerLinks: newLinks });
  };

  const updateFooterLink = (index: number, field: keyof FooterLink, value: string) => {
    const newLinks = [...formData.footerLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, footerLinks: newLinks });
  };

  return (
    <div className="p-6 w-full max-w-2xl mx-auto overflow-y-auto animate-fade-in custom-scrollbar h-full pb-24">
      <div className="space-y-4">
        {/* Row 1: Site Title & GitHub Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Title */}
          <div className="panel-base space-y-3">
            <div className="flex items-center gap-2">
              <Type size={14} className="text-slate-400" />
              <h4 className="label-xs mb-0">{t("label_site_title")}</h4>
            </div>
            <input
              type="text"
              value={formData.siteTitle}
              onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
              className="input-primary"
            />
          </div>

          {/* GitHub Link */}
          <div className="panel-base space-y-3">
            <div className="flex items-center gap-2">
              <Github size={14} className="text-slate-400" />
              <h4 className="label-xs mb-0">{t("label_github_link")}</h4>
            </div>
            <input
              type="text"
              value={formData.footerGithub}
              onChange={(e) => setFormData({ ...formData, footerGithub: e.target.value })}
              className="input-primary font-mono"
            />
          </div>
        </div>

        {/* Row 2: Favicon API */}
        <div className="panel-base space-y-2">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400" />
            <h4 className="label-xs mb-0">{t("label_favicon_api")}</h4>
          </div>
          <div className="space-y-1.5">
            <input
              type="text"
              value={formData.faviconApi}
              onChange={(e) => setFormData({ ...formData, faviconApi: e.target.value })}
              className="input-primary text-xs font-mono"
              placeholder="https://favicon.im/{domain}"
            />
            <div className="flex gap-1.5 items-start px-1">
              <Info size={12} className="text-slate-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t("label_favicon_api_desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Friendship Links */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon size={14} className="text-slate-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t("label_friendship_links")}</h4>
            </div>
            <button
              onClick={addFooterLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Plus size={12} /> {t("btn_add_link")}
            </button>
          </div>
          
          <div className="space-y-2">
            {formData.footerLinks.map((link, index) => (
              <div key={index} className="flex gap-2 group animate-fade-in relative">
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateFooterLink(index, "title", e.target.value)}
                  placeholder="Title"
                  className="input-primary w-32 text-xs"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                  placeholder="https://..."
                  className="input-primary flex-1 text-xs font-mono"
                />
                <button
                  onClick={() => removeFooterLink(index)}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {formData.footerLinks.length === 0 && (
              <p className="text-center py-2 text-slate-700 text-[10px] italic">No friendship links configured.</p>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className={`
              ${saveStatus 
                ? "bg-emerald-500 text-white shadow-emerald-500/20 px-6 py-2.5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2" 
                : "btn-primary w-auto py-2.5 px-6 tracking-[0.2em] text-[10px]"
              }
            `}
          >
            {saveStatus ? <CheckCircle2 size={14} /> : <Save size={14} />}
            <span>{saveStatus ? t("msg_saved") : t("btn_update_settings")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
