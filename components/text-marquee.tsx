"use client"

import { cn } from "@/lib/utils"

interface TextMarqueeProps {
  items: string[]
  className?: string
  speed?: number
}

export function TextMarquee({ items, className, speed = 30 }: TextMarqueeProps) {
  const duplicatedItems = [...items, ...items]

  return (
    <div className={cn("relative overflow-hidden py-12", className)}>
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex animate-scroll gap-8 whitespace-nowrap"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {duplicatedItems.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-display text-5xl font-bold tracking-tight text-secondary/80 md:text-7xl lg:text-8xl"
          >
            {item}
            <span className="h-3 w-3 rounded-full bg-primary/30" />
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll linear infinite;
        }
      `}</style>
    </div>
  )
}
