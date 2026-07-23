"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 px-2 py-1"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-[0_8px_24px_-8px_var(--accent-ring)]">
          <TriangleMark />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Trinity</span>
          <span className="text-[11px] text-muted">Sales Intelligence</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "text-primary" : "text-secondary hover:text-primary",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg border border-border bg-surface-2"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 size-4 transition-colors",
                  active ? "text-accent" : "text-muted group-hover:text-secondary",
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-surface-2/60 p-3">
        <p className="text-xs font-medium text-primary">Connect inflow</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Sync live sales data automatically from your inflow account.
        </p>
        <Link
          href="/import"
          onClick={onNavigate}
          className="mt-2 inline-flex text-[11px] font-medium text-accent hover:underline"
        >
          Set up import →
        </Link>
      </div>
    </div>
  );
}

function TriangleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 L21 19 H3 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="2.4" fill="currentColor" />
    </svg>
  );
}
