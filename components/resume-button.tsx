"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { MagneticButton } from "@/components/magnetic-button";
import { tracker } from "@/lib/analytics/tracker";
import { cn } from "@/lib/utils";

export type ResumeSpot = "nav" | "hero" | "about" | "contact" | "rail";
export type ResumeVariant = "solid" | "outline" | "ink" | "accent" | "ghost";

/* Shared resume button. Locked spots: nav/solid, contact/accent.
   Tracking carries spot + variant. */

export const RESUME_STYLES: Record<
  ResumeVariant,
  { label: string; cls: string }
> = {
  solid: {
    label: "Solid",
    cls: "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25",
  },
  outline: {
    label: "Outline",
    cls: "border border-border text-foreground hover:border-primary/50 hover:text-primary",
  },
  ink: {
    label: "Ink",
    cls: "border-slate-800 bg-slate-900 text-white hover:shadow-lg hover:shadow-slate-900/25 dark:border-slate-200 dark:bg-white dark:text-slate-900",
  },
  accent: {
    label: "Accent",
    cls: "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50",
  },
  ghost: {
    label: "Ghost",
    cls: "border border-transparent text-muted-foreground hover:text-primary hover:bg-primary/10",
  },
};

export const RESUME_HREF = "/resume.pdf";
export const RESUME_FILENAME = "Pulak-Jain-Resume.pdf";

/* Left-edge vertical rail tab — locked: Slide fill.
   Slim tab, vertical label, slides out and fills primary on hover with a
   glow shadow and dipping icon.
   Visibility rule: every section EXCEPT hero and contact. */

function RailShell({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('[data-section="hero"]');
    const contact = document.querySelector('[data-section="contact"]');
    const targets = [hero, contact].filter(
      (el): el is Element => el !== null,
    );
    if (targets.length === 0) return;
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        setHidden([...ratios.values()].some((r) => r > 0.35));
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <a
      href={RESUME_HREF}
      download={RESUME_FILENAME}
      onClick={() =>
        tracker.track("resume_download", {
          meta: { placement: "rail", variant: "slide" },
        })
      }
      aria-label="Download resume"
      title="Download resume"
      aria-hidden={hidden}
      className={cn(
        "group fixed left-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-r-2xl border border-l-0 border-border bg-card/90 py-4 pl-2.5 pr-3 shadow-md backdrop-blur transition-all duration-300 hover:translate-x-1 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/25",
        hidden && "pointer-events-none -translate-x-full opacity-0",
      )}
    >
      {children}
    </a>
  );
}

function RailLabel() {
  return (
    <span className="rotate-180 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
      Resume
    </span>
  );
}

export function ResumeRail() {
  return (
    <RailShell>
      <Download className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5" />
      <RailLabel />
    </RailShell>
  );
}

export function ResumeButton({
  spot,
  variant = "solid",
  size = "md",
  className,
}: {
  spot: ResumeSpot;
  variant?: ResumeVariant;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <MagneticButton
      href={RESUME_HREF}
      download={RESUME_FILENAME}
      onClick={() =>
        tracker.track("resume_download", {
          meta: { placement: spot, variant },
        })
      }
      className={cn(
        RESUME_STYLES[variant].cls,
        size === "sm" && "px-4 py-2 text-xs",
        className,
      )}
    >
      Resume
      <Download
        className={cn(
          "transition-transform duration-300 group-hover:translate-y-0.5",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
      />
    </MagneticButton>
  );
}
