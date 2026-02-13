"use client";

import { useEffect, useState } from "react";
import { useParallax, useMousePosition } from "@/hooks/use-scroll-animation";
import { MagneticButton } from "@/components/magnetic-button";
import { ArrowDown, Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const scrollY = useParallax();
  const { x, y } = useMousePosition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const parallaxOffset = scrollY * 0.4;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image with parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      {/* Interactive gradient orbs that follow mouse */}
      <div
        className="pointer-events-none absolute z-10 h-96 w-96 rounded-full opacity-20 blur-3xl transition-transform duration-700"
        style={{
          background:
            "radial-gradient(circle, hsl(175 80% 50%), transparent 70%)",
          transform: `translate(${x * 0.02 - 200}px, ${y * 0.02 - 200}px)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 z-10 h-72 w-72 rounded-full opacity-15 blur-3xl transition-transform duration-1000"
        style={{
          background:
            "radial-gradient(circle, hsl(200 80% 60%), transparent 70%)",
          transform: `translate(${-x * 0.015}px, ${y * 0.015 - 100}px)`,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(175 80% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(175 80% 50%) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 text-center lg:px-8">
        {/* Status badge */}
        {/* <div
          className={`mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary transition-all duration-700 ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Available for new opportunities
        </div> */}

        {/* Main heading */}
        <h1
          className={`pt-20 font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl transition-all duration-1000 delay-200 ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <span className="block text-foreground">Hi, I'm Pulak 👋</span>
          <span className="gradient-text block">your goto → </span>
          <span className="block text-foreground">Human Software Engineer</span>
        </h1>

        {/* Subtitle */}
        <p
          className={`mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl transition-all duration-1000 delay-400 ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          Backend focused full stack developer with Hands-on Experience in Solution Design and Implementation
        </p>

        {/* CTA buttons */}
        <div
          className={`mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-1000 delay-500 ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
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
        </div>

        {/* Social links */}
        <div
          className={`mt-16 flex items-center justify-center gap-6 transition-all duration-1000 delay-700 ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          {[
            {
              icon: Github,
              href: "https://github.com/Pulakpj9",
              label: "GitHub",
            },
            {
              icon: Linkedin,
              href: "https://www.linkedin.com/in/pulak-jain-aa1053203/",
              label: "LinkedIn",
            },
            // { icon: Twitter, href: "#", label: "Twitter" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transition-all duration-1000 delay-1000 ${loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Scroll
          </span>
          <div className="relative h-12 w-6 rounded-full border border-border/50">
            <div className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 animate-bounce rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
