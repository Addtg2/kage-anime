"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/**
 * Scroll-reveal обёртка: блок проявляется при попадании во вьюпорт.
 * Уважает prefers-reduced-motion (тогда без сдвига/анимации).
 */
export function Reveal({
  delay = 0,
  y = 20,
  duration = 0.55,
  className,
  children,
  ...rest
}: {
  delay?: number;
  y?: number;
  duration?: number;
} & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
