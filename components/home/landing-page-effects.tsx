"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const firstViewportLimit = 0.9

function isInInitialViewport(element: HTMLElement) {
  const bounds = element.getBoundingClientRect()
  return bounds.top < window.innerHeight * firstViewportLimit && bounds.bottom > 0
}

export function LandingPageEffects() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    )

    const activate = () => {
      const landingSections = Array.from(document.querySelectorAll<HTMLElement>("[data-landing-page] > section, [data-landing-page] > footer"))
      const optInElements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
      const targets = [...new Set([...landingSections, ...optInElements])]

      targets.forEach((target) => {
        if (target.dataset.revealReady || isInInitialViewport(target)) return

        target.dataset.revealReady = ""
        target.setAttribute("data-scroll-reveal", "")
        target.querySelectorAll<HTMLElement>("[data-reveal-card], [data-landing-page] article").forEach((card, index) => {
          card.classList.add("motion-card")
          card.style.setProperty("--motion-index", String(index % 4))
        })
        observer.observe(target)
      })
    }

    activate()
    const mutations = new MutationObserver(activate)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      observer.disconnect()
    }
  }, [pathname])

  return null
}
