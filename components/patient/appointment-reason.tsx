"use client"

import { useId, useState } from "react"

export function AppointmentReason({ reason }: { reason: string }) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const canExpand = reason.length > 60

  return (
    <div className="mt-2 min-w-0">
      <div className={expanded ? "min-w-0" : "flex min-w-0 items-baseline gap-1.5"}>
        <span className="shrink-0 text-sm text-slate-500">Reason:</span>
        <p
          id={contentId}
          title={expanded ? undefined : reason}
          className={expanded ? "mt-1 whitespace-pre-wrap break-words text-sm text-slate-500" : "min-w-0 flex-1 truncate text-sm text-slate-500"}
        >
          {reason}
        </p>
        {!expanded && canExpand ? (
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded={expanded}
            onClick={() => setExpanded(true)}
            className="shrink-0 text-xs font-semibold text-[#0F766E] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Show more
          </button>
        ) : null}
      </div>
      {expanded && canExpand ? (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded(false)}
          className="mt-1 text-xs font-semibold text-[#0F766E] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
        >
          Show less
        </button>
      ) : null}
    </div>
  )
}
