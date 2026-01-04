import React, { useState } from "react";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { storageService } from "../../services/storage";

export const SecurityTab: React.FC = () => {
  const { t } = useLanguage();
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current) {
      setPasswordStatus({ type: "error", message: t("current_code_err") });
      return;
    }
    if (passwordForm.new.length < 4) {
      setPasswordStatus({ type: "error", message: t("code_length_err") });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordStatus({ type: "error", message: t("code_mismatch") });
      return;
    }

    const success = await storageService.updateAccessCode(
      passwordForm.current,
      passwordForm.new
    );

    if (success) {
      setPasswordStatus({ type: "success", message: t("code_updated") });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } else {
      setPasswordStatus({ type: "error", message: t("current_code_err") });
    }
    setTimeout(() => setPasswordStatus({ type: null, message: "" }), 4000);
  };

  return (
    <div className="p-8 w-full max-w-2xl mx-auto overflow-y-auto animate-fade-in custom-scrollbar">
      <div className="bg-slate-800/40 p-8 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t("access_control")}
            </h3>
            <p className="text-sm text-slate-500">{t("access_desc")}</p>
          </div>
        </div>
        <form onSubmit={handleUpdate} className="space-y-5 max-w-sm mx-auto">
          <div>
            <label className="label-xs mb-2 tracking-[0.2em]">
              {t("current_code")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              className="input-primary py-3 px-4 focus:border-red-500"
            />
          </div>
          <div>
            <label className="label-xs mb-2 tracking-[0.2em]">
              {t("new_code")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
              className="input-primary py-3 px-4 focus:border-red-500"
            />
          </div>
          <div>
            <label className="label-xs mb-2 tracking-[0.2em]">
              {t("confirm_code")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              className="input-primary py-3 px-4 focus:border-red-500"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[10px] font-bold text-slate-500 flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
              {showPassword ? t("hide_codes") : t("show_codes")}
            </button>
            <button
              type="submit"
              className="bg-red-500/80 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg shadow-red-500/20"
            >
              {t("update_code_btn")}
            </button>
          </div>
          {passwordStatus.type && (
            <div
              className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-3 ${
                passwordStatus.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              <AlertCircle size={18} />
              {passwordStatus.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
