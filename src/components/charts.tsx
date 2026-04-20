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
import { SERIES_COLORS } from "@/lib/chart-palette";

const statusColors: Record<string, string> = {
  active: "hsl(142 71% 45%)",
  expiring: "hsl(36 85% 58%)",
  critical: "hsl(25 90% 55%)",
  expired: "hsl(0 65% 55%)",
};

const GRID_STROKE = "hsl(var(--border) / 0.5)";
const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

/** Fixed-height box so Recharts fills exactly — removes stray bottom gap in cards. */
function ChartBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full overflow-hidden", className)}>{children}</div>;
}

function CustomTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-none min-w-[140px]">
      {label != null && label !== "" && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground text-[11px]">
              {format ? format(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: Array<{ label: string; revenue: number; students: number }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[220px] md:h-[248px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
            width={44}
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
        <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(data.length / 5) - 1)}
            tickMargin={6}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
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
          <Pie
            data={data}
            cx="50%"
            cy="46%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            strokeWidth={2}
            stroke="hsl(var(--card))"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
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
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="16%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={26} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
          <Bar dataKey="value" name="Students" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.key] || SERIES_COLORS[i % SERIES_COLORS.length]} />
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
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="14%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${fmtINRShort(v)}`}
          />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={88} />
          <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
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
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${fmtINRShort(v)}`}
            width={44}
          />
          <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} cursor={{ fill: "hsl(var(--muted) / 0.15)" }} />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: 4, color: "hsl(var(--muted-foreground))" }}
            iconType="circle"
            iconSize={7}
          />
          <Bar dataKey="studio" name="Studio" stackId="rev" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} maxBarSize={44} />
          <Bar dataKey="freelance" name="Freelance" stackId="rev" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function MonthlyEnrolmentsBarChart({ data }: { data: Array<{ label: string; students: number }> }) {
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="16%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
          <Bar dataKey="students" name="New students" radius={[4, 4, 0, 0]} maxBarSize={40} fill="hsl(var(--chart-2))" />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

export function ValidityBarChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const bucketColors: Record<string, string> = {
    Expired: "hsl(0 65% 55%)",
    "0-7d": "hsl(25 90% 55%)",
    "8-30d": "hsl(36 85% 58%)",
    "31-90d": "hsl(168 55% 55%)",
    "90d+": "hsl(142 71% 45%)",
  };
  return (
    <ChartBox className="h-[192px] sm:h-[210px] md:h-[232px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="16%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={26} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={bucketColors[entry.label] || SERIES_COLORS[i % SERIES_COLORS.length]} />
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
