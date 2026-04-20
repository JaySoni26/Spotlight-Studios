/** Distinct, chart-friendly colors (light + dark readable on card backgrounds). */
export const SERIES_COLORS = [
  "hsl(217 91% 56%)",
  "hsl(152 62% 42%)",
  "hsl(271 76% 58%)",
  "hsl(25 95% 48%)",
  "hsl(199 89% 46%)",
  "hsl(330 78% 52%)",
  "hsl(45 93% 48%)",
  "hsl(173 58% 40%)",
] as const;

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

/** Same palette order as batch list — keeps student accents aligned with batch cards. */
export function batchAccentColor(batchId: string | null | undefined, batches: { id: string }[]): string {
  if (!batchId || !batches?.length) return "hsl(var(--primary))";
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx < 0) return "hsl(var(--primary))";
  return seriesColor(idx);
}

/** Avatar border / fill / text — use with `className="border-2 font-semibold"` (matches students table). */
export function batchAvatarStyles(
  batchId: string | null | undefined,
  batches: { id: string }[],
): { borderColor: string; backgroundColor: string; color: string } {
  const ac = batchAccentColor(batchId, batches);
  return {
    borderColor: `color-mix(in srgb, ${ac} 50%, hsl(var(--border)))`,
    backgroundColor: `color-mix(in srgb, ${ac} 16%, hsl(var(--muted) / 0.5))`,
    color: ac,
  };
}

/**
 * Tooltip dots / KPI accents — must match `StatusBarChart` gradient hues (`src/components/charts.tsx`).
 * Single source of truth for “membership status” colour logic on the dashboard.
 */
export const MEMBERSHIP_STATUS_DOT: Record<string, string> = {
  trial: "hsl(292 72% 52%)",
  active: "hsl(142 71% 45%)",
  expiring: "hsl(36 85% 58%)",
  critical: "hsl(25 90% 55%)",
  expired: "hsl(0 65% 55%)",
};

/** Validity bucket chart — aligned with `ValidityBarChart` gradients */
export const VALIDITY_BUCKET_DOT: Record<string, string> = {
  Expired: "hsl(0 65% 55%)",
  "0-7d": "hsl(25 90% 55%)",
  "8-30d": "hsl(36 85% 58%)",
  "31-90d": "hsl(168 55% 55%)",
  "90d+": "hsl(142 71% 45%)",
};

/** Trial pill / chip — ties “Trial” to the student’s current batch colour (students have one `batch_id`). */
export function trialEnrollmentChipStyles(
  batchId: string | null | undefined,
  batches: { id: string }[],
): { color: string; backgroundColor: string; borderColor: string } {
  const ac = batchAccentColor(batchId, batches);
  return {
    color: ac,
    backgroundColor: `color-mix(in srgb, ${ac} 14%, hsl(var(--card)))`,
    borderColor: `color-mix(in srgb, ${ac} 42%, hsl(var(--border)))`,
  };
}
