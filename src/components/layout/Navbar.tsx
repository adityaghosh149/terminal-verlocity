"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Terminal,
  Trophy,
  BarChart3,
  Settings,
  User as UserIcon,
  Zap,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { AuthModal } from "@/components/auth/AuthModal";

export function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal, logout, checkAuth } = useAuthStore();
  const { theme } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const navLinks = [
    { href: "/game", label: "Play Game", icon: Terminal },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard", label: "Profile & Stats", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
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

          {/* Right side: Themes & Authentication */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Custom Styled Theme Switcher */}
            <ThemeSelector />

            {user ? (
              <div className="flex items-center gap-2 font-mono">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-bold shadow-sm"
                  title={`Logged in as ${user.name}`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>@{user.username}</span>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/80 border border-border text-xs font-mono font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="text-xs font-display font-bold px-3 py-1.5 rounded-lg border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex items-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  LOG IN
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="text-xs bg-primary text-primary-foreground font-display font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 glow-primary shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  REGISTER
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Auth Modal */}
      <AuthModal />
    </>
  );
}
