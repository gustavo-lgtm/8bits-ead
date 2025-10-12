"use client";

import { ReactNode } from "react";

export default function TierIcon({
  children,
  tier = 0, // 0,1,2,3
}: {
  children: ReactNode;
  tier?: 0 | 1 | 2 | 3;
}) {
  const label = ["", "I", "II", "III"][tier];
  return (
    <span className="relative inline-flex items-center">
      {children}
      {tier > 0 && (
        <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-black/80 border border-white/20 text-[10px] leading-4 text-white text-center">
          {label}
        </span>
      )}
    </span>
  );
}
