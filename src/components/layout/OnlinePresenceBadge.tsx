"use client";

import React, { useEffect, useState, useRef } from "react";
import { Users } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname } from "next/navigation";

interface OnlinePresenceBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function OnlinePresenceBadge({
  className = "",
  showIcon = true,
}: OnlinePresenceBadgeProps) {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const { user } = useAuthStore();
  const pathname = usePathname();
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    // Generate or fetch tab-level session ID
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem("tv_presence_session_id");
      if (!sid) {
        sid = "tv_sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
        sessionStorage.setItem("tv_presence_session_id", sid);
      }
      sessionIdRef.current = sid;
    }

    const sendHeartbeat = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            username: user?.username || "guest",
            path: pathname || "/",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.onlineCount === "number") {
            setOnlineCount(data.onlineCount);
          }
        }
      } catch {
        // Fallback silently if offline
      }
    };

    // Initial ping
    sendHeartbeat();

    // Pulse heartbeat every 25 seconds
    const interval = setInterval(sendHeartbeat, 25000);

    // Heartbeat on visibility change (when tab becomes visible again)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.username, pathname]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold tracking-wider select-none shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all ${className}`}
      title="Currently active runners across the network"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      {showIcon && <Users className="h-3 w-3 text-emerald-400" />}
      <span>
        {onlineCount} {onlineCount === 1 ? "RUNNER" : "RUNNERS"} ONLINE
      </span>
    </div>
  );
}
