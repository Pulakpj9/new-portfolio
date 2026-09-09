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
  variant,
  accentOverride,
  blackText = false,
}: {
  skill: (typeof skills)[number];
  index: number;
  visible: boolean;
  variant: "dark" | "neon" | "cloud" | "outline" | "sherbet" | "punch" | "soft" | "solidtint";
  accentOverride?: string;
  blackText?: boolean;
}) {
  const accent = accentOverride ?? skill.accent;
  const isDarkText = variant === "dark" || variant === "punch" || variant === "neon";

  /* Locked skill-card treatment — Mist (light theme): dark slate card, Dusk icon tiles */
  const isMist = variant === "punch" && blackText;

  const blendCardCls =
    "rounded-3xl border-white/15 bg-slate-700/80 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.45)] hover:-translate-y-1";
  const blendStyle = {
    backgroundImage: `linear-gradient(150deg, rgba(51,65,85,0.9) 0%, ${accent}33 130%)`,
  };
  const contentTitle = "text-slate-50";
  const contentIconWrap = "border-white/15 bg-white/10";
  const contentIconColor = accent;
  const contentChip =
    "border-white/15 bg-white/10 text-slate-200 hover:border-white/30 hover:bg-white/15";

  const neonBand = variant === "neon";

  const cardCls = cn(
    "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500",
    variant === "dark" &&
      "bg-slate-800 border-slate-700 shadow-[0_20px_48px_-20px_rgba(15,23,42,0.5)] hover:-translate-y-1 hover:shadow-[0_28px_60px_-20px_rgba(15,23,42,0.6)]",
    variant === "neon" &&
      "bg-white border-slate-200/70 p-0 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.22)] hover:-translate-y-1 hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.3)]",
    variant === "cloud" && "rounded-3xl border-transparent p-0",
    variant === "outline" &&
      "border-2 bg-white/30 shadow-none hover:-translate-y-1 hover:bg-white/60 hover:shadow-[0_20px_44px_-20px_rgba(15,23,42,0.25)]",
    variant === "sherbet" &&
      "rounded-3xl border-transparent hover:-translate-y-1 hover:shadow-[0_24px_48px_-22px_rgba(15,23,42,0.32)]",
    variant === "punch" &&
      "border-transparent shadow-[0_16px_40px_-18px_rgba(15,23,42,0.4)] hover:-translate-y-1 hover:shadow-[0_26px_56px_-18px_rgba(15,23,42,0.5)]",
    isMist && blendCardCls,
    variant === "soft" &&
      "rounded-3xl border-transparent hover:-translate-y-1 hover:shadow-[0_24px_48px_-22px_rgba(15,23,42,0.35)]",
    variant === "solidtint" &&
      "border-black/10 hover:-translate-y-1 hover:shadow-[0_20px_44px_-16px_rgba(15,23,42,0.18)]",
    visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
  );

  const extraStyle =
    variant === "outline"
      ? { borderColor: `${accent}b3` }
      : variant === "sherbet"
        ? {
            backgroundImage: `linear-gradient(160deg, ${accent}2b 0%, rgba(255,255,255,0.95) 62%)`,
            boxShadow: `0 14px 36px -20px ${accent}aa`,
          }
        : variant === "punch"
          ? isMist
            ? blendStyle
            : {
                backgroundImage: `linear-gradient(140deg, ${accent} 0%, #0f172a 150%)`,
                boxShadow: `0 18px 44px -20px ${accent}`,
              }
          : variant === "soft"
            ? {
                backgroundImage: `linear-gradient(140deg, ${accent}3d 0%, rgba(255,255,255,0.96) 52%, ${accent}24 100%)`,
                boxShadow: `0 16px 40px -22px ${accent}cc`,
              }
            : variant === "solidtint"
              ? { backgroundColor: `${accent}1a` }
              : undefined;

  const iconWrapCls = cn(
    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105",
    variant === "dark" && "border-white/15 bg-white/10",
    variant === "punch" && (isMist ? contentIconWrap : "border-white/30 bg-white/15"),
    variant === "cloud" && "border-slate-200/60 bg-white/0",
    variant === "outline" && "border-2 bg-transparent",
    variant === "sherbet" && "border-white/60 bg-white/70",
    variant === "soft" && "border-white/80 bg-white/70",
    variant === "solidtint" && "border-black/10 bg-white/70",
  );

  const iconStyle =
    variant === "neon"
      ? { color: "#fff" }
      : variant === "punch"
        ? isMist
          ? { color: contentIconColor }
          : { color: "#fff" }
        : { color: accent };

  const titleCls = cn(
    "font-display text-lg font-semibold",
    variant === "dark" && "text-slate-50",
    variant === "punch" && (isMist ? contentTitle : "text-white"),
  );

  const chipCls = cn(
    "rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors duration-300",
    variant === "dark" && "border-white/10 bg-white/5 text-slate-300 group-hover:border-teal-300/40 group-hover:text-white",
    variant === "punch" && (isMist ? contentChip : "border-white/25 bg-white/15 text-white/90"),
    variant === "cloud" && "border-slate-200/70 bg-white/70 group-hover:border-primary/20 group-hover:text-foreground",
    variant === "sherbet" && "border-white/70 bg-white/70 group-hover:text-foreground",
    variant === "soft" && "border-white/80 bg-white/80 group-hover:border-primary/25 group-hover:text-foreground",
    variant === "solidtint" && "border-black/10 bg-white/60 group-hover:border-primary/25 group-hover:text-foreground",
    variant === "neon" && "bg-slate-50 group-hover:border-primary/20 group-hover:text-foreground",
  );

  const chipStyle =
    variant === "neon"
      ? { borderColor: `${accent}24` }
      : variant === "outline"
        ? { backgroundColor: `${accent}0f`, borderColor: `${accent}30` }
        : undefined;

  const list = (
    <div className={"mt-3 flex flex-wrap gap-2"}>
      {skill.items.map((item) => (
        <span key={item} className={chipCls} style={chipStyle}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cardCls}
      style={{
        transitionDelay: visible ? `${index * 100}ms` : "0ms",
        ...extraStyle,
      }}
    >
      {/* Ghost index number for airy variants */}
      {(variant === "outline" || variant === "cloud") && (
        <span className="pointer-events-none absolute -right-1 -top-5 font-display text-7xl font-bold opacity-10">
          {index + 1}
        </span>
      )}
      {/* Cloud accent rule */}
      {variant === "cloud" && (
        <div
          className="mb-3 h-1 w-10 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}

      {neonBand ? (
        <>
          <div
            className="flex items-center justify-between p-5"
            style={{
              backgroundImage: `linear-gradient(120deg, ${accent} 0%, #1e293b 135%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                <skill.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{skill.category}</h3>
            </div>
            <span className="font-mono text-xs text-white/70">0{index + 1}</span>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">{list}</div>
          </div>
        </>
      ) : (
        <div className={cn("relative", variant === "cloud" && "mt-4")}>
          <div className="flex items-center gap-3">
            <div className={iconWrapCls} style={iconStyle}>
              <skill.icon className="h-5 w-5" />
            </div>
            <h3 className={titleCls}>{skill.category}</h3>
          </div>
          {list}
        </div>
      )}
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

  /* Skills grid — light: Mist (dark slate, Seafoam accents); dark: Dark slate cards */
  const SEAFOAM_ACCENTS = ["#3BB3B1", "#E5F2DE", "#F29768", "#303E5E"];
  const GRID4 = "grid gap-5 md:grid-cols-2 lg:grid-cols-4";

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
        GRID4,
        "transition-all duration-700",
        skillsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      {skills.map((skill, i) => (
        <SkillCard
          key={skill.category}
          skill={skill}
          index={i}
          visible={skillsVisible}
          variant={isLight ? "punch" : "dark"}
          accentOverride={isLight ? SEAFOAM_ACCENTS[i] : undefined}
          blackText={isLight}
        />
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
      <div
        className="pointer-events-none absolute left-0 top-1/3 h-96 w-96"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.07) 0%, transparent 70%)" }}
      />

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