"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const services = [
  { name: "General checkups", label: "Personalized support", title: "Care designed around your needs.", text: "Plan preventive visits, discuss any concerns, and get clear next steps with a clinician who listens.", image: "/images/care-visit.png", alt: "Doctor caring for a patient", position: "object-[68%_25%]" },
  { name: "Dental care", label: "A brighter care plan", title: "Comfortable care for your smile.", text: "Find a trusted dentist for routine checkups, cleanings, and friendly guidance for your dental health.", image: "/images/medibook-hero-doctor.png", alt: "Doctor in a bright clinic", position: "object-[60%_8%]" },
  { name: "Laboratory tests", label: "Clearer answers", title: "Testing made easier to understand.", text: "Schedule the tests your care team recommends and keep your health information organized in one place.", image: "/images/care-team.png", alt: "Healthcare team discussing a care plan", position: "object-[58%_18%]" },
  { name: "Pharmacy support", label: "Medication support", title: "Stay on track with your treatment.", text: "Get helpful guidance for prescriptions and make medication questions part of your care conversation.", image: "/images/doctor-alex.png", alt: "Doctor in a modern clinic", position: "object-[50%_10%]" },
  { name: "Radiology services", label: "Specialist guidance", title: "Know what comes next.", text: "Connect with the right care team when imaging or specialist follow-up is part of your health plan.", image: "/images/doctor-sofia.png", alt: "Doctor in a modern clinic", position: "object-[50%_10%]" },
]

export function ServicesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const service = services[activeIndex]

  return (
    <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Care that meets you where you are</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Facilities and services</h2>
      </div>
      <div className="mt-11 grid gap-8 lg:grid-cols-[.34fr_.66fr] lg:items-center">
        <div className="flex overflow-x-auto pb-1 lg:block lg:space-y-1" role="tablist" aria-label="MediBook services">
          {services.map((item, index) => (
            <button key={item.name} type="button" role="tab" aria-selected={activeIndex === index} onClick={() => setActiveIndex(index)} className={cn("shrink-0 cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] lg:block lg:w-full", activeIndex === index ? "bg-[#CCFBF1] text-[#0F766E]" : "text-slate-600 hover:bg-slate-50 hover:text-[#0F766E]")}>{item.name}</button>
          ))}
        </div>
        <article className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,118,110,.10)] sm:grid-cols-2">
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
