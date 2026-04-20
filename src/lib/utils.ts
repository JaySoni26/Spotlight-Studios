import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  addDays,
  differenceInCalendarDays,
  format,
  min as minDate,
  parseISO,
  startOfDay,
} from "date-fns";
import type { DbClient } from "@/lib/db";

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

/** Indian mobile: exactly 10 digits, store digits-only; display as XXXXX XXXXX */
export const IN_MOBILE_DIGITS = 10;

export function digitsOnlyPhone(input: string): string {
  return (input ?? "").replace(/\D/g, "").slice(0, IN_MOBILE_DIGITS);
}

export function formatINMobileDisplay(digitsOrRaw: string): string {
  const d = digitsOnlyPhone(digitsOrRaw);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export const endDateOf = (startDate: string, validityDays: number) => {
  return format(addDays(parseISO(startDate), validityDays), "yyyy-MM-dd");
};

/** Membership end date: trials use `trial_end_date`; paid uses start + validity. */
export function getStudentEndDate(row: {
  enrollment_kind?: string | null;
  start_date: string;
  validity_days: number;
  trial_end_date?: string | null;
}): string {
  const kind = row.enrollment_kind || "paid";
  if (kind === "trial" && row.trial_end_date) return row.trial_end_date;
  return endDateOf(row.start_date, row.validity_days);
}

export function isTrialStudent(row: { enrollment_kind?: string | null }): boolean {
  return (row.enrollment_kind || "paid") === "trial";
}

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

const weekdayMap: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const formatBatchScheduleLabel = (scheduleJson?: string | null, fallback?: string | null) => {
  if (scheduleJson) {
    try {
      const entries = JSON.parse(scheduleJson) as Array<{ day: keyof typeof weekdayMap; time: string }>;
      if (Array.isArray(entries) && entries.length > 0) {
        return entries
          .map((entry) => `${weekdayMap[entry.day] ?? entry.day} ${entry.time}`)
          .join(" · ");
      }
    } catch {
      // Ignore parse error and fallback to old schedule value.
    }
  }
  return fallback ?? null;
};

/** Prorated refund context when removing a student (fee spread evenly over validity_days). */
export function studentRefundBreakdown(student: {
  amount: number;
  validity_days: number;
  start_date: string;
  end_date: string;
}) {
  const amount = Number(student.amount) || 0;
  const validity_days = Math.max(1, Number(student.validity_days) || 1);
  const start = startOfDay(parseISO(student.start_date));
  const end = startOfDay(parseISO(student.end_date));
  const today = startOfDay(new Date());

  const inclusiveDays = (from: Date, to: Date) => differenceInCalendarDays(to, from) + 1;

  let daysUsed = 0;
  if (today < start) {
    daysUsed = 0;
  } else {
    const periodEnd = minDate([today, end]);
    daysUsed = Math.min(validity_days, inclusiveDays(start, periodEnd));
  }

  const consumedValue = Math.round((amount * daysUsed) / validity_days);
  const suggestedRefund = Math.max(0, amount - consumedValue);

  /** Rolling ~30-day “month” cycles from membership start (not calendar month). */
  const CYCLE_DAYS = 30;
  const dailyRate = amount / validity_days;
  let amountThisCycle = 0;
  let cycleRangeLabel = "—";
  let daysInCycleWindow = 0;

  if (today >= start && today <= end) {
    const elapsedInMembership = inclusiveDays(start, minDate([today, end]));
    const cycleIndex = Math.floor((elapsedInMembership - 1) / CYCLE_DAYS);
    const cycleStart = addDays(start, cycleIndex * CYCLE_DAYS);
    const cycleEndNominal = addDays(cycleStart, CYCLE_DAYS - 1);
    /** End of this cycle within the membership (may be shorter than 30d at term end). */
    const cycleWindowEnd = minDate([cycleEndNominal, end]);
    if (cycleStart <= cycleWindowEnd) {
      daysInCycleWindow = inclusiveDays(cycleStart, cycleWindowEnd);
      /** Share of total fee for this full cycle window — not day-by-day “accrued so far”. */
      amountThisCycle = Math.round(dailyRate * daysInCycleWindow);
      const sameCalendarDay = cycleStart.getTime() === cycleWindowEnd.getTime();
      cycleRangeLabel = sameCalendarDay
        ? format(cycleStart, "d MMM yyyy")
        : `${format(cycleStart, "d MMM")} – ${format(cycleWindowEnd, "d MMM yyyy")}`;
    }
  }

  return {
    amountThisCycle,
    cycleRangeLabel,
    daysInCycleWindow,
    daysUsed,
    validity_days,
    consumedValue,
    suggestedRefund,
  };
}

export const verifyDeleteCode = async (d: DbClient, code: string) => {
  const row = (await d.get<{ value: string }>("SELECT value FROM studio_settings WHERE key = 'delete_admin_code'")) as
    | { value: string }
    | undefined;
  const expected = row?.value || "0000";
  return code === expected;
};
