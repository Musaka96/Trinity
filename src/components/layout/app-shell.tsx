"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, X, Bell } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="app-aurora relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface-1 lg:hidden"
              >
                <div className="flex justify-end p-2">
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-plane/80 px-4 backdrop-blur-xl lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </Button>

            <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
              <Search className="absolute left-3 size-4 text-muted" />
              <input
                placeholder="Search chatters, models…"
                className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-primary placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
              </Button>
              <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3">
                <Avatar name="Trinity Admin" size={28} />
                <span className="hidden text-xs font-medium sm:inline">Admin</span>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
