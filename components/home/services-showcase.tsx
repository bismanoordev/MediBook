"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const services = [
  { name: "General checkups", label: "Personalized support", title: "Care designed around your needs.", text: "Plan preventive visits, discuss any concerns, and get clear next steps with a clinician who listens.", image: "/images/care-visit.png", alt: "Doctor caring for a patient", position: "object-[68%_25%]" },
  { name: "Dental care", label: "A brighter care plan", title: "Comfortable care for your smile.", text: "Find a trusted dentist for routine checkups, cleanings, and friendly guidance for your dental health.", image: "/images/service-dental.png", alt: "Dentist discussing care with a patient", position: "object-[65%_35%]" },
  { name: "Laboratory tests", label: "Clearer answers", title: "Testing made easier to understand.", text: "Schedule the tests your care team recommends and keep your health information organized in one place.", image: "/images/service-lab.png", alt: "Laboratory scientist reviewing a sample", position: "object-[60%_25%]" },
  { name: "Pharmacy support", label: "Medication support", title: "Stay on track with your treatment.", text: "Get helpful guidance for prescriptions and make medication questions part of your care conversation.", image: "/images/service-pharmacy.png", alt: "Pharmacist explaining a prescription to a patient", position: "object-[60%_35%]" },
  { name: "Radiology services", label: "Specialist guidance", title: "Know what comes next.", text: "Connect with the right care team when imaging or specialist follow-up is part of your health plan.", image: "/images/service-radiology.png", alt: "Radiologist explaining a scan to a patient", position: "object-[65%_35%]" },
]

export function ServicesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward")
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const service = services[activeIndex]

  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return

    const updateScrollState = () => {
      const scrollEnd = tabs.scrollWidth - tabs.clientWidth
      setCanScrollPrevious(tabs.scrollLeft > 1)
      setCanScrollNext(tabs.scrollLeft < scrollEnd - 1)
    }

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(tabs)
    tabs.addEventListener("scroll", updateScrollState, { passive: true })
    updateScrollState()

    return () => {
      resizeObserver.disconnect()
      tabs.removeEventListener("scroll", updateScrollState)
    }
  }, [])

  function scrollCategories(direction: "previous" | "next") {
    const tabs = tabsRef.current
    if (!tabs) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    tabs.scrollBy({
      left: (direction === "next" ? 1 : -1) * Math.max(tabs.clientWidth * 0.8, 160),
      behavior: reducedMotion ? "auto" : "smooth",
    })
  }

  function selectService(index: number) {
    if (index !== activeIndex) {
      setSlideDirection(index > activeIndex ? "forward" : "backward")
      setActiveIndex(index)
    }

    const selectedTab = tabRefs.current[index]
    if (selectedTab) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      selectedTab.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "nearest" })
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex =
      event.key === "ArrowRight" ? (index + 1) % services.length
        : event.key === "ArrowLeft" ? (index - 1 + services.length) % services.length
          : event.key === "Home" ? 0
            : event.key === "End" ? services.length - 1
              : null

    if (nextIndex === null) return

    event.preventDefault()
    tabRefs.current[nextIndex]?.focus()
    selectService(nextIndex)
  }

  return (
    <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Care that meets you where you are</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Facilities and services</h2>
      </div>
      <div className="mt-11 grid gap-8 lg:grid-cols-[.34fr_.66fr] lg:items-center">
        <div className="flex min-w-0 items-center gap-2">
          {canScrollPrevious && (
            <button
              type="button"
              onClick={() => scrollCategories("previous")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F766E] shadow-sm transition-colors hover:border-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 motion-reduce:transition-none"
              aria-label="Show previous services"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          )}
          <div
            ref={tabsRef}
            className="scrollbar-none flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-0.5 py-1 [-webkit-overflow-scrolling:touch] [touch-action:pan-x]"
            role="tablist"
            aria-label="MediBook services"
          >
            {services.map((item, index) => (
              <button
                key={item.name}
                ref={(element) => { tabRefs.current[index] = element }}
                id={`service-tab-${index}`}
                type="button"
                role="tab"
                aria-controls="service-panel"
                aria-selected={activeIndex === index}
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={() => selectService(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn("min-h-11 shrink-0 snap-start cursor-pointer whitespace-nowrap rounded-full border px-4 py-2.5 text-left text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 motion-reduce:transition-none", activeIndex === index ? "border-[#0F766E] bg-[#0F766E] text-white hover:bg-[#0D5F59]" : "border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:bg-teal-50 hover:text-[#0F766E]")}
              >
                {item.name}
              </button>
            ))}
          </div>
          {canScrollNext && (
            <button
              type="button"
              onClick={() => scrollCategories("next")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F766E] shadow-sm transition-colors hover:border-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 motion-reduce:transition-none"
              aria-label="Show more services"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <article id="service-panel" role="tabpanel" aria-labelledby={`service-tab-${activeIndex}`} key={service.name} className={cn("service-card-enter grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,118,110,.10)] sm:grid-cols-2", slideDirection === "forward" ? "service-card-forward" : "service-card-backward")}>
          <div className="relative min-h-72 bg-[#DDF3F3]">
            <Image key={service.image} src={service.image} alt={service.alt} fill className={cn("object-cover", service.position)} sizes="(max-width: 640px) 100vw, 40vw" />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-9">
            <span className="text-sm font-bold text-[#0F766E]">{service.label}</span>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-.04em]">{service.title}</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">{service.text}</p>
            <Link href="/doctors" className={cn(buttonVariants(), "mt-6 w-fit rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Explore services <ArrowRight className="size-4" /></Link>
          </div>
        </article>
      </div>
    </section>
  )
}
