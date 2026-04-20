import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  subtext?: string;
  accent?: "primary" | "success" | "warning" | "danger" | "default";
}

const accentClasses: Record<string, string> = {
  primary: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  default: "text-foreground",
};

export function StatCard({ label, value, icon, change, changeLabel, subtext, accent = "default" }: StatCardProps) {
  const changeDirection = change == null ? null : change > 0 ? "up" : change < 0 ? "down" : "flat";
  const ChangeIcon = changeDirection === "up" ? ArrowUpRight : changeDirection === "down" ? ArrowDownRight : Minus;
  const changeColor =
    changeDirection === "up" ? "text-emerald-500" :
    changeDirection === "down" ? "text-red-500" :
    "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {icon && <div className={cn("opacity-60", accentClasses[accent])}>{icon}</div>}
        </div>
        <div className={cn("font-display text-2xl sm:text-3xl font-semibold tracking-tight", accentClasses[accent])}>
          {value}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {change != null && (
            <span className={cn("flex items-center gap-0.5 font-medium", changeColor)}>
              <ChangeIcon className="h-3 w-3" />
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {(changeLabel || subtext) && (
            <span className="text-muted-foreground">{changeLabel || subtext}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
