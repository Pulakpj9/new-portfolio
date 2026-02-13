"use client";

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
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className="relative py-32">
      {/* Divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="mb-20">
          <span
            className={cn(
              "mb-4 inline-block font-mono text-sm uppercase tracking-widest text-primary transition-all duration-700",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            Experience
          </span>
          <h2
            className={cn(
              "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            Where I&apos;ve <br />
            <span className="gradient-text">been building.</span>
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-primary/50 via-border to-transparent md:left-8 md:block" />

          <div className="flex flex-col gap-12">
            {experiences.map((exp, i) => (
              <ExperienceCard key={exp.period} experience={exp} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({
  experience,
  index,
}: {
  experience: (typeof experiences)[0];
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={cn(
        "group relative grid gap-4 md:grid-cols-[64px_1fr] md:gap-8 transition-all duration-700",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${index * 150}ms` : "0ms" }}
    >
      {/* Timeline dot */}
      <div className="relative hidden md:flex md:justify-center">
        <div className="absolute top-2 flex h-4 w-4 items-center justify-center">
          <div className="h-3 w-3 rounded-full border-2 border-primary bg-background transition-all duration-300 group-hover:scale-150 group-hover:bg-primary/20" />
          <div className="absolute h-3 w-3 animate-ping rounded-full bg-primary opacity-20" />
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border/50 p-6 transition-all duration-500 hover:border-primary/20 hover:bg-secondary/10 hover:shadow-lg hover:shadow-primary/5 lg:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold">
              {experience.role}
            </h3>
            <p className="text-primary">{experience.company}</p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {experience.period}
          </span>
        </div>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {experience.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {experience.highlights.map((h) => (
            <span
              key={h}
              className="rounded-full border border-border/30 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:border-primary/20 group-hover:text-foreground"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
