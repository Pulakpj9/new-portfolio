"use client";

import { useLayoutEffect, useRef } from "react";
import { Code2, Briefcase, Mail, User, BookOpen, Rocket, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconDef {
  icon: typeof Code2;
  label: string;
  hint: string;
  href: string;
}

const iconDefs: IconDef[] = [
  { icon: Code2, label: "Projects", hint: "Selected work", href: "#projects" },
  { icon: Briefcase, label: "Experience", hint: "Career timeline", href: "#experience" },
  { icon: Mail, label: "Contact", hint: "Get in touch", href: "#contact" },
  { icon: User, label: "About", hint: "Who I am", href: "#about" },
  // { icon: BookOpen, label: "Case Studies", hint: "Deep dives", href: "#case-studies" },
  // { icon: Rocket, label: "Ship", hint: "What I build", href: "#projects" },
  // { icon: Database, label: "Backend", hint: "Stack & APIs", href: "#experience" },
  // { icon: Layers, label: "Systems", hint: "Design & scale", href: "#case-studies" },
];

const CHIP = 32;
const EDGE_MARGIN = 24;
const GRID = 80; // matches the hero background grid size
const TOOLTIP_RIGHT_LIMIT = 210;

interface Particle {
  x: number; // current grid node (top-left on an intersection)
  y: number;
  nx: number; // next grid node
  ny: number;
  t: number; // progress along the segment 0..1
  speed: number; // px/s along the line
  fadeFreq: number;
  fadePhase: number;
  frozen: boolean;
}

/* Pick the next grid node: 45% keep going straight, otherwise turn left/right
   at the intersection; never reverse unless boxed in. */
function pickNext(
  cx: number,
  cy: number,
  prevX: number,
  prevY: number,
  minXg: number,
  maxXg: number,
  minYg: number,
  maxYg: number,
): [number, number] {
  const oX = cx - prevX;
  const oY = cy - prevY;
  const sX = cx + oX;
  const sY = cy + oY;
  if (
    sX >= minXg && sX <= maxXg && sY >= minYg && sY <= maxYg && Math.random() < 0.45
  ) {
    return [sX, sY];
  }
  const opts: Array<[number, number]> = [];
  const cands: Array<[number, number]> = [
    [cx + GRID, cy],
    [cx - GRID, cy],
    [cx, cy + GRID],
    [cx, cy - GRID],
  ];
  for (const c of cands) {
    if (c[0] < minXg || c[0] > maxXg || c[1] < minYg || c[1] > maxYg) continue;
    if (c[0] === prevX && c[1] === prevY) continue;
    opts.push(c);
  }
  if (opts.length === 0) return [prevX, prevY];
  return opts[Math.floor(Math.random() * opts.length)];
}

const snapToGrid = (v: number, lo: number, hi: number) => {
  let g = Math.round(v / GRID) * GRID;
  if (g < lo) g = lo;
  if (g > hi) g = hi;
  return g;
};

export function HeroGridIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tooltipRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const particlesRef = useRef<Array<Particle | null>>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = () => container.clientWidth;
    const H = () => container.clientHeight;
    const minXg = Math.ceil(EDGE_MARGIN / GRID) * GRID;
    const maxXg = () => Math.max(minXg, Math.floor((W() - CHIP - EDGE_MARGIN) / GRID) * GRID);
    const minYg = Math.ceil(EDGE_MARGIN / GRID) * GRID;
    const maxYg = () => Math.max(minYg, Math.floor((H() - CHIP - EDGE_MARGIN) / GRID) * GRID);

    const particles: Particle[] = iconDefs.map((_, i) => {
      const fx = (i * 0.61803 + 0.17) % 1;
      const fy = (i * 0.38197 + 0.23) % 1;
      const x = snapToGrid(fx * W(), minXg, maxXg());
      const y = snapToGrid(fy * H(), minYg, maxYg());
      const [nx, ny] = pickNext(x, y, x, y - 10000, minXg, maxXg(), minYg, maxYg());
      return {
        x,
        y,
        nx,
        ny,
        t: Math.random(),
        speed: 10 + Math.random() * 10, // slow–medium, random per particle
        fadeFreq: 0.1,
        fadePhase: i * 2.1,
        frozen: false,
      };
    });
    particlesRef.current = particles;

    const place = (dt: number, now: number) => {
      const w = W();
      const mxg = maxXg();
      const myg = maxYg();

      particles.forEach((p, i) => {
        const el = buttonRefs.current[i];
        const tip = tooltipRefs.current[i];
        if (!el) return;

        if (!p.frozen) {
          p.t += (p.speed * dt) / GRID;
          if (p.t >= 1) {
            const prevX = p.x;
            const prevY = p.y;
            p.x = p.nx;
            p.y = p.ny;
            p.t = 0;
            const [nextX, nextY] = pickNext(p.x, p.y, prevX, prevY, minXg, mxg, minYg, myg);
            p.nx = nextX;
            p.ny = nextY;
          }
        }

        const cX = p.x + (p.nx - p.x) * p.t;
        const cY = p.y + (p.ny - p.y) * p.t;
        const fade =
          0.35 +
          0.35 * (0.5 + 0.5 * Math.sin((now / 1000) * p.fadeFreq * Math.PI * 2 + p.fadePhase));
        el.style.transform = `translate3d(${cX}px, ${cY}px, 0)`;
        el.style.opacity = String(fade);

        if (tip) {
          if (cX > w - TOOLTIP_RIGHT_LIMIT) {
            tip.style.left = "auto";
            tip.style.right = "calc(100% + 10px)";
            tip.style.marginLeft = "0";
          } else {
            tip.style.left = "";
            tip.style.right = "";
            tip.style.marginLeft = "";
          }
        }
      });
    };

    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      place(dt, now);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleNavigate = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[15]">
      {iconDefs.map((def, i) => (
        <button
          key={i}
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          onClick={() => handleNavigate(def.href)}
          onMouseEnter={() => {
            if (particlesRef.current[i]) particlesRef.current[i].frozen = true;
          }}
          onMouseLeave={() => {
            if (particlesRef.current[i]) particlesRef.current[i].frozen = false;
          }}
          aria-label={def.label}
          className={cn(
            "group pointer-events-auto absolute left-0 top-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
            "border border-border/50 bg-background/70 text-foreground/75 shadow-md backdrop-blur-sm",
            "before:absolute before:-inset-2 before:rounded-full before:content-['']",
            "transition-colors duration-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
          )}
          style={{ opacity: 0 }}
        >
          <def.icon className="h-3.5 w-3.5" />
          <span
            ref={(el) => {
              tooltipRefs.current[i] = el;
            }}
            className={cn(
              "pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100",
            )}
          >
            {def.label} <span className="text-muted-foreground">· {def.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}