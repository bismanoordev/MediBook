"use client"

import { useId, useState } from "react"

export function AppointmentReason({ reason }: { reason: string }) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const canExpand = reason.length > 60

  return (
    <div className="mt-2 min-w-0">
      <p
        id={contentId}
        title={expanded ? undefined : reason}
        className={expanded ? "whitespace-pre-wrap break-words text-sm text-slate-500" : "truncate text-sm text-slate-500"}
      >
        Reason: {reason}
      </p>
      {canExpand ? (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 text-xs font-semibold text-[#0F766E] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  )
}
