"use client";

import { useEffect, useState, useCallback } from "react";
import { useParallax, useMousePosition } from "@/hooks/use-scroll-animation";
import { MagneticButton } from "@/components/magnetic-button";
import { HeroGridIcons } from "@/components/hero-grid-icons";
import { ArrowDown, ArrowUpRight, Briefcase, Building2, Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Card {
  id: string;
  type: "profile" | "link";
  href?: string;
  icon?: typeof Briefcase;
  title?: string;
  subtitle?: string;
}

const cards: Card[] = [
  {
    id: "projects",
    type: "link",
    href: "#projects",
    icon: Briefcase,
    title: "Selected Work",
    subtitle: "View Projects",
  },
  { id: "profile", type: "profile" },
  {
    id: "experience",
    type: "link",
    href: "#experience",
    icon: Building2,
    title: "Experience",
    subtitle: "View Timeline",
  },
];

/* Auto-rotate interval (ms) between cards */
const AUTO_ROTATE_INTERVAL = 5000;

function getCardTransform(index: number, active: number) {
  const offset = index - active;
  const rotation = offset * 10;
  const distance = Math.abs(offset);
  return {
    transform: `rotate(${rotation}deg) translateY(-${distance * 8}px)`,
    transformOrigin: "bottom center",
    zIndex: 30 - distance * 10,
    opacity: distance === 0 ? 1 : 0.85,
    filter: `brightness(${1 - distance * 0.06})`,
    boxShadow: `0 ${4 + distance * 6}px ${12 + distance * 10}px -2px rgba(0,0,0,${0.15 + distance * 0.12})`,
  };
}

export function HeroSection() {
  const scrollY = useParallax();
  const { x, y } = useMousePosition();
  const [loaded, setLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState(1);

  useEffect(() => {
    setLoaded(true);
  }, []);

  /* Auto-rotate through cards in a loop */
  useEffect(() => {
    const id = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const parallaxOffset = scrollY * 0.4;

  const handleCardClick = useCallback((index: number) => {
    setActiveCard(index);
  }, []);

  const handleCardAction = useCallback((card: Card) => {
    if (card.href) {
      document.querySelector(card.href)?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section className="scene-hero scene-block relative flex min-h-screen items-center overflow-hidden">
      {/* Background parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      {/* Interactive gradient orbs */}
      <div
        className="pointer-events-none absolute z-10 h-96 w-96 rounded-full opacity-20 blur-3xl transition-transform duration-700"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
          transform: `translate(${x * 0.02 - 200}px, ${y * 0.02 - 200}px)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 z-10 h-72 w-72 rounded-full opacity-15 blur-3xl transition-transform duration-1000"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--gradient-secondary)), transparent 70%)",
          transform: `translate(${-x * 0.015}px, ${y * 0.015 - 100}px)`,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 z-10 opacity-[0.055]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--grid-line)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--grid-line)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating interactive icons on the grid */}
      <HeroGridIcons />

      {/* Content */}
      <div className="pointer-events-none relative z-20 mx-auto w-full max-w-7xl px-6 py-10 lg:py-0">
        {/* Top row — intro text + card carousel */}
        <div className="grid grid-cols-1 items-end gap-10 lg:mt-20 lg:grid-cols-[1fr_auto] lg:gap-20">
          {/* Intro text */}
          <div
            id="hero-heading"
            className={cn(
              "flex flex-col items-center text-center lg:items-start lg:text-left",
              "transition-all duration-1000 delay-200",
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block text-foreground">
                Hi, I&apos;m Pulak 👋
              </span>
              <span className="gradient-text block">Your Go-To →</span>
              <span className="block text-foreground">
                Human Software Engineer
              </span>
            </h1>
          </div>

          {/* Card carousel — only as wide as needed, pushed to the right */}
          <div
            id="hero-cards"
            className={cn(
              "pointer-events-auto flex flex-col items-center lg:justify-self-end",
              "transition-all duration-1000 delay-500",
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            <div className="relative h-[300px] w-[280px] sm:h-[320px] sm:w-[300px] lg:w-[330px]">
              {cards.map((card, index) => {
                const style = getCardTransform(index, activeCard);
                const isActive = activeCard === index;

                if (card.type === "profile") {
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(index)}
                      className={cn(
                        "absolute inset-0 overflow-hidden rounded-2xl border border-primary-foreground/10",
                      )}
                      style={{
                        ...style,
                        transition:
                          "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.5s ease",
                      }}
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
                        <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),dark:transparent_60%)]" />
                        <span className="font-display text-7xl font-bold text-primary-foreground/90 sm:text-8xl">
                          PJ
                        </span>
                        <div className="mt-3 h-px w-12 bg-primary-foreground/20" />
                        <span className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/50">
                          Software Engineer
                        </span>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      if (isActive) {
                        handleCardAction(card);
                      } else {
                        handleCardClick(index);
                      }
                    }}
                    className={cn(
                      "absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-white transition-colors duration-300 hover:bg-neutral-50",
                      "dark:border-white/10 dark:bg-gradient-to-b dark:from-secondary dark:to-card dark:hover:border-primary/40",
                    )}
                    style={{
                      ...style,
                      transition:
                        "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.5s ease, background-color 0.3s ease",
                    }}
                  >
                    {card.icon && (
                      <card.icon className="mb-4 h-10 w-10 text-primary" />
                    )}
                    <span className="text-lg font-semibold text-foreground">
                      {card.title}
                    </span>
                    <span className="mt-2 flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-primary">
                      {card.subtitle}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation dots */}
            <div className="mt-6 flex gap-2">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    activeCard === index
                      ? "w-6 bg-primary"
                      : "w-2 bg-primary/25 hover:bg-primary/40",
                  )}
                  aria-label={
                    card.type === "profile"
                      ? "View profile card"
                      : `Go to ${card.title}`
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom — subtitle + buttons */}
        <div
          id="hero-bottom"
          className={cn(
            "mt-16 flex flex-col items-center text-center lg:mt-10 lg:items-start lg:text-left",
            "transition-all duration-1000 delay-700",
            loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Backend focused full stack developer with Hands-on Experience in
            Solution Design and Implementation
          </p>

          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <MagneticButton
              href="#projects"
              className="bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
            >
              View My Work
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1" />
            </MagneticButton>
            <MagneticButton
              href="#contact"
              className="border border-border text-foreground hover:border-primary/50 hover:text-primary"
            >
              Let&apos;s Talk
            </MagneticButton>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Pulakpj9"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/pulak-jain-aa1053203"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
