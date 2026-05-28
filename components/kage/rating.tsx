import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold text-foreground",
        className,
      )}
    >
      <Star
        className="text-star"
        style={{ width: size + 2, height: size + 2 }}
        fill="currentColor"
        strokeWidth={0}
      />
      <span style={{ fontSize: size }}>{value.toFixed(1)}</span>
    </span>
  );
}
