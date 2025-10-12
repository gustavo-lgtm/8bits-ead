"use client";

import { useState } from "react";

/**
 * Tooltip leve baseado em hover (desktop) e tap (mobile).
 * Aceita qualquer conteúdo React no `content`.
 */
export default function TooltipHover({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  const sideClasses =
    side === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : side === "bottom"
      ? "top-full mt-2 left-1/2 -translate-x-1/2"
      : side === "left"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : "left-full ml-2 top-1/2 -translate-y-1/2";

  return (
    <span
      className="group relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={() => setOpen((v) => !v)}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden group-hover:block ${open ? "block" : ""} ${sideClasses}`}
      >
        <span className="pointer-events-auto block max-w-xs rounded-lg border border-neutral-300 bg-white p-3 text-[12px] leading-relaxed text-neutral-800 shadow-xl">
          {content}
        </span>
      </span>
    </span>
  );
}
