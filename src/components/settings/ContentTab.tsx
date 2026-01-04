import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  FolderPlus,
  Folder,
  Smile,
  ChevronDown,
  Pencil,
  X,
  Link as LinkIcon,
} from "lucide-react";
import * as Icons from "lucide-react";
import { Category, LinkItem, SubCategory } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { IconPicker } from "../IconPicker";
import { useCategoryDragDrop } from "../../hooks/useCategoryDragDrop";
import { getFaviconUrl } from "../../utils/favicon";

interface ContentTabProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  faviconApi?: string;
}

type LinkFormData = Partial<LinkItem> & { subCategoryId: string };

export const ContentTab: React.FC<ContentTabProps> = ({
  categories,
  onUpdateCategories,
  faviconApi,
}) => {
  const { t } = useLanguage();

  // --- UI State ---
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSubMenus, setCollapsedSubMenus] = useState<Set<string>>(
    new Set()
  );

  // --- Category States ---
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryTitle, setEditCategoryTitle] = useState("");

  // --- SubMenu States ---
  const [isAddingSubMenu, setIsAddingSubMenu] = useState(false);
  const [newSubMenuTitle, setNewSubMenuTitle] = useState("");
  const [editingSubMenuId, setEditingSubMenuId] = useState<string | null>(null);
  const [editSubMenuTitle, setEditSubMenuTitle] = useState("");

  // --- Link Form States ---
  const [targetSubMenuId, setTargetSubMenuId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkFormData, setLinkFormData] = useState<LinkFormData>({
    title: "",
    url: "",
    description: "",
    icon: "",
    subCategoryId: "",
  });

  // --- Icon Picker State ---
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const iconPickerRef = useRef<HTMLDivElement>(null);

  // Computed State
  const isAnyEditing =
    editingCategoryId !== null ||
    editingSubMenuId !== null ||
    targetSubMenuId !== null ||
    editingLinkId !== null ||
    isAddingSubMenu;

  // --- Drag and Drop Hook ---
  const {
    draggedCategoryIndex,
    dragOverCategoryIndex,
    draggedLink,
    dragOverLink,
    dragOverSubMenuId,
    handleDragStartCategory,
    handleDragOverCategory,
    handleDragLeaveCategory,
    handleDropCategory,
    handleDragStartLink,
    handleDragEnterLink,
    handleDragOverSubMenu,
    handleDragLeaveSubMenu,
    handleDropLinkToSubMenu,
    handleDropLink,
    resetDragState,
  } = useCategoryDragDrop({
    categories,
    onUpdateCategories,
    selectedCategoryId,
    setSelectedCategoryId,
    isAnyEditing,
    collapsedSubMenus,
    setCollapsedSubMenus,
  });

  // Initial Selection Logic
  useEffect(() => {
    if (
      categories.length > 0 &&
      (!selectedCategoryId ||
        !categories.find((c) => c.id === selectedCategoryId))
    ) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Click Outside Listener for Icon Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconPickerRef.current &&
        !iconPickerRef.current.contains(event.target as Node)
      ) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Category Handlers ---
  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      title: newCategoryTitle,
      subCategories: [
        { id: Date.now().toString() + "-gen", title: "Default", items: [] },
      ],
    };
    onUpdateCategories([...categories, newCat]);
    setNewCategoryTitle("");
    setSelectedCategoryId(newCat.id);
  };

  const handleUpdateCategoryTitle = (id: string) => {
    if (!editCategoryTitle.trim()) {
      setEditingCategoryId(null);
      return;
    }
    onUpdateCategories(
      categories.map((c) =>
        c.id === id ? { ...c, title: editCategoryTitle } : c
      )
    );
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(t("delete_cat_confirm", { name }))) {
      const updated = categories.filter((c) => c.id !== id);
      onUpdateCategories(updated);
      if (selectedCategoryId === id && updated.length > 0)
        setSelectedCategoryId(updated[0].id);
    }
  };

  // --- SubMenu Handlers ---
  const handleAddSubMenu = () => {
    if (!newSubMenuTitle.trim() || !selectedCategoryId) return;
    const newSub: SubCategory = {
      id: Date.now().toString(),
      title: newSubMenuTitle,
      items: [],
    };
    onUpdateCategories(
      categories.map((c) =>
        c.id === selectedCategoryId
          ? { ...c, subCategories: [...c.subCategories, newSub] }
          : c
      )
    );
    setNewSubMenuTitle("");
    setIsAddingSubMenu(false);
  };

  const handleAddLinkDirectly = () => {
    if (!selectedCategoryId) return;
    const newSubId = Date.now().toString();
    const newSub: SubCategory = { id: newSubId, title: "Default", items: [] };
    onUpdateCategories(
      categories.map((c) =>
        c.id === selectedCategoryId
          ? { ...c, subCategories: [...c.subCategories, newSub] }
          : c
      )
    );
    setTargetSubMenuId(newSubId);
    setEditingLinkId(null);
    setLinkFormData({
      title: "",
      url: "",
      description: "",
      icon: "",
      subCategoryId: newSubId,
    });
  };

  const handleDeleteSubMenu = (subId: string, title: string) => {
    if (window.confirm(t("delete_submenu_confirm", { name: title }))) {
      onUpdateCategories(
        categories.map((c) =>
          c.id === selectedCategoryId
            ? {
                ...c,
                subCategories: c.subCategories.filter((s) => s.id !== subId),
              }
            : c
        )
      );
    }
  };

  const handleUpdateSubMenuTitle = (subId: string) => {
    if (!editSubMenuTitle.trim()) return;
    onUpdateCategories(
      categories.map((c) =>
        c.id === selectedCategoryId
          ? {
              ...c,
              subCategories: c.subCategories.map((s) =>
                s.id === subId ? { ...s, title: editSubMenuTitle } : s
              ),
            }
          : c
      )
    );
    setEditingSubMenuId(null);
  };

  const toggleSubMenu = (subId: string) => {
    const newSet = new Set(collapsedSubMenus);
    if (newSet.has(subId)) {
      newSet.delete(subId);
    } else {
      newSet.add(subId);
    }
    setCollapsedSubMenus(newSet);
  };

  // --- Link Handlers ---
  const openAddLink = (subId: string) => {
    setTargetSubMenuId(subId);
    setEditingLinkId(null);
    setLinkFormData({
      title: "",
      url: "",
      description: "",
      icon: "",
      subCategoryId: subId,
    });
    setIconSearch("");
    setShowIconPicker(false);

    const newCollapsed = new Set(collapsedSubMenus);
    newCollapsed.delete(subId);
    setCollapsedSubMenus(newCollapsed);
  };

  const openEditLink = (subId: string, item: LinkItem) => {
    setTargetSubMenuId(subId);
    setEditingLinkId(item.id);
    setLinkFormData({
      title: item.title,
      url: item.url,
      description: item.description || "",
      icon: item.icon || "",
      subCategoryId: subId,
    });
    setIconSearch("");
    setShowIconPicker(false);
  };

  const handleSaveLink = () => {
    if (
      !linkFormData.title ||
      !linkFormData.url ||
      !selectedCategoryId ||
      !targetSubMenuId
    )
      return;

    let finalIcon = linkFormData.icon;
    if (!finalIcon && linkFormData.url) {
      finalIcon = getFaviconUrl(linkFormData.url, faviconApi) || "Link";
    }

    const newItem: LinkItem = {
      id: editingLinkId || Date.now().toString(),
      title: linkFormData.title,
      url: linkFormData.url,
      description: linkFormData.description || "",
      icon: finalIcon || "Link",
    };

    onUpdateCategories(
      categories.map((cat) =>
        cat.id === selectedCategoryId
          ? {
              ...cat,
              subCategories: cat.subCategories.map((sub) => {
                if (sub.id === targetSubMenuId) {
                  return editingLinkId
                    ? {
                        ...sub,
                        items: sub.items.map((i) =>
                          i.id === editingLinkId ? newItem : i
                        ),
                      }
                    : { ...sub, items: [...sub.items, newItem] };
                }
                return sub;
              }),
            }
          : cat
      )
    );
    closeLinkForm();
  };

  const handleDeleteLink = (subId: string, linkId: string) => {
    if (window.confirm("Delete this link?")) {
      onUpdateCategories(
        categories.map((cat) =>
          cat.id === selectedCategoryId
            ? {
                ...cat,
                subCategories: cat.subCategories.map((sub) =>
                  sub.id === subId
                    ? {
                        ...sub,
                        items: sub.items.filter((i) => i.id !== linkId),
                      }
                    : sub
                ),
              }
            : cat
        )
      );
    }
  };

  const closeLinkForm = () => {
    setTargetSubMenuId(null);
    setEditingLinkId(null);
    setLinkFormData({
      title: "",
      url: "",
      description: "",
      icon: "",
      subCategoryId: "",
    });
    setShowIconPicker(false);
  };

  // --- Rendering Helpers ---
  const renderIcon = (iconValue: string | undefined, size = 16) => {
    const defaultIcon = <Icons.Link size={size} className="text-slate-400" />;
    if (!iconValue) return defaultIcon;
    if (iconValue.startsWith("http") || iconValue.startsWith("data:")) {
      return (
        <img
          src={iconValue}
          alt=""
          className="object-contain rounded-sm"
          style={{ width: size, height: size }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    // @ts-ignore
    const IconComponent = Icons[iconValue];
    if (IconComponent)
      return <IconComponent size={size} className="text-slate-400" />;
    return (
      <span className="leading-none" style={{ fontSize: size }}>
        {iconValue}
      </span>
    );
  };

  const renderLinkForm = () => (
    <div className="bg-slate-950/40 border-t border-white/[0.08] p-4 animate-fade-in backdrop-blur-md relative z-20">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="label-xs">
            {t("label_title")}
          </label>
          <input
            type="text"
            value={linkFormData.title}
            onChange={(e) =>
              setLinkFormData({ ...linkFormData, title: e.target.value })
            }
            placeholder={t("title_placeholder")}
            className="input-primary"
            autoFocus
          />
        </div>
        <div className="col-span-2 sm:col-span-1 relative" ref={iconPickerRef}>
          <label className="label-xs">
            {t("label_icon")}
          </label>
          <div className="relative group/icon">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              {renderIcon(linkFormData.icon, 18)}
            </div>
            <input
              type="text"
              value={linkFormData.icon}
              onFocus={() => setShowIconPicker(true)}
              onChange={(e) => {
                setLinkFormData({ ...linkFormData, icon: e.target.value });
                setIconSearch(e.target.value);
              }}
              placeholder={t("icon_placeholder")}
              className="input-primary pl-10 pr-10"
            />
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>
          <IconPicker
            show={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            value={linkFormData.icon || ""}
            onChange={(val) => setLinkFormData({ ...linkFormData, icon: val })}
            searchTerm={iconSearch}
            onSearchChange={setIconSearch}
            pickerRef={iconPickerRef}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label-xs">
            {t("label_url")}
          </label>
          <input
            type="text"
            value={linkFormData.url}
            onChange={(e) =>
              setLinkFormData({ ...linkFormData, url: e.target.value })
            }
            placeholder={t("url_placeholder")}
            className="input-primary"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label-xs">
            {t("label_desc")}
          </label>
          <input
            type="text"
            value={linkFormData.description}
            onChange={(e) =>
              setLinkFormData({ ...linkFormData, description: e.target.value })
            }
            placeholder={t("desc_placeholder")}
            className="input-primary"
          />
        </div>
        <div className="col-span-2 flex gap-2 pt-1">
          <button
            onClick={closeLinkForm}
            className="flex-1 btn-secondary"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSaveLink}
            className="flex-1 btn-primary"
          >
            {editingLinkId ? <Save size={14} /> : <Plus size={14} />}
            {editingLinkId ? t("update_link_card") : t("add_link_card")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-full animate-fade-in">
      {/* Sidebar - Categories */}
      <div className="w-64 border-r border-white/[0.08] flex flex-col bg-slate-950/30">
        <div className="p-4 border-b border-white/[0.08] h-14 flex items-center">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {t("sidebar_categories")}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              draggable={!isAnyEditing}
              onDragStart={(e) => handleDragStartCategory(e, index)}
              onDragOver={(e) => handleDragOverCategory(e, index, cat.id)}
              onDragLeave={handleDragLeaveCategory}
              onDragEnd={resetDragState}
              onDrop={(e) => handleDropCategory(e, index, cat.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                selectedCategoryId === cat.id
                  ? "bg-[var(--theme-primary)]/10 border-[var(--theme-primary)] text-[var(--theme-primary)]"
                  : "text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-[var(--theme-primary)]"
              } ${
                draggedCategoryIndex === index
                  ? draggedCategoryIndex === index
                    ? "opacity-40 border-dashed border-[var(--theme-primary)]"
                    : "opacity-40 border-dashed border-white/20"
                  : ""
              } ${
                dragOverCategoryIndex === index &&
                draggedCategoryIndex !== index
                  ? "bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] shadow-themed-light"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <GripVertical
                  size={14}
                  className={`shrink-0 ${
                    isAnyEditing
                      ? "text-slate-800 cursor-not-allowed"
                      : "text-slate-700 group-hover:text-slate-500 cursor-grab active:cursor-grabbing"
                  }`}
                />
                {editingCategoryId === cat.id ? (
                  <input
                    autoFocus
                    className="bg-slate-900 border border-[var(--theme-primary)] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
                    value={editCategoryTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditCategoryTitle(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleUpdateCategoryTitle(cat.id)
                    }
                    onBlur={() => handleUpdateCategoryTitle(cat.id)}
                  />
                ) : (
                  <span className="truncate text-sm font-semibold">
                    {cat.title}
                  </span>
                )}
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategoryId(cat.id);
                    setEditCategoryTitle(cat.title);
                  }}
                  className="p-1 text-slate-500 hover:text-white rounded"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id, cat.title);
                  }}
                  className="p-1 text-slate-500 hover:text-red-400 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/[0.08] bg-slate-950/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              placeholder={t("add_category_placeholder")}
              className="input-primary rounded-md px-2 py-1.5 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="shrink-0 bg-white/5 border border-white/5 hover:bg-[var(--theme-primary)] text-white px-2 rounded-md transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Submenus and Links */}
      <div className="flex-1 flex flex-col bg-slate-900 relative">
        <div className="px-6 border-b border-white/[0.08] flex items-center gap-4 bg-white/[0.01] h-14 shrink-0 backdrop-blur-md">
          <div className="relative flex-1 max-w-md">
            <Icons.Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder={t("search_links_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary rounded-full pl-9 pr-4 py-1.5 text-xs"
            />
          </div>
          <button
            onClick={() => setIsAddingSubMenu(!isAddingSubMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
              isAddingSubMenu
                ? "bg-white/10 border-white/20 text-white"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {isAddingSubMenu ? <X size={14} /> : <FolderPlus size={14} />}{" "}
            {isAddingSubMenu ? t("cancel") : t("add_submenu")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isAddingSubMenu && (
            <div className="mb-6 bg-slate-800/40 border border-white/[0.08] p-4 rounded-xl animate-fade-in-down flex gap-3 items-center">
              <input
                autoFocus
                type="text"
                placeholder={t("new_submenu_placeholder")}
                value={newSubMenuTitle}
                onChange={(e) => setNewSubMenuTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubMenu()}
                className="input-primary focus:border-emerald-500 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddSubMenu}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-lg shadow-emerald-500/20"
              >
                {t("add_category_btn")}
              </button>
            </div>
          )}

          <div className="space-y-6">
            {categories.find((c) => c.id === selectedCategoryId)?.subCategories
              .length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-6">
                <Folder size={48} strokeWidth={1} className="opacity-30" />
                <p className="text-sm font-medium">{t("no_submenus")}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsAddingSubMenu(true)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest border border-white/5 flex items-center gap-2"
                  >
                    <FolderPlus size={14} /> {t("add_submenu")}
                  </button>
                  <button
                    onClick={handleAddLinkDirectly}
                    className="px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[var(--theme-primary)]/20"
                  >
                    <LinkIcon size={14} /> {t("add_link_directly")}
                  </button>
                </div>
              </div>
            ) : (
              categories
                .find((c) => c.id === selectedCategoryId)
                ?.subCategories.map((sub) => {
                  const filteredItems = sub.items.filter(
                    (item) =>
                      item.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      item.url.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  if (searchQuery && filteredItems.length === 0) return null;
                  const isCollapsed = collapsedSubMenus.has(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className={`
                      bg-slate-800/40 border rounded-xl overflow-hidden shadow-sm transition-all duration-300
                      ${
                        dragOverSubMenuId === sub.id
                          ? "border-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/5"
                          : "border-white/[0.08]"
                      }
                    `}
                      onDragOver={(e) => handleDragOverSubMenu(e, sub.id)}
                      onDragLeave={handleDragLeaveSubMenu}
                      onDrop={(e) => handleDropLinkToSubMenu(e, sub.id)}
                    >
                      <div
                        className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors group/header"
                        onClick={() => toggleSubMenu(sub.id)}
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            size={16}
                            className={`text-slate-500 transition-transform duration-300 ${
                              isCollapsed ? "-rotate-90" : "rotate-0"
                            }`}
                          />
                          {editingSubMenuId === sub.id ? (
                            <input
                              autoFocus
                              className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none"
                              value={editSubMenuTitle}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditSubMenuTitle(e.target.value)
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleUpdateSubMenuTitle(sub.id)
                              }
                              onBlur={() => handleUpdateSubMenuTitle(sub.id)}
                            />
                          ) : (
                            <h4 className="font-bold text-white/90 text-sm flex items-center gap-2 tracking-tight">
                              <Folder
                                size={14}
                                className="text-[var(--theme-light)]"
                              />
                              {sub.title}
                            </h4>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-60 sm:group-hover/header:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubMenuId(sub.id);
                              setEditSubMenuTitle(sub.title);
                            }}
                            className="p-1.5 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-md hover:bg-white/10"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubMenu(sub.id, sub.title);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-md hover:bg-white/10"
                          >
                            <Trash2 size={13} />
                          </button>
                          <div className="w-px h-3 bg-white/[0.08] mx-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddLink(sub.id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors ${
                              targetSubMenuId === sub.id && !editingLinkId
                                ? "bg-[var(--theme-primary)] text-white"
                                : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Plus size={12} /> {t("add_new_link")}
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="animate-fade-in origin-top">
                          {targetSubMenuId === sub.id && renderLinkForm()}
                          <div className="p-3">
                            {filteredItems.length === 0 ? (
                              <div className="p-6 text-center text-slate-600 text-xs italic tracking-wider">
                                {searchQuery
                                  ? t("no_links_search")
                                  : t("no_links")}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {filteredItems.map((item, index) => (
                                  <div
                                    key={item.id}
                                    draggable={!isAnyEditing}
                                    onDragStart={(e) =>
                                      handleDragStartLink(e, sub.id, index)
                                    }
                                    onDragEnter={() =>
                                      handleDragEnterLink(sub.id, index)
                                    }
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={resetDragState}
                                    onDrop={(e) =>
                                      handleDropLink(e, sub.id, index)
                                    }
                                    className={`
                                    group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all border
                                    aspect-[4/3]
                                    ${
                                      draggedLink?.subId === sub.id &&
                                      draggedLink?.index === index
                                        ? "opacity-40 border-dashed border-white/20"
                                        : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10"
                                    }
                                    ${
                                      dragOverLink?.subId === sub.id &&
                                      dragOverLink?.index === index &&
                                      draggedLink?.index !== index
                                        ? "ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/10 z-10 scale-105"
                                        : ""
                                    }
                                  `}
                                  >
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditLink(sub.id, item);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-white bg-black/50 hover:bg-[var(--theme-primary)] rounded-md backdrop-blur-sm transition-colors"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteLink(sub.id, item.id);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-400 bg-black/50 hover:bg-red-500/20 rounded-md backdrop-blur-sm transition-colors"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>

                                    <div
                                      className={`absolute top-2 left-2 text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity ${
                                        isAnyEditing ? "hidden" : ""
                                      }`}
                                    >
                                      <GripVertical size={14} />
                                    </div>

                                    <div className="mb-2 w-8 h-8 flex items-center justify-center text-slate-300">
                                      {renderIcon(item.icon, 24)}
                                    </div>

                                    <div className="w-full text-center px-1">
                                      <div className="text-xs font-medium text-slate-200 truncate">
                                        {item.title}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate opacity-60 mt-0.5">
                                        {item.url
                                          ? (() => {
                                              try {
                                                return new URL(
                                                  item.url.startsWith("http")
                                                    ? item.url
                                                    : `https://${item.url}`
                                                ).hostname.replace("www.", "");
                                              } catch {
                                                return "";
                                              }
                                            })()
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
