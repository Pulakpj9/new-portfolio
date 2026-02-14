"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { MagneticButton } from "@/components/magnetic-button"
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

  return (
    <section id="contact" className="relative py-32">
      {/* Top border */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Background accents */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

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
              04 / Contact
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
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border border-border/50 p-6 transition-all duration-500 hover:border-primary/20 hover:bg-secondary/20 hover:shadow-lg hover:shadow-primary/5",
                    contentVisible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-8 opacity-0"
                  )}
                  style={{
                    transitionDelay: contentVisible ? `${i * 100}ms` : "0ms",
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                      {link.label}
                    </span>
                    <span className="text-lg font-medium text-foreground">
                      {link.value}
                    </span>
                  </div>
                  <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="group flex h-12 w-12 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
                  >
                    <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
