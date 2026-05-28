import { cn } from "@/lib/utils";

// Логотип KAGE 影 — щит-эмблема + леттеринг. accent управляет цветом эмблемы/иероглифа.
export function KageLogo({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center font-semibold", className)}
      style={{ gap: 8, letterSpacing: "0.18em", fontSize: size }}
    >
      <svg
        width={size * 1.1}
        height={size * 1.1}
        viewBox="0 0 24 24"
        className="block"
        aria-hidden
      >
        <path
          d="M2 4 L12 2 L22 4 L22 14 Q22 20 12 23 Q2 20 2 14 Z"
          className="fill-brand"
        />
        <path
          d="M8 8 L8 16 M8 12 L14 8 M8 12 L14 16"
          stroke="#fff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-foreground">KAGE</span>
      <span className="font-jp text-brand" style={{ marginLeft: -3 }}>
        影
      </span>
    </span>
  );
}
