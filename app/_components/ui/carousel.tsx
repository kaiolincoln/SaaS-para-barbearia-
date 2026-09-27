"use client"

import { useId, useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/_lib/utils"

export default function Carousel({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const id = useId()
  const scroll = (direction: number) => {
    const element = track.current
    if (!element) return
    element.scrollBy({
      left: direction * element.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }
  return (
    <div className="min-w-0">
      <div className="mb-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Voltar em ${label}`}
          aria-controls={id}
          onClick={() => scroll(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Avançar em ${label}`}
          aria-controls={id}
          onClick={() => scroll(1)}
        >
          <ChevronRight />
        </Button>
      </div>
      <div
        id={id}
        ref={track}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn("carousel-track overflow-x-auto pb-4", className)}
      >
        {children}
      </div>
    </div>
  )
}
