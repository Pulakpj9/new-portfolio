"use client";

import { Suspense, useState } from "react";
import { BotConversationsClient } from "@/components/admin/bot-conversations-client";
import { BotRulesClient } from "@/components/admin/bot-rules-client";
import { BotUsageClient } from "@/components/admin/bot-usage-client";
import { LoadingGrid } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "rules", label: "Nudge rules" },
  { key: "conversations", label: "Conversations" },
  { key: "usage", label: "Usage & switches" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function BotTabs() {
  const [tab, setTab] = useState<Tab>("rules");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Pulak Mini</h1>
        <div className="mt-3 flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "rules" && <BotRulesClient />}
      {tab === "conversations" && <BotConversationsClient />}
      {tab === "usage" && <BotUsageClient />}
    </div>
  );
}

export default function AdminBotPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <BotTabs />
    </Suspense>
  );
}
