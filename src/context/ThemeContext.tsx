"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "blue" | "midnight" | "forest" | "rose" | "ocean" | "obsidian";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** swatch colours shown in the picker [bg, primary] */
  swatches: [string, string];
  dark: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "blue",
    name: "Scholar Blue",
    description: "Modern premium blue — the default ARISE look",
    swatches: ["#FAFBFC", "#5B5FFF"],
    dark: false,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Rich dark mode with bright warm gold accents",
    swatches: ["#1C1B1F", "#D4AE84"],
    dark: true,
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep obsidian with electric violet highlights",
    swatches: ["#0F0E1A", "#8B5CF6"],
    dark: true,
  },
  {
    id: "forest",
    name: "Forest",
    description: "Crisp white & lush emerald green energy",
    swatches: ["#F4FAF6", "#22A663"],
    dark: false,
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft cream canvas with warm rose pink accent",
    swatches: ["#FDF6F5", "#E0566A"],
    dark: false,
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool off-white & deep cyan teal accent",
    swatches: ["#F2F8FC", "#2E8FB5"],
    dark: false,
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themeDefinition: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "blue",
  setTheme: () => {},
  themeDefinition: THEMES[0],
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("blue");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("arise-theme") as ThemeId | null;
    if (saved && THEMES.find((t) => t.id === saved)) {
      applyTheme(saved);
      setThemeState(saved);
    }
  }, []);

  const applyTheme = (id: ThemeId) => {
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("arise-theme", id);
  };

  const setTheme = (id: ThemeId) => {
    applyTheme(id);
    setThemeState(id);
  };

  const themeDefinition = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeDefinition }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
