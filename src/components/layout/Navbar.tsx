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
import { ThemeSelector } from "@/components/ui/ThemeSelector";
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
    { id: "terminal", label: "Terminal Green" },
    { id: "amber", label: "Amber Protocol" },
    { id: "light", label: "Light Mode" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all glow-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-wider text-foreground group-hover:text-primary transition-colors">
              TERMINAL<span className="text-primary font-black">.VELOCITY</span>
            </span>
            <div className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase -mt-1 hidden sm:block">
              // PROBABILITY ARCADE INTERCEPTOR
            </div>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1.5 font-display text-sm tracking-wide">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
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
          {/* Custom Styled Theme Switcher */}
          <ThemeSelector />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right font-mono">
                <span className="text-xs font-bold text-foreground flex items-center justify-end gap-1.5">
                  {user.displayName}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-bold">
                    LVL {user.level}
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Score: {user.bestScore.toLocaleString()} PTS
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-md hover:bg-destructive/10 transition-colors font-mono"
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
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-secondary/60 transition-colors font-mono font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs bg-primary text-primary-foreground font-display font-bold px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 glow-primary"
              >
                <UserIcon className="h-3.5 w-3.5" />
                ENLIST
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
