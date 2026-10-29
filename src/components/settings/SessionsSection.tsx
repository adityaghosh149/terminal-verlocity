"use client";

import React from "react";
import { Laptop, Trash2 } from "lucide-react";
import { AuthSession } from "@/types";

interface SessionsSectionProps {
  sessions: AuthSession[];
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllSessions: () => void;
}

export function SessionsSection({
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
}: SessionsSectionProps) {
  return (
    <section className="p-6 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md shadow-xl text-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-bold font-display text-foreground">
          <Laptop className="h-4 w-4 text-primary" />
          Active Login Sessions
        </div>
        <button
          onClick={onRevokeAllSessions}
          className="text-destructive hover:underline text-xs flex items-center gap-1 font-mono"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sign Out of All Sessions
        </button>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40 font-mono"
          >
            <div>
              <div className="font-bold text-foreground flex items-center gap-2">
                {s.userAgent}
                {s.isCurrent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Last active: {new Date(s.lastUsedAt).toLocaleString()}
              </div>
            </div>

            {!s.isCurrent && (
              <button
                onClick={() => onRevokeSession(s.sessionId)}
                className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10"
              >
                Sign Out
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
