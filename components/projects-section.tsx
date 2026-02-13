"use client";

import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const projects = [
  {
    id: "activity-tracker",
    title: "Activity Tracker",
    tagline: "Smart Activity Tracking for Modern Teams.",
    description:
      "Optimized backend performance for a real-time user activity tracking platform monitoring application usage, web activity, keystrokes, attendance, and work hours. Improved system reliability by refactoring core modules and enhancing error handling, achieving 99.9% server uptime. Reduced real-time database load by 50% through SQL query optimization and indexing strategies.",
    image: "/images/webtracker.png",
    tags: ["TypeScript", "Node.js", "MySQL", "Sequelize", "AWS S3"],
    color: "from-primary to-cyan-400",
    metrics: [
      { label: "Data velocity (records/week)", value: "~1M (approx.)" },
      { label: "Uptime", value: "99.9%" },
    ],
  },
  {
    id: "whatsapp-crm",
    title: "WhatsApp CRM",
    tagline: "Automate Conversations. Scale Customer Engagement.",
    description:
      "Built a scalable backend for a WhatsApp CRM platform enabling automated customer engagement workflows. Developed a reusable Flow Builder with 12+ no-code elements, reducing automation setup time by 4x. Integrated WhatsApp Cloud API with OpenAI, Stripe, Razorpay, and RAG services, along with time-based triggers for streamlined outreach and conversational commerce.",
    video: "/videos/crmdemo.mp4",
    tags: ["Node.js", "MongoDB", "WhatsApp Cloud API", "OpenAI", "Stripe"],
    color: "from-green-500 to-emerald-400",
    metrics: [
      { label: "No-code elements", value: "12+" },
      { label: "Service integrations", value: "5+" },
      { label: "Setup time reduced", value: "4x faster" },
    ],
  },
  {
    id: "salesapp",
    title: "SalesApp",
    tagline: "Optimizing Field Sales Through Smart Automation.",
    description:
      "Engineered the backend foundation for a multi-channel sales platform supporting 30+ field staff. Automated order management, inventory tracking, visit logging, and route planning workflows. Designed route sequencing and assignment algorithms that improved delivery precision and reduced planning effort by 30–40%, enhancing overall operational efficiency.",
    video: "/videos/salesapp-video.mp4",
    tags: ["Node.js", "MySQL", "TypeScript", "REST APIs"],
    color: "from-orange-500 to-amber-400",
    metrics: [
      { label: "Field staff supported", value: "30+" },
      { label: "Planning efficiency gain", value: "30–40%" },
      { label: "Modules automated", value: "Orders, Inventory, Routes" },
    ],
  },
];

type Project = (typeof projects)[number];

interface ProjectsSectionProps {
  expandedStudy: string | null;
  setExpandedStudy: (id: string | null) => void;
}

export function ProjectsSection({
  expandedStudy,
  setExpandedStudy,
}: ProjectsSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  const handleViewCaseStudy = (caseStudyId: string) => {
    setExpandedStudy(caseStudyId);

    setTimeout(() => {
      const section = document.getElementById("case-studies");
      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 180);
  };

  return (
    <section id="projects" className="relative py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />

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
            02 / Selected Work
          </span>
          <h2
            className={cn(
              "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
          >
            Projects I&apos;m <br />
            <span className="gradient-text">proud of.</span>
          </h2>
        </div>

        <div className="flex flex-col gap-32">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onViewCaseStudy={handleViewCaseStudy}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: Project;
  index: number;
  onViewCaseStudy: (id: string) => void;
}

function ProjectCard({ project, index, onViewCaseStudy }: ProjectCardProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const [isHovered, setIsHovered] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={cn(
        "group grid gap-8 lg:grid-cols-2 lg:gap-16 items-center transition-all duration-1000",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
      )}
    >
      <div className={cn("relative", isEven ? "lg:order-1" : "lg:order-2")}>
        <div
          className="relative overflow-hidden rounded-2xl border border-border/30 transition-all duration-700 group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              "absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-500",
              isHovered ? "opacity-60" : "opacity-0",
            )}
          />

          <div
            className={cn(
              "absolute inset-0 z-20 flex items-center justify-center transition-all duration-500",
              isHovered ? "opacity-100" : "opacity-0",
            )}
          >
            <button
              onClick={() => onViewCaseStudy(project.id)}
              className="flex items-center gap-2 rounded-full border border-foreground/20 bg-background/60 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-background/80"
            >
              View Case Study
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {project.video ? (
            <video
              src={project.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              width={800}
              height={500}
              className={cn(
                "w-full transition-transform duration-700",
                isHovered ? "scale-105" : "scale-100",
              )}
            />
          ) : (
            <Image
              src={project.image || ""}
              alt={`${project.title} project screenshot`}
              width={800}
              height={500}
              className={cn(
                "w-full transition-transform duration-700",
                isHovered ? "scale-105" : "scale-100",
              )}
            />
          )}
        </div>

        <div
          className={cn(
            "absolute -z-10 h-32 w-32 rounded-full blur-3xl transition-all duration-700",
            isEven ? "-bottom-8 -right-8" : "-bottom-8 -left-8",
            isHovered ? "opacity-30" : "opacity-0",
          )}
          style={{
            background: `linear-gradient(135deg, hsl(175 80% 50%), hsl(200 80% 60%))`,
          }}
        />
      </div>

      <div className={cn(isEven ? "lg:order-2" : "lg:order-1")}>
        <span
          className={cn(
            "mb-3 inline-block font-mono text-xs uppercase tracking-wider text-primary",
          )}
        >
          {project.tagline}
        </span>

        <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {project.title}
        </h3>

        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-8 flex gap-8">
          {project.metrics.map((metric) => (
            <div key={metric.label}>
              <span className="font-display text-2xl font-bold gradient-text">
                {metric.value}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-300 hover:border-primary/30 hover:text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
