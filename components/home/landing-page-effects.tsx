"use client"

import { useEffect } from "react"

export function LandingPageEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-landing-page] > section, [data-landing-page] > footer"))
    const cards = sections.flatMap((section) => Array.from(section.querySelectorAll<HTMLElement>("article")))

    sections.forEach((section) => section.setAttribute("data-scroll-reveal", ""))
    cards.forEach((card, index) => {
      card.classList.add("motion-card")
      card.style.setProperty("--motion-index", String(index % 4))
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return null
}
