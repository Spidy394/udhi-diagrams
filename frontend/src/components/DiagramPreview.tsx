/* eslint-disable @next/next/no-img-element */

interface DiagramPreviewProps {
    svg: string;
    name: string;
    safe: boolean;
}

const DiagramPreview = ({ svg, name, safe }: DiagramPreviewProps) => {
    if (!safe || !svg.trim()) return null;

    const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    return (
        <div className="overflow-hidden rounded-lg border bg-white">
            <img
                src={src}
                alt={`Animated diagram explaining ${name}`}
                className="aspect-[8/5] h-auto w-full object-contain"
            />
        </div>
    );
};

export default DiagramPreview;
