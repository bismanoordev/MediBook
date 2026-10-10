"use client"

import { Copy, Phone } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function DoctorAppointmentContact({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false)
  async function copyPhone() {
    try { await navigator.clipboard.writeText(phone); setCopied(true); toast.success("Phone number copied."); window.setTimeout(() => setCopied(false), 2000) } catch { toast.error("We couldn't copy the phone number. Please try again.") }
  }
  return <><p className="mt-3 break-words text-base font-medium text-slate-900">{phone}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><a href={`tel:${phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"><Phone className="size-4" aria-hidden="true" />Call</a><button type="button" onClick={() => void copyPhone()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"><Copy className="size-4" aria-hidden="true" />{copied ? "Copied" : "Copy"}</button></div></>
}
