import { FlaskConical, Circle } from "lucide-react";

interface HeaderProps {
    apiStatus: "checking" | "online" | "offline";
}

const Header = ({ apiStatus }: HeaderProps) => {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FlaskConical className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-sm font-semibold sm:text-base">
                            Science Diagram Maker
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            AI generation & quality assurance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Circle
                        className={`size-2 fill-current ${apiStatus === "online"
                                ? "text-emerald-500"
                                : apiStatus === "offline"
                                    ? "text-red-500"
                                    : "animate-pulse text-amber-500"
                            }`}
                    />

                    {apiStatus === "online"
                        ? "API online"
                        : apiStatus === "offline"
                            ? "API offline"
                            : "Connecting..."}
                </div>
            </div>
        </header>
    )
}

export default Header