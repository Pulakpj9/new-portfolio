"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { tracker } from "@/lib/analytics/tracker";
import {
  ChevronDown,
  Target,
  Lightbulb,
  Code2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { caseStudies, type CaseStudy } from "@/content/case-studies";

interface CaseStudiesSectionProps {
  expandedStudy: string | null;
  setExpandedStudy: (id: string | null) => void;
}

export function CaseStudiesSection({
  expandedStudy,
  setExpandedStudy,
}: CaseStudiesSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { resolvedTheme } = useTheme();
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    setIsLight(resolvedTheme === "light");
  }, [resolvedTheme]);

  /* Dark theme (locked): Parchment wash + Glass boxes */
  const PARCHMENT_DARK =
    "radial-gradient(circle at 50% 30%, rgba(120,90,50,0.18), transparent 60%), linear-gradient(180deg, rgba(30,22,14,0.55) 0%, rgba(10,8,5,0.8) 100%)";
  const GLASS_DARK =
    "border-white/10 bg-white/[0.06] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.55)] backdrop-blur-md";

  /* Light theme (locked): Dot Matrix wash + Tint boxes */
  const DOTMATRIX_LIGHT =
    "radial-gradient(rgba(15,23,42,0.10) 1px, transparent 1.5px), linear-gradient(180deg, hsl(0 0% 97%) 0%, #ffffff 60%)";
  const DOTMATRIX_SIZE = "24px 24px, auto";
  const TINT_LIGHT = "border-primary/15 bg-primary/[0.04]";

  const washImage = isLight ? DOTMATRIX_LIGHT : PARCHMENT_DARK;
  const washSize = isLight ? DOTMATRIX_SIZE : undefined;
  const boxFace = isLight ? TINT_LIGHT : GLASS_DARK;

  return (
    <section id="case-studies" className="scene-case-study scene-block relative py-32">
      {/* Background accents */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div
        className="pointer-events-none absolute right-0 top-1/3 h-96 w-96"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }}
      />
      {washImage && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: washImage, backgroundSize: washSize }}
        />
      )}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div ref={headerRef} className="mb-20">
          <span
            className={cn(
              "mb-4 inline-block font-mono text-sm uppercase tracking-widest text-primary transition-all duration-700",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            Case Studies
          </span>
          <h2
            className={cn(
              "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            The story behind <br />
            <span className="gradient-text">the work.</span>
          </h2>
          <p
            className={cn(
              "mt-6 max-w-2xl text-lg text-muted-foreground transition-all duration-700 delay-200",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            Every project has a unique journey. Here are the detailed stories of
            challenges faced, solutions crafted, and results delivered.
          </p>
        </div>

        {/* Case studies accordion */}
        <div className="flex flex-col gap-6">
          {caseStudies.map((study, i) => (
            <CaseStudyCard
              key={study.id}
              study={study}
              index={i}
              isExpanded={expandedStudy === study.id}
              face={boxFace}
              onToggle={() =>
                setExpandedStudy(expandedStudy === study.id ? null : study.id)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyCard({
  study,
  index,
  isExpanded,
  onToggle,
  face,
}: {
  study: CaseStudy;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  face?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      data-content={`case-study:${study.id}`}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/50 transition-all duration-700",
        face,
        isExpanded
          ? "border-primary/20 shadow-xl shadow-primary/5"
          : "hover:border-primary/10",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Header (always visible) */}
        <button
          onClick={() => {
            if (!isExpanded) {
              tracker.track("cta_click", {
                content_slug: study.id,
                meta: { target: "expand-case-study", kind: "case-study" },
              });
            }
            onToggle();
          }}
        className="flex w-full items-center gap-6 p-6 text-left transition-colors duration-300 hover:bg-secondary/20 lg:p-8"
        aria-expanded={isExpanded}
      >
        <div className="relative hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl md:block">
          <Image
            src={study.image}
            alt={study.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex-1">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-primary">
            {study.client} &middot; {study.duration}
          </span>
          <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">
            {study.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{study.role}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm font-medium text-primary md:block">
            {isExpanded ? "Close" : "Read More"}
          </span>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border/50 transition-all duration-500",
              isExpanded
                ? "rotate-180 border-primary/30 bg-primary/10"
                : "group-hover:border-primary/30",
            )}
          >
            <ChevronDown className="h-4 w-4 text-primary" />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={cn(
          "grid transition-all duration-700 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/30 p-6 lg:p-8">
            {/* Overview */}
            <div className="mb-10">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {study.overview}
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Challenge */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-semibold">
                    The Challenge
                  </h4>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {study.challenge}
                  </p>
                </div>
              </div>

              {/* Approach */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-semibold">
                    My Approach
                  </h4>
                  <ul className="mt-3 flex flex-col gap-3">
                    {study.approach.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-primary" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Tech stack */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                {study.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/50">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display text-lg font-semibold">Results</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {study.results.map((result) => (
                  <div
                    key={result.metric}
                    className="rounded-xl border border-border/30 bg-secondary/20 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-secondary/30"
                  >
                    <span className="font-display text-3xl font-bold gradient-text">
                      {result.value}
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {result.metric}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            {study.testimonial && (
              <div className="mt-10 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-8">
                <blockquote className="text-lg italic leading-relaxed text-foreground">
                  &ldquo;{study.testimonial.text}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/30" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {study.testimonial.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {study.testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
