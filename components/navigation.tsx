"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#projects" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Contact", href: "#contact" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.3,
      rootMargin: "-80px 0px -50% 0px",
    })

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section)
    })

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "glass py-3"
            : "bg-transparent py-6"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <a
            href="#"
            className="font-display text-xl font-bold tracking-tight transition-colors duration-300 hover:text-primary"
          >
            <span className="gradient-text">PJ</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
                  activeSection === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeSection === link.href && (
                  <span className="absolute inset-0 rounded-full bg-primary/10" />
                )}
                <span className="relative">{link.label}</span>
              </a>
            ))}
            <a
              href="#contact"
              className="ml-4 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-medium text-primary transition-all duration-300 hover:bg-primary/10 hover:border-primary/50"
            >
              Get in Touch
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-50 flex items-center justify-center rounded-full p-2 text-foreground transition-colors hover:text-primary md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 transition-all duration-500 md:hidden",
          isMobileMenuOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
        )}
        style={{
          background: "hsl(222 47% 5% / 0.95)",
          backdropFilter: "blur(30px)",
        }}
      >
        {navLinks.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "font-display text-3xl font-bold transition-all duration-500",
              isMobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
              activeSection === link.href
                ? "gradient-text"
                : "text-foreground hover:text-primary"
            )}
            style={{ transitionDelay: isMobileMenuOpen ? `${i * 80}ms` : "0ms" }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  )
}
