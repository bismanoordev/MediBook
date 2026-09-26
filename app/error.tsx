"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F8FAFC] px-5 text-center">
      <div>
        <p className="text-sm font-semibold text-[#0F766E]">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold">We could not load this page.</h1>
        <p className="mt-3 text-slate-600">Please try again. Your data has not been changed.</p>
        <Button onClick={reset} className="mt-6 rounded-full bg-[#0F766E] hover:bg-[#115E59]">Try again</Button>
      </div>
    </div>
  )
}
