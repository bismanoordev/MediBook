"use client"

import Link from "next/link"
import { RotateCcw, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function DoctorDetailsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-h-screen bg-[#F8FAFC]"><main className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-5 py-12 sm:px-8"><section role="alert" className="w-full max-w-lg rounded-[22px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Stethoscope className="size-6" aria-hidden="true" /></span><h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">We couldn’t load this doctor right now</h1><p className="mt-3 text-sm leading-6 text-slate-600">Please check your connection and try again. Your booking details have not been changed.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button type="button" onClick={reset} className="min-h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]"><RotateCcw className="size-4" /> Try again</Button><Link href="/doctors" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Back to all doctors</Link></div></section></main></div>
}
