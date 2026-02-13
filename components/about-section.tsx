"use client";

import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import { Code2, Layers, Zap, Cpu } from "lucide-react";

const skills = [
  {
    category: "Frontend",
    icon: Zap,
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    color: "from-primary to-cyan-400",
  },
  {
    category: "Backend",
    icon: Cpu,
    items: ["Node.js", "Express.js", "Docker", "Socket.io", "Microservices"],
    color: "from-blue-400 to-primary",
  },
  {
    category: "Database",
    icon: Layers,
    items: ["MySQL", "MongoDB"],
    color: "from-primary to-teal-300",
  },
  {
    category: "Tools",
    icon: Code2,
    items: ["Git", "VS Code", "Github", "Postman", "Swagger"],
    color: "from-teal-300 to-cyan-400",
  },
];

const stats = [
  { value: "1.5+", label: "Years Full Time Experience" },
  { value: "5+", label: "months internship Experience" },
  { value: "4+", label: "Projects Shipped" },
    { value: "2+", label: "Projects Ongoing" },
    // { value: "99%", label: "Satisfaction Rate" },
];

export function AboutSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: skillsRef, isVisible: skillsVisible } = useScrollAnimation();

  return (
    <section id="about" className="relative py-32">
      {/* Section background accent */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
            <span className="gradient-text">a developer.</span>
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
              <div
                key={stat.label}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/50 p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  statsVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0",
                )}
                style={{
                  transitionDelay: statsVisible ? `${i * 100}ms` : "0ms",
                }}
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <span className="font-display text-4xl font-bold gradient-text">
                    {stat.value}
                  </span>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
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
                "group relative overflow-hidden rounded-2xl border border-border/50 p-6 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5",
                skillsVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
              style={{
                transitionDelay: skillsVisible ? `${i * 100}ms` : "0ms",
              }}
            >
              {/* Top gradient bar */}
              <div
                className={cn(
                  "absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                  skill.color,
                )}
              />

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 transition-colors duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
                  <skill.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {skill.category}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {skill.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border/30 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:border-primary/20 group-hover:text-foreground"
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
