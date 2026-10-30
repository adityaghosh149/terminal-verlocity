import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rounds a number to at most 2 decimal places, avoiding floating point precision glitches.
 */
export function round2(num: number | null | undefined): number {
  if (num === null || num === undefined || isNaN(Number(num))) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(round2(num));
}

export function formatPercent(ratio: number): string {
  return `${round2(ratio * 100)}%`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
