import React, { useRef, useState } from "react";
import { Database, Download, Upload, AlertCircle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { storageService } from "../../services/storage";
import { Category, UserPreferences } from "../../types";

interface DataTabProps {
  onImport: (
    categories: Category[],
    background?: string,
    prefs?: UserPreferences
  ) => void;
  background: string;
  prefs: UserPreferences;
}

export const DataTab: React.FC<DataTabProps> = ({
  onImport,
  background,
  prefs,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleExport = () => {
    storageService.exportData();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedData = await storageService.importData(file);

      // Callback to parent to update state
      onImport(
        importedData.categories || [],
        importedData.background,
        importedData.prefs
      );

      setImportStatus({ type: "success", message: t("import_success") });
    } catch (error: any) {
      setImportStatus({
        type: "error",
        message: error.message || t("import_error"),
      });
    }
    e.target.value = "";
    setTimeout(() => setImportStatus({ type: null, message: "" }), 6000);
  };

  return (
    <div className="p-8 w-full max-w-2xl mx-auto overflow-y-auto animate-fade-in custom-scrollbar">
      <div className="space-y-6">
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-5 items-start">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-blue-400 font-bold tracking-tight mb-1">
              {t("data_risk_title")}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t("data_risk_desc")}
            </p>
          </div>
        </div>
        <div className="panel-base p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-1 tracking-tight">
            {t("backup_config")}
          </h3>
          <p className="text-xs text-slate-500 mb-6">{t("backup_desc")}</p>
          <button
            onClick={handleExport}
            className="btn-secondary w-full py-3 font-bold uppercase tracking-widest group"
          >
            <Download
              size={18}
              className="text-blue-400 group-hover:translate-y-0.5 transition-transform"
            />{" "}
            {t("download_backup")}
          </button>
        </div>
        <div className="panel-base p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-1 tracking-tight">
            {t("restore_config")}
          </h3>
          <p className="text-xs text-slate-500 mb-6">{t("restore_desc")}</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary w-full py-3 font-bold uppercase tracking-widest group"
          >
            <Upload
              size={18}
              className="text-emerald-400 group-hover:-translate-y-0.5 transition-transform"
            />{" "}
            {t("select_import")}
          </button>
          {importStatus.type && (
            <div
              className={`mt-4 p-4 rounded-xl text-xs font-bold border flex items-center gap-3 ${
                importStatus.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              <AlertCircle size={18} /> {importStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
