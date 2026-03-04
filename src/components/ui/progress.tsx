import { cn } from "../../lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2 w-full rounded-full bg-muted", className)}>
      <div
        className="h-2 rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
