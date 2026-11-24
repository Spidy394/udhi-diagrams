/* eslint-disable @next/next/no-img-element */

interface DiagramPreviewProps {
  svg: string;
  name: string;
  safe: boolean;
}

const DiagramPreview = ({
  svg,
  name,
  safe,
}: DiagramPreviewProps) => {
  if (!safe || !svg.trim()) {
    return (
      <div className="flex aspect-[8/5] w-full items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/25 px-4 text-center">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground/70">
            Preview unavailable
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {svg.trim()
              ? "SVG safety checks did not pass."
              : "No diagram was generated."}
          </p>
        </div>
      </div>
    );
  }

  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div className="group/preview relative overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:ring-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent_55%)]"
      />
      <img
        src={src}
        alt={`Animated diagram explaining ${name}`}
        className="relative aspect-[8/5] h-auto w-full object-contain p-2"
      />
    </div>
  );
};

export default DiagramPreview;
