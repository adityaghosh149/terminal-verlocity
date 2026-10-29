"use client";

import React, { useRef } from "react";
import { Zap } from "lucide-react";

interface GameBottomBarProps {
  activeTargetId: string | null;
  currentInput: string;
  empCharges: number;
  gameStatus: "ready" | "playing" | "gameover";
  onTriggerEmp: () => void;
  onProcessKey: (char: string) => void;
}

export function GameBottomBar({
  activeTargetId,
  currentInput,
  empCharges,
  gameStatus,
  onTriggerEmp,
  onProcessKey,
}: GameBottomBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-6 py-2.5 border-t border-border/80 bg-secondary/40 flex items-center justify-between z-20 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-muted-foreground">KEYBOARD INTERFACE:</span>
        {activeTargetId ? (
          <span className="text-primary font-bold">
            LOCKED ON [{currentInput}_] // TYPE NEXT CHAR
          </span>
        ) : (
          <span className="text-muted-foreground">
            SCANNING // TYPE ANY PACKET FIRST LETTER TO LOCK TARGET
          </span>
        )}
      </div>

      {/* Mobile touch hidden input */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute -z-10 h-0 w-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 0) {
            onProcessKey(val.charAt(val.length - 1));
            e.target.value = "";
          }
        }}
      />

      <div className="flex items-center gap-3">
        {/* Tactical EMP Defusal Trigger Button */}
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            onTriggerEmp();
          }}
          disabled={empCharges <= 0 || gameStatus !== "playing"}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all shadow-sm ${
            empCharges > 0 && gameStatus === "playing"
              ? "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 glow-primary active:scale-95 cursor-pointer"
              : "bg-secondary/40 text-muted-foreground border border-border/40 opacity-50 cursor-not-allowed"
          }`}
          title="Vaporize lowest imminent threat packet without shield penalty (Tab key)"
        >
          <Zap
            className={`h-3.5 w-3.5 ${
              empCharges > 0 && gameStatus === "playing" ? "text-primary animate-pulse" : ""
            }`}
          />
          <span>[TAB] EMP BLAST ({empCharges})</span>
        </button>

        <button
          onClick={() => {
            if (inputRef.current) inputRef.current.focus();
          }}
          className="sm:hidden text-xs px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/40 font-mono"
        >
          OPEN TOUCH KEYPAD
        </button>
      </div>
    </div>
  );
}
