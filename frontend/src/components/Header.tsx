"use client";

import { FlaskConical } from "lucide-react";
import { ThemeToggleButton } from "@/components/ui/skiper-ui/skiper26";

interface HeaderProps {
  apiStatus: "checking" | "online" | "offline";
}

const STATUS = {
  online: {
    label: "API online",
    dot: "bg-success",
    ring: "ring-success/20",
    text: "text-foreground/80",
  },
  offline: {
    label: "API offline",
    dot: "bg-danger",
    ring: "ring-danger/20",
    text: "text-foreground/80",
  },
  checking: {
    label: "Connecting",
    dot: "bg-warning animate-pulse",
    ring: "ring-warning/20",
    text: "text-muted-foreground",
  },
} as const;

const Header = ({ apiStatus }: HeaderProps) => {
  const status = STATUS[apiStatus];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <FlaskConical className="size-[18px]" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                Science Diagram Maker
              </p>
              <span className="hidden rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.02em] text-muted-foreground sm:inline-flex">
                Review workspace
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Generation, validation, and human review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            role="status"
            aria-live="polite"
            className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-xs font-medium shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ring-4 ${status.dot} ${status.ring}`}
            />
            <span className={status.text}>{status.label}</span>
          </div>

          <ThemeToggleButton
            variant="circle"
            blur={true}
            start="top-right"
            className="size-9 rounded-full border-border/80 bg-card/70 hover:bg-muted/80"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
