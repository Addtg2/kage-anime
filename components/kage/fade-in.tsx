"use client";

import { motion, type HTMLMotionProps } from "motion/react";

// Лёгкая обёртка для entrance-анимаций. Используется на hero и важных блоках.
export function FadeIn({
  delay = 0,
  y = 24,
  duration = 0.6,
  className,
  children,
  ...rest
}: {
  delay?: number;
  y?: number;
  duration?: number;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
