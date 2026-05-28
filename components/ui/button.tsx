import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Пилюльные кнопки KAGE (radius = высота). Варианты повторяют KageButton из дизайна.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[0.02em] transition-[transform,background,box-shadow] duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-white text-[#0a0a0f] hover:bg-white/90",
        accent: "bg-brand text-white hover:bg-brand/90",
        glass:
          "border border-white/20 bg-white/[0.12] text-foreground backdrop-blur-xl hover:bg-white/20",
        ghost:
          "border border-border-hi bg-transparent text-foreground hover:bg-white/5",
        chip: "border border-border bg-surface-2 text-foreground hover:bg-surface-2/70",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-xs [&_svg]:size-3.5",
        md: "h-10 px-[18px] text-[13px] [&_svg]:size-4",
        lg: "h-12 px-6 text-[15px] [&_svg]:size-5",
        xl: "h-16 px-8 text-[17px] [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
