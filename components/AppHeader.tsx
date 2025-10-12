// components/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AppHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/", label: "Início" },
    { href: "/painel", label: "Painel" },
    { href: "/dev/links", label: "Dev" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-bold">8b</span>
          <span className="font-semibold">8bits</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm hover:underline ${path === item.href ? "font-medium" : "text-gray-600"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden rounded-lg border px-3 py-1 text-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t">
          <nav className="mx-auto max-w-6xl px-4 py-2 flex flex-col gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${path === item.href ? "font-medium" : "text-gray-600"}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
