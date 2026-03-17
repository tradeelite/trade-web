"use client";

import { cn } from "@/lib/utils";

interface TeAriaBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * TEARIA brand mark: [TE] ARIA
 * TE = TradeElite monogram badge, ARIA = AI Research & Insights Assistant
 */
export function TeAriaBadge({ size = "md", className }: TeAriaBadgeProps) {
  const badgeSize = size === "sm" ? "h-4 w-7 text-[9px]" : size === "lg" ? "h-6 w-10 text-xs" : "h-5 w-8 text-[10px]";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn(
        "inline-flex items-center justify-center rounded font-bold tracking-tight bg-primary text-primary-foreground shrink-0",
        badgeSize
      )}>
        TE
      </span>
      <span className={cn("font-semibold tracking-wide", textSize)}>ARIA</span>
    </span>
  );
}
