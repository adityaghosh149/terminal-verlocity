"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Check, ChevronDown } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { Theme } from "@/types";

interface ThemeOption {
  id: Theme;
  label: string;
  color: string;
}

const THEMES: ThemeOption[] = [
  { id: "midnight", label: "Midnight", color: "#00f0ff" },
  { id: "cyberpunk", label: "Cyberpunk", color: "#ff007f" },
  { id: "terminal", label: "Terminal Green", color: "#00ff66" },
  { id: "amber", label: "Amber Protocol", color: "#ffb703" },
  { id: "light", label: "Light Mode", color: "#0284c7" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative font-mono text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 px-2.5 py-1.5 text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
        aria-label="Select theme"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shadow-sm shrink-0"
          style={{ backgroundColor: activeTheme.color }}
        />
        <span className="font-semibold hidden sm:inline">{activeTheme.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/40 mb-1">
            Theme Palette
          </div>
          {THEMES.map((t) => {
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
