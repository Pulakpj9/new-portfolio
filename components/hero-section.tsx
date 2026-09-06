"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
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

/* Card palette — a hue walk around the color wheel. Any three consecutive
   colors are analogous (neighboring hues), so each transition produces a
   coordinated combo. Shifted by one per transition, wrapping forever.
   `dark` marks shades that need light text. */
const CARD_PALETTE = [
  { bg: "#0d9488", dark: true }, // teal
  { bg: "#0284c7", dark: true }, // sky
  { bg: "#4f46e5", dark: true }, // indigo
  { bg: "#9333ea", dark: true }, // purple
  { bg: "#db2777", dark: true }, // pink
  { bg: "#e11d48", dark: true }, // rose
  { bg: "#ea580c", dark: true }, // orange
  { bg: "#f59e0b", dark: false }, // amber
  { bg: "#65a30d", dark: false }, // lime
  { bg: "#059669", dark: true }, // emerald
];

/* Light-theme card trios — each transition hands the three cards the next
   trio (one color per card), cycling through all three, wrapping forever. */
const CARD_TRIOS = [
  { colors: ["#0d3b66", "#faf0ca", "#f4d35e"], darks: [true, false, false] }, // regal-navy, lemon-chiffon, royal-gold
  { colors: ["#f6f7eb", "#e94f37", "#393e41"], darks: [false, true, true] }, // ivory, fiery-terracotta, gunmetal
  { colors: ["#dce0d9", "#fbf6ef", "#ead7c3"], darks: [false, false, false] }, // alabaster-grey, floral-white, almond-cream
];

function getCardOffset(index: number, active: number) {
  /* Shortest circular distance so cards move one slot per rotation and the
     next card always slides into the middle — no jump on wrap-around. */
  const dist = ((index - active) % cards.length + cards.length) % cards.length;
  return dist > cards.length / 2 ? dist - cards.length : dist;
}

function getCardTransform(index: number, active: number) {
  const offset = getCardOffset(index, active);
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
  const [cardsPaused, setCardsPaused] = useState(false);
  const [phase, setPhase] = useState(0);
  const firstRotation = useRef(true);
  const { resolvedTheme } = useTheme();
  /* Gate on mount: SSR renders with isLight=false so server and first client
     paint agree (no hydration mismatch); we correct to the real theme after
     mount behind the existing entrance transition. */
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(resolvedTheme === "light");
  }, [resolvedTheme]);

  useEffect(() => {
    setLoaded(true);
  }, []);

  /* Each time the visible card changes, the palette advances so the card
     that slides into the middle gets a new color. */
  useEffect(() => {
    if (firstRotation.current) {
      firstRotation.current = false;
      return;
    }
    setPhase((p) => p + 1);
  }, [activeCard]);

  /* Auto-rotate through cards in a loop — next card slides into the middle.
     Paused while hovering the carousel. */
  useEffect(() => {
    if (cardsPaused) return;
    const id = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, [cardsPaused]);

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
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block text-foreground">
                Hi, I&apos;m Pulak <span className="wave-hand">👋</span>
              </span>
              <span className="gradient-text block">Your Go-To →</span>
              <span className="block text-foreground">
                Human Software Engineer
              </span>
            </h1>
          </div>

          {/* Card carousel — hidden on mobile (small screens), only as wide as
              needed, pushed to the right on larger screens */}
          <div
            id="hero-cards"
            onMouseEnter={() => setCardsPaused(true)}
            onMouseLeave={() => setCardsPaused(false)}
            className={cn(
              "pointer-events-auto hidden flex-col items-center sm:flex lg:justify-self-end",
              "transition-all duration-1000 delay-500",
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            <div className="relative h-[300px] w-[280px] sm:h-[320px] sm:w-[300px] lg:w-[330px]">
              {cards.map((card, index) => {
                const style = getCardTransform(index, activeCard);
                const offset = getCardOffset(index, activeCard);
                const isActive = offset === 0;
                const cardBg = isLight
                  ? CARD_TRIOS[phase % CARD_TRIOS.length].colors[index]
                  : CARD_PALETTE[(phase + index) % CARD_PALETTE.length].bg;
                const isDarkBg = isLight
                  ? CARD_TRIOS[phase % CARD_TRIOS.length].darks[index]
                  : CARD_PALETTE[(phase + index) % CARD_PALETTE.length].dark;
                const cardFg = isDarkBg ? "#ffffff" : "#1a1a1a";
                const cardSub = isDarkBg ? "rgba(255, 255, 255, 0.7)" : "rgba(26, 26, 26, 0.6)";
                const cardBorder = isDarkBg ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 26, 26, 0.1)";
                const cardTransition =
                  "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.5s ease, background-color 0.6s ease, border-color 0.6s ease";

                if (card.type === "profile") {
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(index)}
                      className={cn(
                        "absolute inset-0 overflow-hidden rounded-2xl border",
                      )}
                      style={{
                        ...style,
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        transition: cardTransition,
                      }}
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
                        <span
                          className="font-display text-7xl font-bold sm:text-8xl"
                          style={{ color: cardFg }}
                        >
                          PJ
                        </span>
                        <div className="mt-3 h-px w-12" style={{ backgroundColor: cardSub }} />
                        <span
                          className="mt-3 text-xs font-medium uppercase tracking-[0.2em]"
                          style={{ color: cardSub }}
                        >
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
                      "absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border",
                    )}
                    style={{
                      ...style,
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      transition: cardTransition,
                    }}
                  >
                    {card.icon && (
                      <card.icon className="mb-4 h-10 w-10" style={{ color: cardFg }} />
                    )}
                    <span className="text-lg font-semibold" style={{ color: cardFg }}>
                      {card.title}
                    </span>
                    <span
                      className="mt-2 flex items-center gap-1 text-sm"
                      style={{ color: cardSub }}
                    >
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
