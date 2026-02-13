"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  strength?: number
}

export function MagneticButton({
  children,
  className,
  onClick,
  href,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: position.x === 0 ? "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)" : "transform 0.15s ease-out",
  }

  const props = {
    ref: ref as React.RefObject<HTMLButtonElement>,
    className: cn(
      "relative group inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all duration-300",
      className
    ),
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style,
  }

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={props.className}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={style}
      >
        {children}
      </a>
    )
  }

  return (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  )
}
