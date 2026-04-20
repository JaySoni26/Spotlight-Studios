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
