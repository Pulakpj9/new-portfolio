"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Code2, Briefcase, Mail, User, BookOpen, Rocket, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconDef {
  icon: typeof Code2;
  label: string;
  hint: string;
  href: string;
  duration: number;
  delay: number;
}

const iconDefs: IconDef[] = [
  { icon: Code2, label: "Projects", hint: "Selected work", href: "#projects", duration: 7, delay: 0 },
  { icon: Briefcase, label: "Experience", hint: "Career timeline", href: "#experience", duration: 8, delay: 1.2 },
  { icon: Mail, label: "Contact", hint: "Get in touch", href: "#contact", duration: 6, delay: 2.4 },
  { icon: User, label: "About", hint: "Who I am", href: "#about", duration: 7.5, delay: 0.8 },
  { icon: BookOpen, label: "Case Studies", hint: "Deep dives", href: "#case-studies", duration: 8.5, delay: 1.6 },
  { icon: Rocket, label: "Ship", hint: "What I build", href: "#projects", duration: 6.5, delay: 3 },
  { icon: Database, label: "Backend", hint: "Stack & APIs", href: "#experience", duration: 7.2, delay: 2 },
  { icon: Layers, label: "Systems", hint: "Design & scale", href: "#case-studies", duration: 6.8, delay: 0.4 },
];

interface Placement extends IconDef {
  x: number;
  y: number;
  tooltipBelow: boolean;
  tooltipOnLeft: boolean;
}

/* Content regions icons must never cover. Resolved via the DOM so it works
   across every breakpoint and screen size. */
const CONTENT_SELECTORS = ["#hero-heading", "#hero-cards", "#hero-bottom"];
const CHIP = 32; // chip size px
const CHIP_MARGIN = 48; // min distance kept between a chip and content

function isBlocked(
  x: number,
  y: number,
  boxes: Array<[number, number, number, number]>,
) {
  return boxes.some(([l, t, r, b]) => x > l - CHIP_MARGIN && x < r + CHIP_MARGIN && y > t - CHIP_MARGIN && y < b + CHIP_MARGIN);
}

export function HeroGridIcons() {
  const ref = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<Placement[] | null>(null);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const section = container.parentElement;
    if (!section) return;

    const compute = () => {
      const sr = section.getBoundingClientRect();
      const width = section.clientWidth;
      const height = section.clientHeight;

      const boxes: Array<[number, number, number, number]> = [
        [0, 0, width, 64], // fixed nav strip at the very top
      ];
      for (const sel of CONTENT_SELECTORS) {
        const el = section.querySelector<HTMLElement>(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        boxes.push([r.left - sr.left, r.top - sr.top, r.right - sr.left, r.bottom - sr.top]);
      }

      // Candidate grid spread across the whole hero
      const xs = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95];
      const ys = [0.12, 0.3, 0.48, 0.66, 0.84];
      const free: Array<[number, number]> = [];

      for (const fy of ys) {
        for (const fx of xs) {
          const x = width * fx;
          const y = height * fy;
          if (!isBlocked(x, y, boxes)) free.push([x, y]);
        }
      }

      // Greedy max-min dispersion: start at the free point nearest the center,
      // then each icon picks the spot farthest from every icon already placed.
      // This spreads icons evenly across the screen and avoids overlap.
      const dist = (a: [number, number], b: [number, number]) =>
        Math.hypot(a[0] - b[0], a[1] - b[1]);
      const remaining = free.slice();
      const chosen: Array<[number, number]> = [];
      if (remaining.length > 0) {
        remaining.sort(
          (a, b) => dist(a, [width / 2, height / 2]) - dist(b, [width / 2, height / 2]),
        );
        chosen.push(remaining.shift()!);
        while (chosen.length < iconDefs.length && remaining.length > 0) {
          let bestIdx = 0;
          let bestScore = -1;
          for (let i = 0; i < remaining.length; i++) {
            const score = Math.min(...chosen.map((c) => dist(remaining[i], c)));
            if (score > bestScore) {
              bestScore = score;
              bestIdx = i;
            }
          }
          if (bestScore < 96) break; // not enough room left; stop before crowding
          chosen.push(remaining.splice(bestIdx, 1)[0]);
        }
      }

      const next: Placement[] = [];
      for (let i = 0; i < chosen.length; i++) {
        const [x, y] = chosen[i];
        next.push({
          ...iconDefs[i],
          x,
          y,
          tooltipBelow: y > height * 0.55,
          tooltipOnLeft: x < width * 0.35,
        });
      }
      setPlacements(next);
    };

    compute();
    const refine = setTimeout(compute, 1300); // re-measure after entrance animations settle
    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(refine);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const handleNavigate = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 z-20 transition-opacity duration-700",
        placements ? "opacity-100" : "opacity-0",
      )}
    >
      {placements?.map((p, i) => (
        <button
          key={i}
          onClick={() => handleNavigate(p.href)}
          aria-label={p.label}
          className={cn(
            "group pointer-events-auto absolute flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
            "border border-border/50 bg-background/60 text-foreground/70 shadow-md backdrop-blur-sm",
            "before:absolute before:-inset-2 before:rounded-full before:content-['']",
            "transition-colors duration-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
            "hover:[animation-play-state:paused]",
          )}
          style={{
            left: p.x - CHIP / 2,
            top: p.y - CHIP / 2,
            animation: `icon-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          <p.icon className="h-3.5 w-3.5" />
          <span
            className={cn(
              "pointer-events-none absolute whitespace-nowrap rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100",
              p.tooltipBelow
                ? "top-full mt-2"
                : "bottom-full mb-2",
              p.tooltipOnLeft
                ? p.tooltipBelow
                  ? "left-0 translate-y-1 group-hover:translate-y-0"
                  : "left-0 -translate-y-1 group-hover:translate-y-0"
                : p.tooltipBelow
                  ? "right-0 translate-y-1 group-hover:translate-y-0"
                  : "right-0 -translate-y-1 group-hover:translate-y-0",
            )}
          >
            {p.label} <span className="text-muted-foreground">· {p.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}