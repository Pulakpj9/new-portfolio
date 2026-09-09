"use client"

import { useEffect, useRef } from "react"

/* Zero-React-state cursor ring: a single rAF loop mutates DOM refs directly
   (no re-renders on mousemove), hover detection uses mouseover delegation
   (no elementFromPoint/getComputedStyle polling), and no mix-blend-mode
   (no full-page repaints under the cursor). */
export function CursorFollower() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let scale = 1
    let shown = false
    let raf = 0

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        shown = true
        ring.style.opacity = "1"
        dot.style.opacity = "1"
      }
    }

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      scale = t?.closest?.("a, button, [role='button']") ? 1.6 : 1
    }

    const loop = () => {
      rx += (x - rx) * 0.22
      ry += (y - ry) * 0.22
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("mouseover", onOver, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("mouseover", onOver)
    }
  }, [])

  return (
    <>
      {/* Outer ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-8 w-8 rounded-full border border-primary/40 opacity-0 transition-opacity duration-300 md:block"
      />
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-1 w-1 rounded-full bg-primary opacity-0 transition-opacity duration-300 md:block"
      />
    </>
  )
}
