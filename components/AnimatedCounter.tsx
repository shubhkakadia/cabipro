"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1.5,
  className = "",
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const isFirstMount = useRef(true);

  useMotionValueEvent(count, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    // On first mount, start from 0. On subsequent changes, start from current value
    const startValue = isFirstMount.current ? 0 : count.get();
    isFirstMount.current = false;

    count.set(startValue);
    const controls = animate(count, value, { duration });
    return () => controls.stop();
  }, [value, count, duration]);

  return (
    <motion.span className={className} style={{ display: "inline-block" }}>
      {displayValue}
    </motion.span>
  );
}
