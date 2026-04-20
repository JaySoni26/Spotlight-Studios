"use client";
import * as React from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { fmtINR, fmtINRShort } from "@/lib/utils";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const statusColors: Record<string, string> = {
  active: "hsl(142 71% 45%)",
  expiring: "hsl(36 85% 58%)",
  critical: "hsl(25 90% 55%)",
  expired: "hsl(0 65% 55%)",
};

function CustomTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover/95 backdrop-blur px-3 py-2 shadow-md text-xs">
      {label && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{format ? format(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: Array<{ label: string; revenue: number; students: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${fmtINRShort(v)}`} />
        <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          fill="url(#revGrad)"
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EnrolmentLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={Math.floor(data.length / 6)} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="count" name="New Students" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BatchPieChart({ data }: { data: Array<{ name: string; value: number; revenue?: number }> }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="hsl(var(--background))"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={chartColors[i % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={40}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StatusBarChart({ data }: { data: Array<{ name: string; value: number; key: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" name="Students" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={statusColors[entry.key] || chartColors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopBatchesBarChart({ data }: { data: Array<{ name: string; revenue: number; students: number }> }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${fmtINRShort(v)}`} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={90} />
        <Tooltip content={<CustomTooltip format={(v: number) => `₹${fmtINR(v)}`} />} />
        <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} fill="hsl(var(--chart-1))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ValidityBarChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const bucketColors: Record<string, string> = {
    "Expired": "hsl(0 65% 55%)",
    "0-7d": "hsl(25 90% 55%)",
    "8-30d": "hsl(36 85% 58%)",
    "31-90d": "hsl(168 55% 55%)",
    "90d+": "hsl(142 71% 45%)",
  };
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={bucketColors[entry.label] || chartColors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
      No data yet
    </div>
  );
}
