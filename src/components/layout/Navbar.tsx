"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Terminal,
  Trophy,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { Theme } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { theme, setTheme } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const navLinks = [
    { href: "/game", label: "Play Arcade", icon: Terminal },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard", label: "Telemetry & Stats", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const themes: { id: Theme; label: string }[] = [
    { id: "midnight", label: "Midnight" },
    { id: "cyberpunk", label: "Cyberpunk" },
    { id: "terminal", label: "Terminal" },
    { id: "amber", label: "Amber" },
    { id: "light", label: "Light" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold tracking-wider text-foreground group-hover:text-primary transition-colors">
              TERMINAL<span className="text-primary font-black">.VELOCITY</span>
            </span>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase -mt-1 hidden sm:block">
              Probability Arcade
            </div>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Themes & User Account */}
        <div className="flex items-center gap-3">
          {/* Quick Theme Switcher */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="hidden sm:block text-xs bg-secondary/80 border border-border text-foreground rounded-md px-2 py-1 cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            aria-label="Theme selector"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-foreground flex items-center justify-end gap-1">
                  {user.displayName}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    LVL {user.level}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Score: {user.bestScore.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-secondary/50 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
