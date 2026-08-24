"use client";

import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { MouseEventHandler, PropsWithChildren } from "react";

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends PropsWithChildren {
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(39, 53, 230, 0.14)",
}: SpotlightCardProps) {
  const reduce = useReducedMotion();
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused || reduce) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    if (reduce) return;
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    if (reduce) return;
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    if (!reduce) setOpacity(0.6);
  };
  const handleMouseLeave = () => {
    if (!reduce) setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-line bg-paper-2 ${className}`}
    >
      {reduce ? null : (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity,
            background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
