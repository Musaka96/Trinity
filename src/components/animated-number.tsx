"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

export function AnimatedNumber({
  value,
  format,
  duration = 1,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(0);

  // Fallback: guarantee the value settles even if the observer never fires
  // (e.g. non-composited/headless environments) or motion is reduced.
  const [forced, setForced] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setForced(true), 900);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!inView && !forced) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, forced, value, duration, reduce]);

  return (
    <span ref={ref} className="tabular">
      {format(display)}
    </span>
  );
}
