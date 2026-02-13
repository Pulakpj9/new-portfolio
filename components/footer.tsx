"use client"

import { ArrowUp } from "lucide-react"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="relative border-t border-border/30 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="font-display text-lg font-bold tracking-tight"
          >
            <span className="gradient-text">PJ</span>
          </a>
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Pulak Jain. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-muted-foreground">
            Crafted with passion & precision
          </span>
          <button
            onClick={scrollToTop}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
