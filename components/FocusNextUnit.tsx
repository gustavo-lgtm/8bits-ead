"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function FocusNextUnit() {
  const params = useSearchParams();
  const focus = params.get("focus");
  const onceRef = useRef(false);

  useEffect(() => {
    if (!focus || onceRef.current) return;
    onceRef.current = true;

    const target = document.querySelector<HTMLElement>(`[data-unit-slug="${focus}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-primary", "shadow-lg");
      const t = setTimeout(() => {
        target.classList.remove("ring-2", "ring-primary", "shadow-lg");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [focus]);

  return null;
}
