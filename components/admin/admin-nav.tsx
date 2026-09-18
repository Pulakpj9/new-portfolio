"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Layers, Clock3, Link2, MousePointerClick, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Overview", Icon: BarChart3 },
  { href: "/admin/sections", label: "Sections", Icon: Layers },
  { href: "/admin/channels", label: "Channels", Icon: Link2 },
  { href: "/admin/funnel", label: "Funnel", Icon: MousePointerClick },
  { href: "/admin/content", label: "Content", Icon: Clock3 },
  { href: "/admin/sessions", label: "Sessions", Icon: Users },
];

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    try {
      const sb = createClient();
      await sb.auth.signOut();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  if (horizontal) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
        <span className="mr-1 shrink-0 font-mono text-xs font-bold">
          Pulak Mini
        </span>
        {LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </a>
        ))}
        <button
          onClick={signOut}
          className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-6">
        <p className="font-mono text-sm font-bold text-foreground">Pulak Mini</p>
        <p className="text-xs text-muted-foreground">portfolio analytics</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
            </a>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
