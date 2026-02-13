"use client"

import { useEffect, useState } from "react"
import { useMousePosition } from "@/hooks/use-scroll-animation"

export function CursorFollower() {
  const { x, y } = useMousePosition()
  const [isVisible, setIsVisible] = useState(false)
  const [isPointer, setIsPointer] = useState(false)

  useEffect(() => {
    // Only show on non-touch devices
    const hasPointer = window.matchMedia("(pointer: fine)").matches
    if (!hasPointer) return

    setIsVisible(true)

    const handlePointerChange = () => {
      const hoveredEl = document.elementFromPoint(x, y)
      if (!hoveredEl) return
      const computed = window.getComputedStyle(hoveredEl)
      setIsPointer(
        computed.cursor === "pointer" ||
          hoveredEl.tagName === "A" ||
          hoveredEl.tagName === "BUTTON" ||
          hoveredEl.closest("a") !== null ||
          hoveredEl.closest("button") !== null
      )
    }

    const interval = setInterval(handlePointerChange, 100)
    return () => clearInterval(interval)
  }, [x, y])

  if (!isVisible) return null

  return (
    <>
      {/* Outer ring */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden rounded-full border border-primary/30 mix-blend-difference md:block"
        style={{
          width: isPointer ? 48 : 32,
          height: isPointer ? 48 : 32,
          transform: `translate(${x - (isPointer ? 24 : 16)}px, ${y - (isPointer ? 24 : 16)}px)`,
          transition: "width 0.3s, height 0.3s, transform 0.15s ease-out",
        }}
      />
      {/* Inner dot */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden rounded-full bg-primary md:block"
        style={{
          width: isPointer ? 8 : 4,
          height: isPointer ? 8 : 4,
          transform: `translate(${x - (isPointer ? 4 : 2)}px, ${y - (isPointer ? 4 : 2)}px)`,
          transition: "width 0.3s, height 0.3s, transform 0.08s ease-out",
        }}
      />
    </>
  )
}
