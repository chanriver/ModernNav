import React from "react";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string; // We'll use lucide icon names or emoji
}

export interface SubCategory {
  id: string;
  title: string;
  items: LinkItem[];
}

export interface Category {
  id: string;
  title: string;
  subCategories: SubCategory[];
}

export interface SearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  icon: React.ReactNode;
}

export enum ThemeMode {
  Dark = "dark",
  Light = "light",
}

export interface UserPreferences {
  cardOpacity: number;
  themeColor?: string;
  themeMode: ThemeMode;
  themeColorAuto?: boolean;
  maxContainerWidth?: number;
  cardWidth?: number;
  cardHeight?: number;
  gridColumns?: number;
}


