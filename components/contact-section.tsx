"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { MagneticButton } from "@/components/magnetic-button"
import { tracker } from "@/lib/analytics/tracker"
import { cn } from "@/lib/utils"
import { Mail, MapPin, ArrowUpRight, Github, Linkedin, Twitter } from "lucide-react"

const contactLinks = [
  {
    label: "Email",
    value: "pulakpj9@gmail.com",
    href: "mailto:pulakpj9@gmail.com",
    icon: Mail,
  },
  {
    label: "Location",
    value: "Ahmedabad, Gujarat",
    href: "#",
    icon: MapPin,
  },
]

const socialLinks = [
  { label: "GitHub", href: "https://github.com/Pulakpj9", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/pulak-jain-aa1053203", icon: Linkedin },
  // { label: "Twitter", href: "#", icon: Twitter },
]

export function ContactSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation()
  const { resolvedTheme } = useTheme()
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    setIsLight(resolvedTheme === "light")
  }, [resolvedTheme])

  /* Locked treatments: Horizon bg + Bold Ink boxes + Mono font */
  const HORIZON_BG = isLight
    ? "linear-gradient(180deg, transparent 30%, rgba(15,23,42,0.045) 50%, transparent 70%)"
    : "linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)";
  const INK = isLight
    ? {
        face: "border-slate-800 bg-slate-900 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.5)]",
        label: "text-slate-400 group-hover:text-white",
        value: "text-white",
        tile: "border-white/15 bg-white/10",
        icon: "text-white",
        arrow: "text-slate-400 group-hover:text-white",
      }
    : {
        face: "border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]",
        label: "text-slate-500 group-hover:text-white",
        value: "text-slate-900 group-hover:text-white",
        tile: "border-slate-200 bg-slate-900/5 group-hover:border-white/20 group-hover:bg-white/15",
        icon: "text-slate-900 group-hover:text-white",
        arrow: "text-slate-500 group-hover:text-white",
      };

  /* Locked hover wash: About Slate (light), deep primary teal (dark) */
  const HOVER_BG_LIGHT =
    "radial-gradient(circle at 85% 100%, rgba(15,23,42,0.85), transparent 65%), radial-gradient(circle at 15% 0%, rgba(30,41,59,0.55), transparent 55%), linear-gradient(180deg, rgba(148,163,184,0.14) 0%, transparent 40%)";
  const HOVER_BG_DARK =
    "linear-gradient(180deg, rgba(11,110,95,0.94) 0%, rgba(8,80,70,0.96) 100%)";
  const hoverWash = isLight ? HOVER_BG_LIGHT : HOVER_BG_DARK;

  /* Locked social style: Bar */
  const socialWrap =
    "inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1.5 shadow-sm";
  const socialBtn =
    "h-10 w-10 border border-transparent hover:bg-primary/10 hover:text-primary hover:shadow-none";

  /* (locked box styles live in INK above) */

  return (
    <section id="contact" className="scene-contact scene-block relative py-32">
      {/* Top border */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Background accents */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.07) 0%, transparent 70%)" }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: HORIZON_BG }} />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div ref={headerRef}>
            <span
              className={cn(
                "mb-4 inline-block font-mono text-sm uppercase tracking-widest text-primary transition-all duration-700",
                headerVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
            >
              Contact
            </span>
            <h2
              className={cn(
                "font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl transition-all duration-700 delay-100",
                headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              )}
            >
              Let&apos;s build <br />
              <span className="gradient-text">something great.</span>
            </h2>
            <p
              className={cn(
                "mt-6 max-w-md text-lg leading-relaxed text-muted-foreground transition-all duration-700 delay-200",
                headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              )}
            >
              I&apos;m always excited to work on meaningful projects. Whether you have a
              specific idea or just want to explore possibilities, I&apos;d love to hear
              from you.
            </p>

            <div
              className={cn(
                "mt-10 transition-all duration-700 delay-300",
                headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              )}
            >
              <MagneticButton
                href="mailto:pulakpj9@gmail.com"
                onClick={() =>
                  tracker.track("cta_click", { meta: { target: "email" } })
                }
                className="bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
              >
                Say Hello
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </MagneticButton>
            </div>
          </div>

          {/* Right column */}
          <div ref={contentRef} className="flex flex-col justify-center">
            {/* Contact info */}
            <div className="flex flex-col gap-6">
              {contactLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={
                    link.href.startsWith("mailto:")
                      ? () =>
                          tracker.track("cta_click", {
                            meta: { target: "email" },
                          })
                      : undefined
                  }
                  className={cn(
                    "group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/50 p-6 transition-all duration-500 hover:translate-x-1.5 hover:border-primary/20 hover:bg-secondary/30 hover:shadow-lg hover:shadow-primary/5",
                    INK.face,
                    contentVisible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-8 opacity-0"
                  )}
                  style={{
                    transitionDelay: contentVisible ? `${i * 100}ms` : "0ms",
                  }}
                >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:shadow-[inset_0_0_50px_rgba(0,0,0,0.35)]"
                      style={{ backgroundImage: hoverWash }}
                    />
                  <div className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10",
                    INK.tile,
                  )}>
                    <link.icon className={cn(
                      "h-5 w-5 text-primary",
                      INK.icon,
                    )} />
                  </div>
                  <div className="relative">
                    <span className={cn(
                      "block font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-300",
                      INK.label,
                    )}>
                      {link.label}
                    </span>
                    <span className={cn(
                      "font-mono text-lg font-medium text-foreground transition-colors duration-300",
                      INK.value,
                    )}>
                      {link.value}
                    </span>
                  </div>
                  <ArrowUpRight className={cn(
                    "relative ml-auto h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    INK.arrow,
                  )} />
                </a>
              ))}
            </div>

            {/* Social links */}
            <div
              className={cn(
                "mt-10 transition-all duration-700 delay-300",
                contentVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
            >
              <p className="mb-4 text-sm text-muted-foreground">
                Connect with me
              </p>
              <div className={cn(socialWrap)}>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    onClick={() =>
                      tracker.track("social_click", {
                        meta: { network: social.label.toLowerCase() },
                      })
                    }
                    className={cn(
                      "group flex h-12 w-12 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/10",
                      isLight && "border-slate-300/80 shadow-sm",
                      socialBtn,
                    )}
                  >
                    <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
              <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">
                Anonymous analytics only —{" "}
                <a href="/privacy" className="hover:text-primary hover:underline">
                  how measuring works
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
