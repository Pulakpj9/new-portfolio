"use client";

import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { Code2, Layers, Zap, Cpu } from "lucide-react";

/* Confirmed background — "Mono": soft steel-slate washes over the section's
   own background so it stays tasteful in light and dark themes. */
const ABOUT_BACKGROUND =
  "radial-gradient(circle at 20% 0%, rgba(148,163,184,0.14), transparent 45%)," +
  "radial-gradient(circle at 80% 110%, rgba(100,116,139,0.12), transparent 50%)," +
  "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.5) 45%, hsl(var(--background)) 100%)";

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
    // { value: "99%", label: "Satisfaction Rate" },
];

/* Identity headline: types "a Developer." then appends a rotating role, so
   the full line — "More than just a Developer. A builder" — reads out. */
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

function StatCard({
  stat,
  index,
  visible,
}: {
  stat: { value: string; label: string; accent: string };
  index: number;
  visible: boolean;
}) {
  const match = stat.value.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match && match.length > 2 ? match[2] : "";
  const animated = useCountUp(target, visible);
  const isDecimal = target % 1 !== 0;
  const display = `${isDecimal ? animated.toFixed(1) : Math.round(animated)}${suffix}`;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-8",
        "shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-500",
        "hover:-translate-y-1 hover:shadow-[0_24px_48px_-14px_rgba(15,23,42,0.2)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{
        transitionDelay: visible ? `${index * 100}ms` : "0ms",
        borderColor: `${stat.accent}2e`,
        backgroundImage: cardBackground(stat.accent),
      }}
    >
      {/* Accent under-glow — lifts the card off the section */}
      <div
        className="pointer-events-none absolute -bottom-7 left-1/2 h-14 w-3/4 -translate-x-1/2 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: stat.accent }}
      />
      {/* Accent glow — intensifies on hover */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${stat.accent}26, transparent 70%)` }}
      />
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">
        <span
          className="font-display text-4xl font-bold"
          style={{ color: stat.accent, textShadow: `0 0 22px ${stat.accent}59` }}
        >
          {display}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
      </div>
    </div>
  );
}

export function AboutSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: skillsRef, isVisible: skillsVisible } = useScrollAnimation();

  return (
    <section id="about" className="scene-about scene-block relative overflow-hidden py-32">
      {/* Background gradient + soft color washes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: ABOUT_BACKGROUND }}
      />
      {/* Section background accent */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div ref={sectionRef} className="mb-20">
          <span
            className={cn(
              "mb-4 inline-block font-mono text-sm uppercase tracking-widest text-primary transition-all duration-700",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            01 / About
          </span>
          <h2
            className={cn(
              "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            More than just <br />
            <IdentityTypewriter />
          </h2>
        </div>

        {/* About content */}
        <div className="grid gap-16 lg:grid-cols-2">
          <div
            ref={sectionRef}
            className={cn(
              "transition-all duration-700 delay-200",
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0",
            )}
          >
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-justify">
              I&apos;m a backend-focused software engineer driven by building
              systems that create real-world impact. From healthcare management
              platforms to education-focused solutions, I design the
              infrastructure that keeps applications reliable, scalable, and
              secure.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-justify">
              I believe great software starts with strong foundations. Clean
              architecture, thoughtful database design, optimized APIs, and
              maintainable code are not afterthoughts — they are the core of
              everything I build. My work emphasizes performance, clarity, and
              long-term scalability.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-justify">
              Beyond implementation, I think in systems and outcomes. I take
              ownership, challenge assumptions, and aim to build backend
              solutions that empower teams, improve workflows, and support
              meaningful user experiences.
            </p>
          </div>

          {/* Stats grid */}
          <div ref={statsRef} className="grid grid-cols-2 gap-6">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} visible={statsVisible} />
            ))}
          </div>
        </div>

        {/* Skills */}
        <div
          ref={skillsRef}
          className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {skills.map((skill, i) => (
            <div
              key={skill.category}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-6",
                "shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-500",
                "hover:-translate-y-1 hover:shadow-[0_24px_48px_-14px_rgba(15,23,42,0.2)]",
                skillsVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
              style={{
                transitionDelay: skillsVisible ? `${i * 100}ms` : "0ms",
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
                style={{
                  backgroundImage: `radial-gradient(circle at 85% 0%, ${skill.accent}1f, transparent 55%)`,
                }}
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
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${skill.accent}17`,
                    borderColor: `${skill.accent}30`,
                    color: skill.accent,
                  }}
                >
                  <skill.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {skill.category}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
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
          ))}
        </div>
      </div>
    </section>
  );
}
