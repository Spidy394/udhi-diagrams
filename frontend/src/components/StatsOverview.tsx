import {
  CircleDollarSign,
  RotateCcw,
  ScanSearch,
  Shapes,
} from "lucide-react";

import type { DiagramResponse } from "@/types/diagram";

interface StatsOverviewProps {
  diagrams: DiagramResponse[];
}

const StatsOverview = ({ diagrams }: StatsOverviewProps) => {
  const totalChecks = diagrams.reduce(
    (total, { result }) =>
      total + Object.keys(result.checks).length,
    0,
  );

  const passedChecks = diagrams.reduce(
    (total, { result }) =>
      total +
      Object.values(result.checks).filter(
        (check) => check.passed,
      ).length,
    0,
  );

  const totalCost = diagrams.some(
    ({ result }) => result.estimated_cost_usd === null,
  )
    ? null
    : diagrams.reduce(
        (total, { result }) =>
          total + (result.estimated_cost_usd ?? 0),
        0,
      );

  const totalRetries = diagrams.reduce(
    (total, { result }) => total + result.retries,
    0,
  );

  const checkRate = totalChecks > 0 ? passedChecks / totalChecks : 0;

  const stats = [
    {
      label: "Diagrams",
      value: `${diagrams.length}/5`,
      description: "Available for review",
      icon: Shapes,
    },
    {
      label: "Validation checks",
      value: `${passedChecks}/${totalChecks}`,
      description: "Automated checks passed",
      progress: checkRate,
      icon: ScanSearch,
    },
    {
      label: "Estimated cost",
      value:
        totalCost !== null
          ? `$${totalCost.toFixed(6)}`
          : "Unknown",
      description: "Paid-equivalent USD",
      icon: CircleDollarSign,
    },
    {
      label: "Total retries",
      value: String(totalRetries),
      description: "API and validation retries",
      icon: RotateCcw,
    },
  ];

  return (
    <section aria-label="Overview metrics">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="group relative bg-card/80 px-5 py-5 transition-colors duration-200 hover:bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-mono text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground">
                  <Icon className="size-3.5" strokeWidth={1.8} />
                </div>
              </div>

              <p className="mt-4 font-mono text-[1.75rem] font-medium leading-none tracking-[-0.03em] text-foreground tabular-nums">
                {stat.value}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {stat.description}
              </p>

              {"progress" in stat && (
                <div
                  className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted/80"
                  role="meter"
                  aria-label="Validation checks passed"
                  aria-valuenow={passedChecks}
                  aria-valuemin={0}
                  aria-valuemax={totalChecks}
                >
                  <div
                    className="h-full rounded-full bg-primary/80 transition-[width] duration-500 ease-out"
                    style={{ width: `${checkRate * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsOverview;
