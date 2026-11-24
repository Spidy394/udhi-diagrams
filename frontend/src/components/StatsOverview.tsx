import {
  Images,
  ShieldCheck,
  DollarSign,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type { DiagramResponse } from "@/types/diagram";

interface StatsOverviewProps {
  diagrams: DiagramResponse[];
}

const StatsOverview = ({
  diagrams,
}: StatsOverviewProps) => {
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

  const stats = [
    {
      label: "Diagrams",
      value: `${diagrams.length}/5`,
      description: "Available for review",
      icon: Images,
    },
    {
      label: "Validation checks",
      value: `${passedChecks}/${totalChecks}`,
      description: "Automated checks passed",
      icon: ShieldCheck,
    },
    {
      label: "Estimated cost",
      value:
        totalCost !== null
          ? `$${totalCost.toFixed(6)}`
          : "Unknown",
      description: "Paid-equivalent USD",
      icon: DollarSign,
    },
    {
      label: "Total retries",
      value: totalRetries,
      description: "API and validation retries",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>

              <stat.icon className="size-4 text-muted-foreground" />
            </div>

            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </p>

            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;
