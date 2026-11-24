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
    return (
        <div className="space-y-2">
            {Object.entries(CHECK_LABELS).map(
                ([key, label]) => {
                    const check = checks[key as CheckName];
                    const passed = check?.passed === true;

                    return (
                        <div
                            key={key}
                            title={check?.message}
                            className="flex items-center gap-2 text-sm"
                        >
                            {passed ? (
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            ) : (
                                <XCircle className="size-4 shrink-0 text-red-500" />
                            )}

                            <span>{label}</span>

                            <span
                                className={`ml-auto text-xs font-medium ${passed
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                    }`}
                            >
                                {passed ? "PASS" : "FAIL"}
                            </span>
                        </div>
                    );
                },
            )}
        </div>
    )
}

export default ValidationStatus