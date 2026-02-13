"use client";

import { useState } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Target,
  Lightbulb,
  Code2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  duration: string;
  role: string;
  image: string;
  overview: string;
  challenge: string;
  approach: string[];
  techStack: string[];
  results: { metric: string; value: string; description: string }[];
  testimonial?: { text: string; author: string; role: string };
}

const caseStudies: CaseStudy[] = [
  {
    id: "activity-tracker",
    title: "Scaling a Real-Time Workforce Activity Monitoring System",
    client: "Internal Product / SaaS Platform",
    duration: "Ongoing Optimization Phase",
    role: "Backend Engineer (Performance Optimization)",
    image: "/images/webtracker.png",
    overview:
      "The Activity Tracker platform monitors user interactions including application usage, web activity, keystrokes, attendance logs, and daily working hours. As user activity volume increased, the system faced performance bottlenecks and database strain.",
    challenge:
      "High-frequency real-time data ingestion was causing database load spikes and inconsistent server stability. The system needed improved uptime, optimized queries, and a scalable backend structure to handle nearly 1M weekly records without performance degradation.",
    approach: [
      "Refactored core backend modules to improve stability and maintainability",
      "Implemented SQL query optimization and indexing strategies",
      "Reduced redundant real-time DB operations through architectural tuning",
      "Enhanced error handling and production monitoring",
      "Improved API efficiency for high-volume activity ingestion",
    ],
    techStack: ["Node.js", "TypeScript", "MySQL", "Sequelize", "AWS S3"],
    results: [
      {
        metric: "Server Uptime",
        value: "99.9%",
        description: "Stabilized production reliability",
      },
      {
        metric: "Database Load",
        value: "-50%",
        description: "Reduced real-time operational strain",
      },
      {
        metric: "Data Volume",
        value: "~1M/week",
        description: "Handled high-frequency activity logs",
      },
    ],
  },
  {
    id: "whatsapp-crm",
    title: "Building a Scalable WhatsApp Automation & CRM Engine",
    client: "SaaS CRM Platform",
    duration: "6+ months",
    role: "Backend Developer",
    image: "/images/whatsapp-crm.png",
    overview:
      "The WhatsApp CRM platform was designed to help businesses automate customer communication using WhatsApp Cloud API. The goal was to enable no-code automation workflows and integrate payment, AI, and knowledge-based services.",
    challenge:
      "Businesses needed a flexible automation system that could manage conversational flows, integrate multiple third-party services, and execute time-based triggers reliably at scale. The backend required modular architecture to support extensibility and rapid feature rollout.",
    approach: [
      "Developed a reusable Flow Builder with 12+ no-code automation elements",
      "Integrated WhatsApp Cloud API for scalable messaging workflows",
      "Coordinated 5+ service integrations including OpenAI, Stripe, Razorpay, and RAG",
      "Implemented scheduled and trigger-based automation handling",
      "Designed modular backend services for extensibility",
    ],
    techStack: [
      "Node.js",
      "MongoDB",
      "WhatsApp Cloud API",
      "OpenAI",
      "Stripe",
      "Razorpay",
    ],
    results: [
      {
        metric: "Setup Speed",
        value: "4x Faster",
        description: "Reduced automation configuration time",
      },
      {
        metric: "Integrations",
        value: "5+",
        description: "Payments, AI, and knowledge services connected",
      },
      {
        metric: "Automation Modules",
        value: "12+",
        description: "Reusable no-code flow elements built",
      },
    ],
  },
  {
    id: "salesapp",
    title: "Optimizing Field Sales Operations with Smart Backend Automation",
    client: "Sales Distribution Organization",
    duration: "5 months",
    role: "Backend Developer",
    image: "/images/salesapp.png",
    overview:
      "SalesApp was developed to streamline operations for field sales teams by automating order management, inventory tracking, visit logging, and route planning. The platform required reliable backend orchestration for real-time coordination.",
    challenge:
      "Manual planning and route assignment were causing inefficiencies and inconsistent delivery performance. The backend needed structured workflow automation and optimized route sequencing to reduce operational friction for 30+ field staff.",
    approach: [
      "Built backend foundation supporting multi-channel sales workflows",
      "Designed route sequencing and assignment algorithms",
      "Automated order, inventory, and visit tracking modules",
      "Structured scalable REST APIs for mobile and web clients",
      "Improved planning efficiency through optimized logic",
    ],
    techStack: ["Node.js", "TypeScript", "MySQL", "REST APIs"],
    results: [
      {
        metric: "Field Staff Supported",
        value: "30+",
        description: "Enabled structured sales operations",
      },
      {
        metric: "Planning Efficiency",
        value: "30-40%",
        description: "Reduced manual route effort",
      },
      {
        metric: "Workflow Automation",
        value: "Orders & Inventory",
        description: "Digitized core sales processes",
      },
    ],
  },
];

export function CaseStudiesSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  return (
    <section id="case-studies" className="relative py-32">
      {/* Background accents */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />

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
            03 / Case Studies
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
}: {
  study: CaseStudy;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/50 transition-all duration-700",
        isExpanded
          ? "border-primary/20 shadow-xl shadow-primary/5"
          : "hover:border-primary/10",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
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
