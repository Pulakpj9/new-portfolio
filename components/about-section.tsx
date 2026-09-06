"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { Code2, Layers, Zap, Cpu } from "lucide-react";

/* Confirmed background — "Mono": soft steel-slate washes (`.scene-about-bg`)
   that blend into the experience section below on light, navy on dark. */

/* Rich card fill: a soft vertical glass base with accent washes bleeding in
   from the top-right corner and bottom-left — theme-aware via CSS vars. */
function cardBackground(accent: string) {
  return (
    "radial-gradient(ellipse 120% 80% at 88% -5%, " +
    accent +
    (accent.length === 7 ? "1f" : "") +
    ", transparent 62%)," +
    "radial-gradient(ellipse 100% 90% at 0% 112%, " +
    accent +
    (accent.length === 7 ? "12" : "") +
    ", transparent 60%)," +
    "linear-gradient(155deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.85) 45%, hsl(var(--secondary) / 0.7) 100%)"
  );
}

const skills = [
  {
    category: "Frontend",
    icon: Zap,
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    color: "from-primary to-cyan-400",
    accent: "#0ea5e9",
  },
  {
    category: "Backend",
    icon: Cpu,
    items: ["Node.js", "Express.js", "Docker", "Socket.io", "Microservices"],
    color: "from-blue-400 to-primary",
    accent: "#2563eb",
  },
  {
    category: "Database",
    icon: Layers,
    items: ["MySQL", "MongoDB"],
    color: "from-primary to-teal-300",
    accent: "#0d9488",
  },
  {
    category: "Tools",
    icon: Code2,
    items: ["Git", "VS Code", "Github", "Postman", "Swagger"],
    color: "from-teal-300 to-cyan-400",
    accent: "#06b6d4",
  },
];

const stats = [
  { value: "1.5+", label: "Years Full Time Experience", accent: "#0d9488" },
  { value: "5+", label: "months internship Experience", accent: "#f59e0b" },
  { value: "4+", label: "Projects Shipped", accent: "#0ea5e9" },
  { value: "2+", label: "Projects Ongoing", accent: "#a855f7" },
];

/* Condensed, skimmable intro copy */
const INTRO_MAIN =
  "I'm a backend-focused software engineer building systems that create real-world impact — from healthcare platforms to education solutions, designing infrastructure that keeps apps reliable, scalable, and secure.";
const INTRO_SUPPORT =
  "Great software starts with strong foundations. Clean architecture, thoughtful database design, optimized APIs, and maintainable code aren't afterthoughts — they're the core of everything I build. I think in systems and outcomes, take ownership, and build backend solutions that empower teams and support meaningful user experiences.";

/* Identity headline: types "a Developer." then appends a rotating role */
const PRIMARY_LINE = "a Developer.";
const SECONDARY_LINE = [
  "A Builder",
  "A Tech Enthusiast",
  "A Learner",
  "An Explorer",
  "A Problem Solver",
  "A Systems Thinker",
];

function IdentityTypewriter() {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(PRIMARY_LINE.slice(0, i));
      if (i >= PRIMARY_LINE.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    setWordVisible(true);
    const rot = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx((k) => (k + 1) % SECONDARY_LINE.length);
        setWordVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(rot);
  }, [done]);

  return (
    <>
      <span>{typed}</span>
      {done && (
        <span
          className={cn(
            "ml-2 inline-block rounded-md bg-[#0d9488]/15 px-2 py-1 text-foreground transition-all duration-300 [box-decoration-break:clone]",
            wordVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          {SECONDARY_LINE[wordIdx]}
        </span>
      )}
    </>
  );
}

/* Count-up animation for the stat numbers */
function useCountUp(target: number, start: boolean, duration = 1100) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);

  return val;
}

function StatValue({ value, visible }: { value: string; visible: boolean }) {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match && match.length > 2 ? match[2] : "";
  const animated = useCountUp(target, visible);
  const isDecimal = target % 1 !== 0;
  return `${isDecimal ? animated.toFixed(1) : Math.round(animated)}${suffix}`;
}

