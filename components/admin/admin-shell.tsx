"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/sections": "Sections",
  "/admin/channels": "Channels",
  "/admin/funnel": "Funnel",
  "/admin/content": "Content",
  "/admin/sessions": "Sessions",
};

/* Admin chrome. The login route renders bare (no sidebar) — everything else
   gets the sidebar layout, a sticky topbar with the portfolio theme toggle,
   and a mobile horizontal nav. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 h-screen">
          <AdminNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold">
              {TITLES[pathname] ?? "Admin"}
            </p>
            <ThemeToggle />
          </div>
        </header>
        <div className="border-b border-border bg-card md:hidden">
          <AdminNav horizontal />
        </div>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
