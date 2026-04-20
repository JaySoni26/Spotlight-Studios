import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtINR = (n: number | null | undefined) => {
  if (n == null || isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n));
};

export const fmtINRShort = (n: number | null | undefined) => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return (v / 10000000).toFixed(1) + "Cr";
  if (v >= 100000) return (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return (v / 1000).toFixed(1) + "k";
  return String(v);
};

export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try { return format(parseISO(iso), "d MMM yyyy"); } catch { return "—"; }
};

export const fmtDateShort = (iso?: string | null) => {
  if (!iso) return "—";
  try { return format(parseISO(iso), "d MMM"); } catch { return "—"; }
};

export const endDateOf = (startDate: string, validityDays: number) => {
  return format(addDays(parseISO(startDate), validityDays), "yyyy-MM-dd");
};

export const daysUntil = (iso: string) => {
  return differenceInCalendarDays(parseISO(iso), new Date());
};

export type StatusKey = "active" | "expiring" | "critical" | "expired";

export const getStatus = (endDate: string): { key: StatusKey; label: string; days: number } => {
  const days = daysUntil(endDate);
  if (days < 0) return { key: "expired", label: `Expired ${Math.abs(days)}d ago`, days };
  if (days <= 3) return { key: "critical", label: `${days}d left`, days };
  if (days <= 10) return { key: "expiring", label: `${days}d left`, days };
  return { key: "active", label: `${days}d left`, days };
};

export const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const today = () => format(new Date(), "yyyy-MM-dd");