function SkillCard({
  skill,
  index,
  visible,
}: {
  skill: (typeof skills)[number];
  index: number;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5",
        "shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-500",
        "hover:-translate-y-1 hover:shadow-[0_24px_48px_-14px_rgba(15,23,42,0.2)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{
        transitionDelay: visible ? `${index * 100}ms` : "0ms",
        borderColor: `${skill.accent}2e`,
        backgroundImage: cardBackground(skill.accent),
      }}
    >
      {/* Accent under-glow — lifts the card off the section */}
      <div
        className="pointer-events-none absolute -bottom-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: skill.accent }}
      />
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundImage: `radial-gradient(circle at 85% 0%, ${skill.accent}1f, transparent 55%)` }}
      />
      {/* Top gradient bar */}
      <div
        className={cn(
          "absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          skill.color,
        )}
      />

      <div className="relative">
        <div
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:scale-105"
          style={{
            backgroundColor: `${skill.accent}17`,
            borderColor: `${skill.accent}30`,
            color: skill.accent,
          }}
        >
          <skill.icon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-semibold">{skill.category}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {skill.items.map((item) => (
            <span
              key={item}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
              style={{
                backgroundColor: `${skill.accent}0f`,
                borderColor: `${skill.accent}24`,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutSection() {
  const { resolvedTheme } = useTheme();
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    setIsLight(resolvedTheme === "light");
  }, [resolvedTheme]);
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: skillsRef, isVisible: skillsVisible } = useScrollAnimation();

  /* Confirmed light-theme background: Slate, blending into experience below */
  const BG_SLATE =
    "radial-gradient(circle at 50% -10%, rgba(100,116,139,0.16), transparent 50%), radial-gradient(circle at 90% 10%, rgba(148,163,184,0.12), transparent 40%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(0 0% 93%) 100%)";

  const header = (
    <div ref={sectionRef}>
      <span
        className={cn(
          "mb-4 inline-block font-mono text-sm uppercase tracking-widest text-primary transition-all duration-700",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        About Me
      </span>
      <h2
        className={cn(
          "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )}
      >
        More than just <br />
        <IdentityTypewriter />
      </h2>
    </div>
  );

  const spotChips = (isContrast = false) => (
    <div className="mt-6 flex flex-wrap gap-3">
      {skills.map((skill) => (
        <span
          key={skill.category}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
            isContrast ? "text-slate-100" : "text-foreground",
          )}
          style={{
            borderColor: `${skill.accent}${isContrast ? "99" : "30"}`,
            backgroundColor: `rgba(255,255,255,${isContrast ? "0.14" : "0"})`,
          }}
        >
          <skill.icon className="h-3.5 w-3.5" style={{ color: skill.accent }} />
          <span className="font-display font-semibold">
            {skill.category}
          </span>
        </span>
      ))}
    </div>
  );

  /* Spotlight card — Contrast: dark slate, light text */
  const spotlightCard = (
    <div
      ref={contentRef}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-slate-800/20 bg-slate-800 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.55)] transition-all duration-700 delay-100",
        contentVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_1fr] lg:p-10">
        <div>
          <p className="text-2xl font-medium leading-snug text-slate-50 md:text-3xl">{INTRO_MAIN}</p>
          <p className="mt-3 text-slate-300">{INTRO_SUPPORT}</p>
          {spotChips(true)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-black/10 bg-white/10 p-5 text-center transition-all duration-500",
                contentVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
              style={{
                transitionDelay: contentVisible ? `${i * 100}ms` : "0ms",
                backgroundColor: `${stat.accent}1a`,
              }}
            >
              <div className="font-display text-3xl font-bold" style={{ color: stat.accent }}>
                <StatValue value={stat.value} visible={contentVisible} />
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const skillsGrid = (
    <div
      ref={skillsRef}
      className={cn(
        "grid gap-5 transition-all duration-700 md:grid-cols-2 lg:grid-cols-4",
        skillsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      {skills.map((skill, i) => (
        <SkillCard key={skill.category} skill={skill} index={i} visible={skillsVisible} />
      ))}
    </div>
  );

  return (
    <section id="about" className="scene-about scene-block relative overflow-hidden py-20 lg:py-24">
      {/* Background gradient — Slate in light, navy in dark */}
      {isLight ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: BG_SLATE }}
        />
      ) : (
        <div className="scene-about-bg pointer-events-none absolute inset-0" />
      )}
      {/* Section background accent */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col">
          <div>{header}</div>
          <div className="mt-10">{spotlightCard}</div>
          <div className="mt-14">{skillsGrid}</div>
        </div>
      </div>
    </section>
  );
}