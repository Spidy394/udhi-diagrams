import { CheckCircle2, XCircle } from "lucide-react";

import type {
  CheckName,
  CheckResult,
} from "@/types/diagram";

const CHECK_LABELS: Record<CheckName, string> = {
  valid_svg: "Valid SVG",
  within_viewbox: "Within viewBox",
  title_and_labels: "Title & labels",
  has_animation: "Animation",
  safe_svg: "SVG safety",
};

interface ValidationStatusProps {
  checks: Record<CheckName, CheckResult>;
}

const ValidationStatus = ({ checks }: ValidationStatusProps) => {
  const failedCount = Object.values(checks).filter(
    (check) => !check.passed,
  ).length;

  return (
    <div className="space-y-3">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          failedCount === 0
            ? "bg-success-soft text-success"
            : "bg-danger-soft text-danger"
        }`}
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
        {failedCount === 0
          ? "All checks passed"
          : `${failedCount} ${failedCount === 1 ? "check" : "checks"} failed`}
      </span>

      <div className="space-y-1.5">
        {Object.entries(CHECK_LABELS).map(
          ([key, label]) => {
            const check = checks[key as CheckName];
            const passed = check?.passed === true;

            return (
              <div
                key={key}
                className="rounded-md px-1 py-1"
              >
                <div className="flex items-center gap-2 text-[13px]">
                  {passed ? (
                    <CheckCircle2
                      className="size-[15px] shrink-0 text-success"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="size-[15px] shrink-0 text-danger"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  )}

                  <span className={passed ? "text-foreground/85" : "text-foreground"}>
                    {label}
                  </span>

                  <span
                    className={`ml-auto font-mono text-[10px] font-medium tracking-[0.04em] ${
                      passed ? "text-success/90" : "text-danger/90"
                    }`}
                  >
                    {passed ? "PASS" : "FAIL"}
                  </span>
                </div>

                {!passed && (
                  <p className="mt-1 pl-[23px] text-[11px] leading-relaxed text-danger/90">
                    {check?.message ?? "Validation result unavailable."}
                  </p>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};

export default ValidationStatus;
