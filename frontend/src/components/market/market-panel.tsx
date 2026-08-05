import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CandlestickChart,
  Landmark,
  LineChart,
  Scale,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Stat tile contract: label · value · optional signed delta vs. a named period.
 * `value: null` renders the awaiting-data state — deliberately not sample
 * numbers, so nothing on screen can be mistaken for a real quote.
 */
interface Metric {
  key: string;
  label: string;
  icon: typeof Activity;
  value: string | null;
  /** Percent change vs. `period`; direction gets an arrow, never color alone. */
  delta?: number;
  period?: string;
}

const METRICS: Metric[] = [
  { key: "index", label: "Index level", icon: LineChart, value: null },
  { key: "turnover", label: "Turnover", icon: Activity, value: null },
  { key: "breadth", label: "Advancers / decliners", icon: Scale, value: null },
  { key: "cap", label: "Market cap", icon: Landmark, value: null },
];

const CHART_SLOTS = [
  {
    key: "index-performance",
    title: "Index performance",
    hint: "Intraday and historical index levels",
    icon: LineChart,
    span: "sm:col-span-2",
  },
  {
    key: "sector-activity",
    title: "Sector activity",
    hint: "Turnover contribution by sector",
    icon: BarChart3,
    span: "",
  },
  {
    key: "top-movers",
    title: "Top movers",
    hint: "Largest gainers and losers",
    icon: CandlestickChart,
    span: "",
  },
];

export function MarketPanel() {
  return (
    <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-medium leading-tight">
            Market overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Indices, turnover, and breadth at a glance
          </p>
        </div>
        <Badge variant="outline">Data feed not connected</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((metric) => (
          <MetricTile key={metric.key} metric={metric} />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHART_SLOTS.map(({ key, title, hint, icon: Icon, span }) => (
          <div
            key={key}
            className={cn(
              "flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center",
              span,
            )}
          >
            <Icon className="size-5 text-muted-foreground" />
            <p className="font-heading text-sm font-medium">{title}</p>
            <p className="max-w-xs text-xs text-muted-foreground text-pretty">
              {hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  const { label, icon: Icon, value, delta, period } = metric;

  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xs font-normal text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span
          className={cn(
            "font-heading text-2xl font-semibold",
            value === null && "text-muted-foreground",
          )}
        >
          {value ?? "—"}
        </span>
        {delta === undefined ? (
          <span className="text-xs text-muted-foreground">
            Awaiting data feed
          </span>
        ) : (
          <Delta value={delta} period={period} />
        )}
      </CardContent>
    </Card>
  );
}

function Delta({ value, period }: { value: number; period?: string }) {
  const up = value >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      <Arrow className="size-3.5" aria-hidden />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(2)}%
      {period && (
        <span className="font-normal text-muted-foreground">vs. {period}</span>
      )}
    </span>
  );
}
