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
        {/* Sticky — editorial split: sticky intro + numbered index, cards scroll beside */}
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:max-w-xs lg:self-start">
            {headerBlock()}
            <p className={cn("mt-5 max-w-sm text-base leading-relaxed", caption)}>
              Backend engineering across {experiences.length} industries - healthcare, education, and enterprise - always infrastructure-first.
            </p>
            <div className="mt-8 hidden lg:block">
              <p className={cn("font-mono text-xs uppercase tracking-widest", dark ? "text-slate-400" : "text-muted-foreground")}>Roles</p>
              <ul className="mt-3 flex flex-col gap-3">
                {experiences.map((exp, i) => (
                  <li key={exp.period} className={cn("flex items-baseline gap-3", dark ? "text-slate-300" : "text-foreground")}>
                    <span className={cn("font-mono text-xs", dark ? "text-teal-300" : "text-primary")}>0{i + 1}</span>
                    <div>
                      <p className={cn("font-display text-sm font-semibold", dark ? "text-white" : "text-foreground")}>{exp.company}</p>
                      <p className={cn("font-mono text-xs", caption)}>{exp.period}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            {experiences.map((exp, i) => (
              <Reveal i={i} key={exp.period}>
                <CardBody exp={exp} dark={dark} accent={accent} face={faceClass} />
              </Reveal>
            ))}
          </div>
        </div>
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