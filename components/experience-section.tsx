"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";

const experiences = [
  {
    period: "July 2024 -- Present",
    role: "Node Js Developer",
    company: "Infoware India",
    description:
      "Architected backend modules for 7+ cross-domain products, advancing scalability through scheduled messaging and route-planning automation.Deployed 5+ external APIs (Stripe, Razorpay, OpenAI, LMS) into core services, broadening capabilities and halving integration timelines.",
    highlights: [
      "Shipped 4 products",
      "Integrated 5+ external services (Stripe, Rag Service, OpenAI, LMS etc.)",
      "Optimized system for processing 1M weekly records scale",
    ],
  },
  {
    period: "January 2024 -- June 2024",
    role: "Node Js Intern",
    company: "Infoware India",
    description:
      "Crafted APIs for HMS and Alumni Portal, weaving in ABDM workflows to handle 1,000+ patient/record exchanges efficiently.Refined backend modules with Sequelize + MySQL query tweaks, elevating data retrieval speeds by 20-30% and code maintainability.",
    highlights: [
      "Optimized MySQL queries by 30%",
      "Improved API response performance",
      "Enhanced backend code maintainability",
    ],
  },
  {
    period: "June 2023 -- July 2023",
    role: "Analyst-I Software Engineer Intern",
    company: "Capgemini",
    description:
      "Contributed in an Agile environment to develop a scalable ABDM APIs library, implementing reliable API functions and enhancing UI components while ensuring secure integrations, maintainable architecture, and adherence to industry best practices.",
    highlights: [
      "Developed scalable ABDM API modules",
      "Worked in Agile sprint environment",
      "Enhanced reusable backend library components",
    ],
  },
];

export function ExperienceSection() {
  const { resolvedTheme } = useTheme();
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    setIsLight(resolvedTheme === "light");
  }, [resolvedTheme]);
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  /* Light theme (locked): Moon gradient + Solid card face */
  const MOON_BG =
    "radial-gradient(circle at 50% 0%, rgba(148,163,184,0.14), transparent 42%), radial-gradient(circle at 90% 110%, rgba(71,85,105,0.12), transparent 46%), linear-gradient(180deg, hsl(0 0% 93%) 0%, hsl(222 22% 86%) 100%)";
  const SOLID_CARD_LIGHT =
    "border-slate-200/80 bg-white shadow-[0_6px_24px_-12px_rgba(15,23,42,0.20)]";

  /* Dark theme (locked): scene navy background + Glass card face */
  const GLASS_CARD_DARK =
    "bg-white/[0.07] border-white/15 backdrop-blur-md shadow-[0_8px_30px_-14px_rgba(0,0,0,0.6)]";

  const dark = !isLight;

  const faceClass = dark ? GLASS_CARD_DARK : SOLID_CARD_LIGHT;
  const accent = dark ? "text-teal-300" : "text-slate-700";
  const caption = dark ? "text-slate-300" : "text-muted-foreground";

  /* Roles index — Terminal (locked): clickable `roles — zsh` window, every item links to its card */
  const rolesIndex = () => {
    return (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/40 bg-slate-900 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.5)]">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] text-slate-400">roles — zsh</span>
          </div>
          <div className="py-1.5 font-mono text-xs">
            {experiences.map((exp, i) => (
              <a
                key={exp.period}
                href={`#experience-${i}`}
                className="group block px-4 py-2.5 transition-colors duration-200 hover:bg-white/5"
              >
                <p className="text-slate-100 transition-colors group-hover:text-teal-300">
                  <span className="mr-2 text-teal-400">❯</span>
                  {exp.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                </p>
                <p className="mt-0.5 pl-6 text-[11px] text-slate-400">
                  {exp.role} · {exp.period}
                </p>
              </a>
            ))}
          </div>
        </div>
      );
  };

  /* Sticky — locked editorial split: sticky intro + numbered index, cards scroll beside */
  const stickyView = () => (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:max-w-xs lg:self-start">
        {headerBlock()}
        <p className={cn("mt-5 max-w-sm text-base leading-relaxed", caption)}>
          Backend engineering across {experiences.length} industries - healthcare, education, and enterprise - always infrastructure-first.
        </p>
        <div className="mt-8 hidden lg:block">
          <p className={cn("font-mono text-xs uppercase tracking-widest", dark ? "text-slate-400" : "text-muted-foreground")}>Roles</p>
          {rolesIndex()}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {experiences.map((exp, i) => (
          <div key={exp.period} id={`experience-${i}`} className="scroll-mt-28">
            <Reveal i={i}>
              <CardBody exp={exp} dark={dark} accent={accent} face={faceClass} />
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );

  const headerBlock = () => (
    <div ref={headerRef}>
      <span
        className={cn(
          "mb-3 inline-block font-mono text-sm uppercase tracking-widest transition-all duration-700",
          dark ? "text-teal-300" : "text-primary",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        Experience
      </span>
      <h2
        className={cn(
          "font-display text-3xl font-bold tracking-tight transition-all duration-700 delay-100 md:text-4xl lg:text-5xl",
          dark ? "text-white" : "text-foreground",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )}
      >
        Where I&apos;ve <br />
        <span className={dark ? "bg-gradient-to-r from-teal-300 to-sky-300 bg-clip-text text-transparent" : "gradient-text"}>been building.</span>
      </h2>
    </div>
  );

  return (
    <section id="experience" className="scene-experience scene-block relative overflow-hidden py-20 lg:py-24">
      {/* Light-theme background gradient (dark keeps the scene navy) */}
      {isLight && (
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: MOON_BG }} />
      )}
      {/* Divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {stickyView()}
        </div>
    </section>
  );
}

function Reveal({ children, i = 0 }: { children: ReactNode; i?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${i * 110}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function CardBody({
  exp,
  dark,
  accent,
  face,
}: {
  exp: (typeof experiences)[0];
  dark?: boolean;
  accent?: string;
  face?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg lg:p-7",
        face,
      )}
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h3 className={cn("font-display text-xl font-bold", dark ? "text-white" : "text-foreground")}>{exp.role}</h3>
          <p className={cn("mt-0.5 font-medium", accent)}>{exp.company}</p>
        </div>
        <span className={cn("shrink-0 font-mono text-xs", dark ? "text-slate-300" : "text-muted-foreground")}>{exp.period}</span>
      </div>
      <p className={cn("mt-3 leading-relaxed", dark ? "text-slate-300" : "text-muted-foreground")}>{exp.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {exp.highlights.map((h) => (
          <span
            key={h}
            className={cn("rounded-full border px-3 py-1 text-xs transition-colors duration-300", dark ? "border-white/15 bg-white/5 text-slate-300 hover:border-teal-300/40 hover:text-white" : "border-border/30 bg-secondary/30 text-muted-foreground hover:border-primary/20 hover:text-foreground")}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}