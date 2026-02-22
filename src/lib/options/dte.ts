import { DTE_THRESHOLDS } from "@/lib/constants";
import type { DteUrgency } from "@/types/options";

export function calculateDTE(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getDteUrgency(dte: number): DteUrgency {
  if (dte <= DTE_THRESHOLDS.CRITICAL) return "critical";
  if (dte <= DTE_THRESHOLDS.WARNING) return "warning";
  if (dte <= DTE_THRESHOLDS.SAFE) return "safe";
  return "comfortable";
}

export function getDteBadgeVariant(
  urgency: DteUrgency
): "destructive" | "secondary" | "default" | "outline" {
  switch (urgency) {
    case "critical":
      return "destructive";
    case "warning":
      return "secondary";
    case "safe":
      return "default";
    case "comfortable":
      return "outline";
  }
}

export function getDteColor(urgency: DteUrgency): string {
  switch (urgency) {
    case "critical":
      return "text-red-500";
    case "warning":
      return "text-yellow-500";
    case "safe":
      return "text-green-500";
    case "comfortable":
      return "text-blue-500";
  }
}
