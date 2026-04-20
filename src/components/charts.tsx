"use client";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { cn, fmtINR, fmtINRShort } from "@/lib/utils";
import { MEMBERSHIP_STATUS_DOT, SERIES_COLORS, VALIDITY_BUCKET_DOT } from "@/lib/chart-palette";

const GRID_STROKE = "hsl(var(--border) / 0.5)";
const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

/** Insets plot inside the SVG — keep bottom modest so axis labels don’t leave a tall empty band under the chart. */
const CHART_MARGIN = { top: 6, right: 4, left: 2, bottom: 8 };

/** Fixed-height box so Recharts fills CardContent width without clipping card rounding. */
function ChartBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full min-w-0 overflow-hidden", className)}>{children}</div>;
}

function CustomTooltip({ active, payload, label, format, dotFillForRow }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-none min-w-[140px]">
      {label != null && label !== "" && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => {
          const row = p.payload as { key?: string; label?: string } | undefined;
          const dotKey = row?.key ?? row?.label;
          const dotFill =
            (dotKey && dotFillForRow?.[dotKey]) ||
            (typeof p.fill === "string" && !p.fill.startsWith("url(") ? p.fill : null) ||
            (typeof p.color === "string" && !p.color.startsWith("url(") ? p.color : null) ||
            "hsl(var(--muted-foreground))";
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: dotFill }} />
                {p.name}
              </span>
              <span className="font-semibold tabular-nums text-foreground text-[11px]">
                {format ? format(p.value) : p.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: Array<{ label: string; revenue: number; students: number }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[220px] md:h-[248px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.2} />
              <stop offset="40%" stopColor="hsl(var(--chart-1))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${fmtINRShort(v)}`}
            width={46}
          />
          <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#revGrad)"
            activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--chart-1))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function EnrolmentLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(data.length / 5) - 1)}
            tickMargin={6}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            name="New students"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--chart-2))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function BatchPieChart({ data }: { data: Array<{ name: string; value: number; revenue?: number }> }) {
  if (!data.length) return <EmptyState className="h-[192px] sm:h-[240px]" />;
  return (
    <ChartBox className="h-[220px] sm:h-[252px] md:h-[268px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 4 }}>
          <defs>
            {data.map((_, i) => {
              const base = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <radialGradient key={i} id={`pie-slice-grad-${i}`} cx="42%" cy="42%" r="78%">
                  <stop offset="0%" stopColor={base} stopOpacity={0.95} />
                  <stop offset="72%" stopColor={base} stopOpacity={0.72} />
                  <stop offset="100%" stopColor={base} stopOpacity={0.45} />
                </radialGradient>
              );
            })}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="46%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2.5}
            cornerRadius={6}
            dataKey="value"
            nameKey="name"
            strokeWidth={2}
            stroke="hsl(var(--card))"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#pie-slice-grad-${i})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            layout="horizontal"
            wrapperStyle={{ fontSize: "10px", paddingTop: 4, color: "hsl(var(--muted-foreground))" }}
            iconType="circle"
            iconSize={7}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function StatusBarChart({ data }: { data: Array<{ name: string; value: number; key: string }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="14%">
          <defs>
            <linearGradient id="status-grad-trial" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(258 90% 44%)" />
              <stop offset="45%" stopColor="hsl(292 72% 50%)" />
              <stop offset="100%" stopColor="hsl(328 82% 62%)" />
            </linearGradient>
            <linearGradient id="status-grad-active" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(142 65% 34%)" />
              <stop offset="100%" stopColor="hsl(152 71% 52%)" />
            </linearGradient>
            <linearGradient id="status-grad-expiring" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(32 88% 44%)" />
              <stop offset="100%" stopColor="hsl(42 96% 58%)" />
            </linearGradient>
            <linearGradient id="status-grad-critical" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(18 92% 42%)" />
              <stop offset="100%" stopColor="hsl(28 96% 56%)" />
            </linearGradient>
            <linearGradient id="status-grad-expired" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(0 72% 38%)" />
              <stop offset="100%" stopColor="hsl(0 65% 58%)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
          <Tooltip
            content={<CustomTooltip dotFillForRow={MEMBERSHIP_STATUS_DOT} />}
            cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
          />
          <Bar dataKey="value" name="Students" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={`url(#status-grad-${entry.key})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function TopBatchesBarChart({ data }: { data: Array<{ name: string; revenue: number; students: number }> }) {
  if (!data.length) return <EmptyState className="h-[192px] sm:h-[248px]" />;
  return (
    <ChartBox className="h-[192px] sm:h-[232px] md:h-[256px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 8, left: 2, bottom: 10 }} barCategoryGap="14%">
          <defs>
            {data.map((_, i) => {
              const c = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <linearGradient key={i} id={`top-batch-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={c} stopOpacity={0.88} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.48} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${fmtINRShort(v)}`}
          />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={92} />
          <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#top-batch-grad-${i})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function StudioFreelanceStackedBarChart({
  data,
}: {
  data: Array<{ label: string; studio: number; freelance: number }>;
}) {
  return (
    <ChartBox className="h-[192px] sm:h-[220px] md:h-[248px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${fmtINRShort(v)}`}
            width={46}
          />
          <defs>
            <linearGradient id="stack-grad-studio" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.55} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="stack-grad-freelance" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={1} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: 4, color: "hsl(var(--muted-foreground))" }}
            iconType="circle"
            iconSize={7}
          />
          <Bar dataKey="studio" name="Studio" stackId="rev" fill="url(#stack-grad-studio)" radius={[0, 0, 0, 0]} maxBarSize={44} />
          <Bar dataKey="freelance" name="Freelance" stackId="rev" fill="url(#stack-grad-freelance)" radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function MonthlyEnrolmentsBarChart({ data }: { data: Array<{ label: string; students: number }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="16%">
          <defs>
            <linearGradient id="enrol-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
          <Bar dataKey="students" name="New students" radius={[4, 4, 0, 0]} maxBarSize={40} fill="url(#enrol-grad)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function ValidityBarChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const bucketGradId: Record<string, string> = {
    Expired: "validity-grad-expired",
    "0-7d": "validity-grad-07",
    "8-30d": "validity-grad-830",
    "31-90d": "validity-grad-3190",
    "90d+": "validity-grad-90p",
  };
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="16%">
          <defs>
            <linearGradient id="validity-grad-expired" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(0 72% 40%)" />
              <stop offset="100%" stopColor="hsl(0 65% 58%)" />
            </linearGradient>
            <linearGradient id="validity-grad-07" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(18 90% 42%)" />
              <stop offset="100%" stopColor="hsl(25 90% 56%)" />
            </linearGradient>
            <linearGradient id="validity-grad-830" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(30 88% 44%)" />
              <stop offset="100%" stopColor="hsl(36 85% 60%)" />
            </linearGradient>
            <linearGradient id="validity-grad-3190" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(168 48% 38%)" />
              <stop offset="100%" stopColor="hsl(168 55% 56%)" />
            </linearGradient>
            <linearGradient id="validity-grad-90p" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(142 58% 36%)" />
              <stop offset="100%" stopColor="hsl(142 71% 48%)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
          <Tooltip
            content={<CustomTooltip dotFillForRow={VALIDITY_BUCKET_DOT} />}
            cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
          />
          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={`url(#${bucketGradId[entry.label] ?? "validity-grad-90p"})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function EmptyState({ className = "h-[200px]" }: { className?: string }) {
  return (
    <div className={cn(className, "flex items-center justify-center text-sm text-muted-foreground")}>
      No data yet
    </div>
  );
}
